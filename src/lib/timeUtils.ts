// src/lib/timeUtils.ts

export interface TimeDifference {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  }
  
  export function calculateTimeDifference(startDate: Date, endDate: Date): TimeDifference {
    const differenceMs = endDate.getTime() - startDate.getTime();
  
    if (differenceMs < 0) {
      // Should ideally not happen for 'since' counters, but handle defensively
      return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    }
  
    const totalSeconds = Math.floor(differenceMs / 1000);
    const days = Math.floor(totalSeconds / (60 * 60 * 24));
    const hours = Math.floor((totalSeconds % (60 * 60 * 24)) / (60 * 60));
    const minutes = Math.floor((totalSeconds % (60 * 60)) / 60);
    const seconds = totalSeconds % 60;
  
    return { days, hours, minutes, seconds };
  }