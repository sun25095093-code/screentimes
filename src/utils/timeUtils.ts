/**
 * Time utility functions for ScreenTime reset and duration formatting
 */

/**
 * Returns the most recent reset hour Date object relative to the given 'now' date.
 */
export function getMostRecentFourAM(now: Date, resetHour: number = 4): Date {
  const resetTime = new Date(now);
  resetTime.setHours(resetHour, 0, 0, 0);

  // If current time is before the reset hour today, the most recent reset was yesterday
  if (now.getTime() < resetTime.getTime()) {
    resetTime.setDate(resetTime.getDate() - 1);
  }
  return resetTime;
}

/**
 * Checks if a reset should happen based on the last reset timestamp.
 * If the last reset was before the most recent reset hour, a reset is required.
 */
export function shouldReset(lastResetStr: string, now: Date, resetHour: number = 4): boolean {
  if (!lastResetStr) return true;
  const lastReset = new Date(lastResetStr);
  const targetFourAM = getMostRecentFourAM(now, resetHour);
  
  return lastReset.getTime() < targetFourAM.getTime();
}

/**
 * Returns the next reset hour Date object.
 */
export function getNextFourAM(now: Date, resetHour: number = 4): Date {
  const nextFourAM = new Date(now);
  nextFourAM.setHours(resetHour, 0, 0, 0);

  // If it's already past the reset hour today, the next reset hour is tomorrow
  if (now.getTime() >= nextFourAM.getTime()) {
    nextFourAM.setDate(nextFourAM.getDate() + 1);
  }
  return nextFourAM;
}

/**
 * Gets the number of seconds until the next reset hour.
 */
export function getSecondsUntilNextFourAM(now: Date, resetHour: number = 4): number {
  const nextFourAM = getNextFourAM(now, resetHour);
  return Math.max(0, Math.floor((nextFourAM.getTime() - now.getTime()) / 1000));
}

/**
 * Formats seconds into "HH시간 MM분 SS초" or "MM분 SS초" or "SS초".
 */
export function formatDuration(seconds: number): string {
  if (seconds <= 0) return "0초";
  
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  
  const parts: string[] = [];
  if (h > 0) parts.push(`${h}시간`);
  if (m > 0) parts.push(`${m}분`);
  if (s > 0 || parts.length === 0) parts.push(`${s}초`);
  
  return parts.join(" ");
}

/**
 * Formats seconds into digital style "HH:MM:SS" always (including hours)
 * Supports negative numbers by prepending a minus sign.
 */
export function formatDigitalTime(seconds: number): string {
  const isNegative = seconds < 0;
  const absSeconds = Math.abs(seconds);
  const h = Math.floor(absSeconds / 3600);
  const m = Math.floor((absSeconds % 3600) / 60);
  const s = Math.floor(absSeconds % 60);
  
  const hh = h.toString().padStart(2, '0');
  const mm = m.toString().padStart(2, '0');
  const ss = s.toString().padStart(2, '0');
  
  return `${isNegative ? '-' : ''}${hh}:${mm}:${ss}`;
}
