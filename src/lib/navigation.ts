import {
  LayoutDashboard,
  Clock,
  Calendar,
  CheckSquare,
  MessageCircle,
  Mail,
  Users,
  PartyPopper,
  Shield,
  Settings,
  Video
} from "lucide-react";

export const navItems = [
  { key: "nav.dashboard", path: "/", icon: LayoutDashboard },
  { key: "nav.ponto", path: "/ponto", icon: Clock },
  { key: "nav.agenda", path: "/agenda", icon: Calendar },
  { key: "nav.tasks", path: "/tasks", icon: CheckSquare },
  { key: "nav.chat", path: "/chat", icon: MessageCircle },
  { key: "nav.videochat", path: "/videochat", icon: Video },
  { key: "nav.messages", path: "/messages", icon: Mail },
  { key: "nav.teams", path: "/teams", icon: Users },
  { key: "nav.dates", path: "/dates", icon: PartyPopper },
];

export const bottomItems = [
  { key: "nav.admin", path: "/admin", icon: Shield },
  { key: "nav.settings", path: "/settings", icon: Settings },
];
