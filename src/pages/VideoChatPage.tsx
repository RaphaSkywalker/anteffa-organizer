import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  MonitorUp,
  Circle,
  MessageSquare,
  MoreHorizontal,
  PhoneMissed,
  Link as LinkIcon,
  Maximize2,
  Users,
  Search,
  ChevronDown,
  ChevronUp,
  Settings,
  Send
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

const VideoChatPage = () => {
  const { user, api } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  
  // App States
  const [employees, setEmployees] = useState<any[]>([]);
  const [activeParticipant, setActiveParticipant] = useState<any>(null);
  const [isCallActive, setIsCallActive] = useState(false);

  // Current Date & Time
  const [currentDateTime, setCurrentDateTime] = useState("");
  
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const dateStr = now.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
      const timeStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      setCurrentDateTime(`${dateStr} | ${timeStr}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 60000); // update every minute
    return () => clearInterval(interval);
  }, []);

  // Media controls states
  const [micEnabled, setMicEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);

  // Fetch true employees
  useEffect(() => {
    async function fetchEmployees() {
      try {
        const data = await api('/api/employees');
        if (Array.isArray(data)) {
           setEmployees(data.filter((e: any) => String(e.id) !== String(user?.id)));
        }
      } catch (err) {
        console.error("Error fetching employees:", err);
      }
    }
    fetchEmployees();
  }, [user, api]);

  // Mock data for sidebars
  const participants = [
    { id: 1, name: "Dianne Russell", role: "Manager", avatar: "https://i.pravatar.cc/150?u=dianne", micOn: true, videoOn: false },
    { id: 2, name: "Guy Hawkins", role: "Developer", avatar: "https://i.pravatar.cc/150?u=guy", micOn: false, videoOn: false },
    { id: 3, name: "Kathryn Murphy", role: "Designer", avatar: "https://i.pravatar.cc/150?u=kathryn", micOn: false, videoOn: true },
  ];

  const thumbnails = [
    { id: 4, name: "Cassie Jung", avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=200&auto=format&fit=crop", micOn: false },
    { id: 5, name: "Alice Wong", avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=200&auto=format&fit=crop", micOn: true },
    { id: 6, name: "Theresa Webb", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop", micOn: true },
    { id: 7, name: "Christian Wong", avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=200&auto=format&fit=crop", micOn: false },
  ];

  // Initialize Media Stream
  useEffect(() => {
    let activeStream: MediaStream | null = null;

    if (isCallActive) {
      navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then((mediaStream) => {
          setStream(mediaStream);
          activeStream = mediaStream;
          if (videoRef.current) {
            videoRef.current.srcObject = mediaStream;
          }
        })
        .catch((err) => console.error("Error accessing media devices.", err));
    } else {
      setStream((prevStream) => {
        if (prevStream) {
          prevStream.getTracks().forEach((track) => track.stop());
        }
        return null;
      });
    }

    return () => {
      // Cleanup streams on unmount or when call ends
      if (activeStream) {
        activeStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isCallActive]);

  // Update tracks when toggle buttons are clicked
  useEffect(() => {
    if (stream) {
      stream.getAudioTracks().forEach((track) => (track.enabled = micEnabled));
      stream.getVideoTracks().forEach((track) => (track.enabled = videoEnabled));
    }
  }, [micEnabled, videoEnabled, stream]);

  // Recording timer effect mock
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => setRecordingTime(prev => prev + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `00:${mins}:${secs}`;
  };

  const toggleMic = () => setMicEnabled(!micEnabled);
  const toggleVideo = () => setVideoEnabled(!videoEnabled);
  const toggleRecording = () => setIsRecording(!isRecording);

  // Remove endCall as it's no longer used

  return (
    <div className="h-[calc(100vh-8.5rem)]">
      <div className="h-full w-full glass-card border border-border bg-background/40 text-foreground rounded-[2rem] overflow-hidden flex flex-col md:flex-row shadow-2xl relative">
      
      {/* Main Video Area */}
      <div className="flex-1 flex flex-col p-4 lg:p-6 overflow-hidden">
        
        {/* Header */}
        <header className="flex justify-between items-center mb-6 shrink-0">
          <div>
            <h1 className="text-xl font-bold text-foreground">Video Chamada - Equipe ANTEFFA</h1>
            <p className="text-sm text-muted-foreground mt-1 capitalize">{currentDateTime}</p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex -space-x-3">
               {employees.slice(0, 3).map((p) => (
                 <Avatar key={p.id} className="border-2 border-background w-10 h-10 hover:z-10 relative transition-transform">
                    {p.avatar_url ? (
                       <AvatarImage src={`http://${window.location.hostname}:3001${p.avatar_url}`} />
                    ) : (
                       <AvatarFallback>{(p.name || p.username || '?')[0]}</AvatarFallback>
                    )}
                 </Avatar>
               ))}
               {employees.length > 3 && (
                 <div className="w-10 h-10 rounded-full bg-primary/20 text-primary border-2 border-background flex items-center justify-center font-bold text-xs relative z-10">
                   +{employees.length - 3}
                 </div>
               )}
            </div>
            <Button variant="outline" className="bg-primary/10 border-primary/30 text-primary hover:bg-primary/20 gap-2">
              <LinkIcon className="w-4 h-4" />
              cem-jnmt-hsu
            </Button>
          </div>
        </header>

        {/* Big Video Showcase */}
        <div className="flex-1 relative rounded-2xl overflow-hidden bg-muted/30 group border border-border shadow-lg backdrop-blur-sm">
          {videoEnabled && isCallActive ? (
            <video 
              ref={videoRef} 
              autoPlay 
              muted 
              playsInline 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-card/40">
              <Avatar className="w-32 h-32 mb-4 border-4 border-primary/20">
                {user?.avatar_url ? (
                   <AvatarImage src={`http://${window.location.hostname}:3001${user.avatar_url}`} />
                ) : (
                   <AvatarFallback className="text-4xl bg-primary/20 text-primary">{user?.name?.[0] || 'U'}</AvatarFallback>
                )}
              </Avatar>
              <h2 className="text-2xl font-bold text-foreground">{user?.name || 'Você'}</h2>
              <p className="text-muted-foreground mt-2 flex items-center gap-2">
                 <VideoOff className="w-4 h-4" /> {!isCallActive ? "Aguardando Início..." : "Câmera Desligada"}
              </p>
            </div>
          )}

          {/* Overlays */}
          {isRecording && (
            <div className="absolute top-4 left-4 bg-card/60 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-2 border border-border">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></span>
              <span className="text-sm font-semibold text-foreground tracking-widest">{formatTime(recordingTime)}</span>
            </div>
          )}

          <div className="absolute top-4 right-4 bg-card/50 hover:bg-card/80 transition p-2 rounded-xl backdrop-blur-sm cursor-pointer border border-border">
            <Maximize2 className="w-5 h-5 text-foreground" />
          </div>

          <div className="absolute bottom-4 left-4 bg-card/60 backdrop-blur-md px-4 py-2 rounded-xl border border-border">
            <span className="text-sm font-medium text-foreground">{user?.name || 'Você (Apresentador)'}</span>
          </div>

          <div className="absolute bottom-4 right-4 bg-card/60 backdrop-blur-md p-2 rounded-xl border border-border">
            <div className="flex gap-1 items-end h-6 w-6 justify-center pb-1">
               <div className={cn("w-1  bg-green-400 rounded-full", micEnabled ? "h-2 animate-pulse" : "h-1 bg-red-500")}></div>
               <div className={cn("w-1  bg-green-400 rounded-full", micEnabled ? "h-4 animate-pulse delay-75" : "h-1 bg-red-500")}></div>
               <div className={cn("w-1  bg-green-400 rounded-full", micEnabled ? "h-3 animate-pulse delay-150" : "h-1 bg-red-500")}></div>
            </div>
          </div>
        </div>

        {/* Thumbnails Row */}
        <div className="h-32 mt-4 grid grid-cols-4 gap-4 shrink-0">
          {isCallActive ? thumbnails.map((thumb) => (
            <div key={thumb.id} className="relative rounded-2xl overflow-hidden bg-muted/40 border border-border group">
              <img src={thumb.avatar} alt={thumb.name} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
              <div className="absolute bottom-2 left-2 bg-card/80 backdrop-blur-md px-2 py-1 rounded-lg text-xs font-medium text-foreground">
                {thumb.name}
              </div>
              <div className={cn(
                "absolute bottom-2 right-2 p-1.5 rounded-full backdrop-blur-md",
                thumb.micOn ? "bg-primary/80" : "bg-red-500/80"
              )}>
                {thumb.micOn ? <Mic className="w-3 h-3 text-white" /> : <MicOff className="w-3 h-3 text-white" />}
              </div>
            </div>
          )) : (
            [...Array(4)].map((_, i) => (
              <div key={i} className="relative rounded-2xl overflow-hidden bg-card/20 border border-border/50 flex flex-col items-center justify-center">
                 <VideoOff className="w-6 h-6 text-muted-foreground/30 mb-2" />
                 <p className="text-[9px] text-muted-foreground/50 font-black uppercase tracking-[0.2em]">Sem Sinal</p>
              </div>
            ))
          )}
        </div>

        {/* Bottom Tool Bar */}
        <div className="mt-6 flex justify-center items-center gap-4 shrink-0">
          <Button 
            onClick={toggleMic}
            variant="outline" 
            size="icon" 
            className={cn(
              "w-12 h-12 rounded-full border-0 transition-all",
              micEnabled ? "bg-primary/20 text-primary hover:bg-primary/30" : "bg-red-500 text-white hover:bg-red-600"
            )}
          >
            {micEnabled ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
          </Button>

          <Button 
            onClick={toggleVideo}
            variant="outline" 
            size="icon" 
            className={cn(
              "w-12 h-12 rounded-full border-0 transition-all",
              videoEnabled ? "bg-primary/20 text-primary hover:bg-primary/30" : "bg-red-500 text-white hover:bg-red-600"
            )}
          >
            {videoEnabled ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
          </Button>

          <Button 
            variant="outline" 
            size="icon" 
            className="w-12 h-12 rounded-full bg-muted/50 border-0 hover:bg-muted text-foreground transition-all"
          >
            <MonitorUp className="w-6 h-6" />
          </Button>

          <Button 
            onClick={toggleRecording}
            variant="outline" 
            size="icon" 
            className={cn(
              "w-12 h-12 rounded-full border-0 transition-all",
              isRecording ? "bg-red-500/20 text-red-500 hover:bg-red-500/30 ring-2 ring-red-500/50 outline-none" : "bg-muted/50 hover:bg-muted text-foreground"
            )}
          >
            <Circle className="w-6 h-6 fill-current" />
          </Button>

          <Button 
            variant="outline" 
            size="icon" 
            className="w-12 h-12 rounded-full bg-muted/50 border-0 hover:bg-muted text-foreground transition-all xl:hidden"
          >
            <MessageSquare className="w-6 h-6" />
          </Button>

          <Button 
            variant="outline" 
            size="icon" 
            className="w-12 h-12 rounded-full bg-muted/50 border-0 hover:bg-muted text-foreground transition-all"
          >
            <MoreHorizontal className="w-6 h-6" />
          </Button>

          <div className="w-px h-8 bg-border mx-2"></div>

          {isCallActive ? (
            <Button 
              onClick={() => setIsCallActive(false)}
              variant="destructive" 
              className="rounded-full px-8 h-12 font-bold text-base shadow-lg shadow-red-500/20 hover:scale-105 transition-all"
            >
              Encerrar
            </Button>
          ) : (
            <Button 
              onClick={() => setIsCallActive(true)}
              className="bg-green-500 hover:bg-green-600 text-white rounded-full px-8 h-12 font-bold text-base shadow-lg shadow-green-500/20 hover:scale-105 transition-all border-0"
            >
              INICIAR 
            </Button>
          )}
        </div>

      </div>

      {/* Right Sidebar (Participants & Chat) */}
      <div className="w-80 border-l border-border bg-muted/10 flex-col hidden lg:flex">
        
        {/* Participants Top Section */}
        <div className="p-6 border-b border-border flex flex-col h-1/2 overflow-hidden">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-foreground flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Participantes ({employees.length + 1})
            </h3>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground rounded-lg">
               <ChevronUp className="w-4 h-4" />
            </Button>
          </div>

          <div className="relative mb-4">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input 
              placeholder="Buscar..." 
              className="pl-9 bg-card/50 border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-primary shadow-sm"
            />
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-3">
             <div className="flex items-center justify-between p-2 hover:bg-muted/50 rounded-xl transition">
               <div className="flex items-center gap-3">
                 <Avatar className="w-10 h-10 border border-border">
                   {user?.avatar_url ? (
                      <AvatarImage src={`http://${window.location.hostname}:3001${user.avatar_url}`} />
                   ) : (
                      <AvatarFallback className="bg-primary/20 text-primary">{user?.name?.[0] || 'U'}</AvatarFallback>
                   )}
                 </Avatar>
                 <div>
                   <p className="text-sm font-semibold text-foreground">{user?.name || 'Você'}</p>
                   <p className="text-xs text-primary font-medium">Moderador</p>
                 </div>
               </div>
               <div className="flex items-center gap-2">
                 {micEnabled ? <Mic className="w-4 h-4 text-primary" /> : <MicOff className="w-4 h-4 text-destructive" />}
                 {videoEnabled ? <Video className="w-4 h-4 text-primary" /> : <VideoOff className="w-4 h-4 text-destructive" />}
               </div>
             </div>

             {employees.map((p) => (
                <div 
                  key={p.id} 
                  onClick={() => setActiveParticipant(p)}
                  className={cn(
                    "flex flex-col cursor-pointer p-2 hover:bg-muted/50 rounded-xl transition",
                    activeParticipant?.id === p.id && "bg-muted/80 shadow-sm border border-border"
                  )}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10 border border-border">
                        {p.avatar_url ? (
                           <AvatarImage src={`http://${window.location.hostname}:3001${p.avatar_url}`} />
                        ) : (
                           <AvatarFallback>{(p.name || p.username || '?')[0]}</AvatarFallback>
                        )}
                      </Avatar>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{p.name || p.username}</p>
                        <p className="text-xs text-muted-foreground font-medium">{p.role || "Funcionário"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mic className="w-4 h-4 text-muted-foreground opacity-30" />
                      <Video className="w-4 h-4 text-muted-foreground opacity-30" />
                    </div>
                  </div>
                </div>
             ))}
          </div>
        </div>

        {/* Chat Bottom Section */}
        <div className="flex-1 flex flex-col p-6 overflow-hidden bg-background/40">
          <div className="flex justify-between items-center mb-6">
            <div className="flex gap-4 items-center">
               <h3 className="font-bold text-foreground">Chat</h3>
               <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary text-xs font-bold leading-tight">
                 {activeParticipant ? (activeParticipant.name || activeParticipant.username) : "Selecione..."}
               </span>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground rounded-lg">
               <Settings className="w-4 h-4" />
            </Button>
          </div>

          <div className={cn(
             "flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-4 mb-4 bg-chat-pattern bg-cover",
             !activeParticipant && "flex flex-col items-center justify-center"
          )}>
             {!activeParticipant ? (
               <div className="text-center opacity-40 flex flex-col items-center gap-3">
                  <div className="p-3 bg-muted rounded-full">
                     <MessageSquare className="w-6 h-6 text-foreground" />
                  </div>
                  <p className="text-xs font-semibold text-foreground tracking-wide">Selecione um funcionário na lista<br/>para iniciar o chat</p>
               </div>
             ) : (
               <div className="text-center opacity-60 flex flex-col items-center gap-2 mt-4">
                  <p className="text-xs italic text-muted-foreground bg-card/60 px-3 py-1 rounded-full">Este chat est\u00e1 vazio.</p>
               </div>
             )}
          </div>

          <div className="relative mt-auto">
             <Input 
                placeholder={activeParticipant ? "Digite sua mensagem..." : "Selecione um chat..."} 
                disabled={!activeParticipant}
                className="pl-4 pr-12 py-5 bg-card/60 backdrop-blur-sm shadow-inner border-border text-foreground placeholder:text-muted-foreground rounded-xl focus-visible:ring-primary disabled:opacity-50"
             />
             <Button disabled={!activeParticipant} size="icon" className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-lg gradient-brand text-primary-foreground shadow-lg disabled:opacity-50">
               <Send className="w-4 h-4" />
             </Button>
          </div>
        </div>

      </div>
    </div>
    </div>
  );
};

export default VideoChatPage;
