import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { TimeRange, TimeRangeValue } from "./types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getDateRange(timeRange?: TimeRange | TimeRangeValue): { start?: Date, end?: Date } {
  if (!timeRange) return {};

  const calculateDate = (range: TimeRange, isStart: boolean): Date | undefined => {
    if (range === "all") return isStart ? undefined : new Date(0); // 1970

    const now = new Date();
    switch (range) {
      case "24h":
        now.setHours(now.getHours() - 24);
        break;
      case "week":
        now.setDate(now.getDate() - 7);
        break;
      case "month":
        now.setMonth(now.getMonth() - 1);
        break;
      case "year":
        now.setFullYear(now.getFullYear() - 1);
        break;
    }
    return now;
  };

  if (Array.isArray(timeRange)) {
    // tuple [inner, outer] or [start, end]
    // The slider goes from 24h (0) to All (4).
    // range[0] is the 'Newer' bound (e.g. 24h)
    // range[1] is the 'Older' bound (e.g. Year)
    const start = calculateDate(timeRange[0], true);
    const end = calculateDate(timeRange[1], false);
    return { start, end };
  } else {
    // single value means "from this point until now"
    const end = calculateDate(timeRange, false);
    return { start: new Date(), end };
  }
}