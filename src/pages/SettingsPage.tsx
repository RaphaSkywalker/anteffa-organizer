import { API_URL } from "../config";
import { motion } from "framer-motion";
import { User, Mail, Lock, Camera, Save, Key, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import { toast } from "sonner";

const fadeIn = { initial: { opacity: 0, y: 12 } as const, animate: { opacity: 1, y: 0 } as const, transition: { duration: 0.4 } };

export default function SettingsPage() {
  const { user, api, updateUser } = useAuth();
  const [name, setName] = useState(user?.name || user?.username || "");
  const [email, setEmail] = useState(user?.email || "");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(
    user?.avatar_url ? `${API_URL}${user.avatar_url}` : null
  );
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [isChangingPass, setIsChangingPass] = useState(false);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    try {
      await api("/api/profile", {
        method: "PUT",
        body: JSON.stringify({ name, email }),
      });
      updateUser({ name, email });
      toast.success("Perfil atualizado com sucesso!");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error("A imagem deve ter no máximo 2MB");
        return;
      }

      const formData = new FormData();
      formData.append("avatar", file);

      try {
        const data = await api("/api/upload-avatar", {
          method: "POST",
          body: formData,
        });
        const fullAvatarUrl = `${API_URL}${data.avatar_url}`;
        setAvatarPreview(fullAvatarUrl);
        updateUser({ avatar_url: data.avatar_url });
        toast.success("Avatar atualizado com sucesso!");
      } catch (error: any) {
        toast.error(error.message);
      }
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("As novas senhas não coincidem");
      return;
    }

    setIsChangingPass(true);
    try {
      await api("/api/change-password", {
        method: "POST",
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      toast.success("Senha alterada com sucesso!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsChangingPass(false);
    }
  };

  return (
    <div className="space-y-8 pb-20">
      <motion.div {...fadeIn}>
        <h1 className="text-3xl font-bold text-foreground tracking-tight">Meu Perfil</h1>
        <p className="text-muted-foreground mt-1">Gerencie suas informações pessoais e segurança</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Card */}
        <motion.div {...fadeIn} className="lg:col-span-1 space-y-6">
          <div className="glass-card rounded-2xl border border-border p-6 flex flex-col items-center text-center shadow-xl">
            <div className="relative group">
              <div className="w-24 h-24 rounded-full gradient-brand flex items-center justify-center text-primary-foreground text-3xl font-bold shadow-2xl relative overflow-hidden">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  (name || user?.username || "U")[0].toUpperCase()
                )}
              </div>
              <label
                htmlFor="avatar-upload"
                className="absolute bottom-0 right-0 p-2 bg-background border border-border rounded-full shadow-lg hover:bg-muted transition-colors group-hover:scale-110 cursor-pointer"
              >
                <Camera className="w-4 h-4 text-foreground" />
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                />
              </label>
            </div>
            <div className="mt-4">
              <h2 className="text-xl font-bold text-foreground">{name || user?.username}</h2>
              <p className="text-sm text-muted-foreground capitalize">{user?.role === 'admin' ? 'Administrador' : 'Funcionário'}</p>
            </div>
            <div className="w-full pt-6 mt-6 border-t border-border space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Status da Conta</span>
                <span className="text-success font-semibold px-2 py-0.5 bg-success/10 rounded-full">Ativa</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">ID do Usuário</span>
                <span className="text-foreground">#{user?.id}</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Edit Forms */}
        <motion.div {...fadeIn} className="lg:col-span-2 space-y-6">
          <div className="glass-card rounded-2xl border border-border p-8 shadow-xl">
            <div className="flex items-center gap-2 mb-6">
              <User className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold text-foreground">Informações Pessoais</h3>
            </div>
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Nome Completo</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      className="w-full pl-10 pr-4 py-2 rounded-xl bg-muted/30 border border-border focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">E-mail Corporativo</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      className="w-full pl-10 pr-4 py-2 rounded-xl bg-muted/30 border border-border focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-xl font-semibold shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                >
                  {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>

          <div className="glass-card rounded-2xl border border-border p-8 shadow-xl">
            <div className="flex items-center gap-2 mb-6">
              <Key className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold text-foreground">Segurança da Conta</h3>
            </div>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Senha Atual</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="password"
                    className="w-full pl-10 pr-4 py-2 rounded-xl bg-muted/30 border border-border focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    placeholder="••••••••"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Nova Senha</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="password"
                      className="w-full pl-10 pr-4 py-2 rounded-xl bg-muted/30 border border-border focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Confirmar Nova Senha</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="password"
                      className="w-full pl-10 pr-4 py-2 rounded-xl bg-muted/30 border border-border focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  disabled={isChangingPass}
                  className="flex items-center gap-2 px-6 py-2.5 bg-foreground text-background rounded-xl font-semibold shadow-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                >
                  {isChangingPass ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                  Atualizar Senha
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
