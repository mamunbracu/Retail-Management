import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Shift } from './types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function calculateHours(start: string, end: string): number {
  if (!start || !end) return 0;
  const [startH, startM] = start.split(':').map(Number);
  const [endH, endM] = end.split(':').map(Number);
  
  let diffMinutes = (endH * 60 + endM) - (startH * 60 + startM);
  if (diffMinutes < 0) diffMinutes += 24 * 60; // Handle overnight shifts if needed
  
  return Number((diffMinutes / 60).toFixed(2));
}

export function isShiftInProgress(shift: Shift): boolean {
  const now = new Date();
  const [startH, startM] = shift.startTime.split(':').map(Number);
  const [endH, endM] = shift.endTime.split(':').map(Number);
  
  const start = new Date(shift.date);
  start.setHours(startH, startM, 0, 0);
  
  const end = new Date(shift.date);
  end.setHours(endH, endM, 0, 0);
  
  return now >= start && now <= end;
}
