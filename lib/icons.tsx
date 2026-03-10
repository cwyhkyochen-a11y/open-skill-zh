import {
  FileText,
  Image,
  Video,
  Link,
  Twitter,
  Instagram,
  Youtube,
  Facebook,
  Linkedin,
  MessageSquare,
  MessageCircle,
  Music,
  Send,
  Hash,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Clock,
  Settings,
  BarChart,
  User,
  Key,
  Plus,
  Trash2,
  Edit,
  RefreshCw,
  type LucideIcon,
} from 'lucide-react';

// 内容类型图标
export const ContentTypeIcons: Record<string, LucideIcon> = {
  text: FileText,
  image: Image,
  video: Video,
  link: Link,
};

// 平台图标
export const PlatformIcons: Record<string, LucideIcon> = {
  twitter: Twitter,
  instagram: Instagram,
  youtube: Youtube,
  facebook: Facebook,
  linkedin: Linkedin,
  reddit: MessageSquare,
  discord: MessageCircle,
  tiktok: Music,
  telegram: Send,
  slack: Hash,
  pinterest: Image,
  tumblr: FileText,
};

// 状态图标
export const StatusIcons = {
  success: CheckCircle,
  warning: AlertTriangle,
  error: XCircle,
  pending: Clock,
  active: CheckCircle,
  disconnected: XCircle,
};

// 功能图标
export const ActionIcons = {
  publish: Send,
  settings: Settings,
  records: BarChart,
  accounts: User,
  oauth: Key,
  add: Plus,
  delete: Trash2,
  edit: Edit,
  refresh: RefreshCw,
};

// 获取内容类型图标
export function getContentTypeIcon(type: string): LucideIcon {
  return ContentTypeIcons[type] || FileText;
}

// 获取平台图标
export function getPlatformIcon(platform: string): LucideIcon {
  return PlatformIcons[platform] || MessageSquare;
}

// 获取状态图标
export function getStatusIcon(status: string): LucideIcon {
  return StatusIcons[status as keyof typeof StatusIcons] || Clock;
}
