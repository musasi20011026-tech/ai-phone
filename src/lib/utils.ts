import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPhone(phone: string): string {
  if (!phone) return '';
  if (phone.startsWith('+81')) {
    const local = '0' + phone.slice(3);
    // 11桁（携帯）: 0XX-XXXX-XXXX
    const match11 = local.match(/^(\d{3})(\d{4})(\d{4})$/);
    if (match11) return `${match11[1]}-${match11[2]}-${match11[3]}`;
    // 10桁（固定）: 0X-XXXX-XXXX
    const match10 = local.match(/^(\d{2,4})(\d{2,4})(\d{4})$/);
    if (match10) return `${match10[1]}-${match10[2]}-${match10[3]}`;
    return local;
  }
  return phone;
}

export function formatDuration(seconds: number): string {
  if (!seconds || seconds < 0) return '0秒';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}分${s}秒` : `${s}秒`;
}

export function timeAgo(dateStr: string): string {
  if (!dateStr) return '';
  const now = new Date();
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '';
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diff < 0) return '今';
  if (diff < 60) return `${diff}秒前`;
  if (diff < 3600) return `${Math.floor(diff / 60)}分前`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}時間前`;
  return `${Math.floor(diff / 86400)}日前`;
}
