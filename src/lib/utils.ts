import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date): string {
  const d = new Date(date);
  const now = new Date();
  const diffTime = d.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays === -1) return 'Yesterday';
  if (diffDays > 0 && diffDays <= 7) {
    return d.toLocaleDateString('en-US', { weekday: 'long' });
  }
  
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
}

export function formatTime(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export function getCategoryColor(category: string): string {
  const colors = {
    Work: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    Personal: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    Health: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    Travel: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    Education: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
    Entertainment: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
    Other: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  };
  
  return colors[category as keyof typeof colors] || colors.Other;
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
} 