import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Photo } from '@/types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const sortPhotosByOrderIndex = (photos: Photo[]): Photo[] => {
  return [...photos].sort((a, b) => {
    // 1. If both have order_index, compare them.
    if (a.order_index !== undefined && b.order_index !== undefined) {
      if (a.order_index !== b.order_index) {
        return a.order_index - b.order_index;
      }
    }

    // 2. If one has order_index and the other doesn't, the one with order_index comes first.
    if (a.order_index !== undefined && b.order_index === undefined) return -1;
    if (a.order_index === undefined && b.order_index !== undefined) return 1;

    // 3. If neither has order_index, sort by timestamp (ascending).
    const timeA = a.timestamp ? new Date(a.timestamp).getTime() : Infinity;
    const timeB = b.timestamp ? new Date(b.timestamp).getTime() : Infinity;

    if (timeA !== timeB) {
      return timeA - timeB;
    }

    // 4. Fallback to id for stable sort
    return a.id.localeCompare(b.id);
  });
};
