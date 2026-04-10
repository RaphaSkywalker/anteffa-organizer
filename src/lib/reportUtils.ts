import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const exportEmployeePDF = async (type: 'daily' | 'monthly', user: any, logs: any[], monthlyStats: any[], selectedDate: Date) => {
    const doc = new jsPDF();
    const titleText = type === 'daily' ? 'Folha de Ponto Diária' : 'Folha de Ponto Mensal';
    const userLogin = (user?.name || 'usuario').split(' ')[0].toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const dateFormatted = selectedDate.toISOString().split('T')[0];
    const period = type === 'daily' ? 'dia' : 'mes';
    const filename = `${userLogin}_ponto_${period}_${dateFormatted}.pdf`;

    // Static Assets helper
    const getBase64 = async (url: string) => {
        try {
            const fullUrl = url.startsWith('http') ? url : `${window.location.origin}${url}`;
            const response = await fetch(fullUrl);
            const blob = await response.blob();
            return new Promise<string>((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.readAsDataURL(blob);
            });
        } catch (e) { return null; }
    };

    const footerLogo = await getBase64('/logo-anteffa-footer.png');
    let avatarBase64 = null;
    if (user?.avatar_url) {
        avatarBase64 = await getBase64(user.avatar_url.startsWith('http') ? user.avatar_url : `http://${window.location.hostname}:3001${user.avatar_url}`);
    }

    // Header
    if (avatarBase64) {
        doc.setDrawColor(220, 220, 220);
        doc.setLineWidth(0.5);
        doc.rect(14, 12, 20, 20, 'S');
        doc.addImage(avatarBase64, 'JPEG', 14.5, 12.5, 19, 19);
    }

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 41, 59);
    doc.text(user?.name || 'Colaborador', 38, 19);
    
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    doc.text(user?.team_name || 'Equipe não informada', 38, 24);

    if (footerLogo) {
        doc.addImage(footerLogo, 'PNG', 163, 12, 32, 0);
    }

    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 41, 59);
    doc.text(titleText, 105, 50, { align: 'center' });

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const periodText = type === 'daily' ? `Data: ${selectedDate.toLocaleDateString('pt-BR')}` : `Mês de Referência: ${selectedDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}`;
    doc.text(periodText, 105, 58, { align: 'center' });

    // Table
    if (type === 'daily') {
        autoTable(doc, {
            startY: 70,
            head: [['Horário', 'Tipo', 'Localização', 'Status']],
            body: logs.map(l => [
                l.punch_time.substring(0, 5),
                l.punch_type === 'entrada' ? 'Entrada' : l.punch_type === 'saida' ? 'Saída' : 'Intervalo',
                l.location_category,
                l.is_finalized ? 'Finalizado' : 'Pendente'
            ]),
            styles: { fontSize: 9, cellPadding: 4 },
            headStyles: { fillColor: [59, 130, 246] }
        });
    } else {
        autoTable(doc, {
            startY: 70,
            head: [['Data', 'Entrada', 'Saída Almoço', 'Retorno Almoço', 'Saída', 'Total']],
            body: monthlyStats.map(s => [
                s.date.split('-').reverse().slice(0, 2).join('/'),
                s.punches.entrada,
                s.punches.almoco_saida,
                s.punches.almoco_retorno,
                s.punches.saida,
                `${s.hours}h`
            ]),
            styles: { fontSize: 8, cellPadding: 3 },
            headStyles: { fillColor: [59, 130, 246] }
        });

        const totalHours = monthlyStats.reduce((acc, curr) => acc + curr.hours, 0);
        const finalY = (doc as any).lastAutoTable.finalY + 10;
        doc.setFont("helvetica", "bold");
        doc.text(`Total de Horas no Mês: ${totalHours.toFixed(1)}h`, 14, finalY);
    }

    doc.save(filename);
};
