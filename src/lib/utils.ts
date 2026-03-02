import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { TimeRange, TimeRangeValue, CustomDateRange } from "./types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getDateRange(timeRange?: TimeRange | TimeRangeValue, customDateRange?: CustomDateRange): { start?: Date, end?: Date } {
  if (customDateRange) {
    // customDateRange.value[0] is smaller/newer (e.g. 0 days ago)
    // customDateRange.value[1] is larger/older (e.g. 30 days ago)
    const { unit, value } = customDateRange;
    const calculateOffset = (val: number): Date => {
      const d = new Date();
      if (unit === "days") d.setDate(d.getDate() - val);
      if (unit === "weeks") d.setDate(d.getDate() - val * 7);
      if (unit === "months") d.setMonth(d.getMonth() - val);
      return d;
    };

    // start bound = the 'newer' date (smaller offset)
    const start = calculateOffset(value[0]);
    // end bound = the 'older' date (larger offset)
    const end = calculateOffset(value[1]);

    // if value[0] is 0, start is effectively "now"
    // if value[1] is the max allowed, maybe we want to not cap it, but exact ranges are fine.
    return { start, end };
  }

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