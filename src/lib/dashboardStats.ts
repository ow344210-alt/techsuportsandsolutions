export interface DailyCount {
  day: string;
  count: number;
}

export function bucketByDay(
  items: Array<{ created_at: string }>,
  numDays = 7,
): DailyCount[] {
  const buckets: Record<string, number> = {};
  const today = new Date();

  for (let i = numDays - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    buckets[key] = 0;
  }

  items.forEach((item) => {
    const key = item.created_at.slice(0, 10);
    if (key in buckets) {
      buckets[key] += 1;
    }
  });

  return Object.entries(buckets).map(([day, count]) => ({
    day: new Date(day).toLocaleDateString("en", { weekday: "short" }),
    count,
  }));
}

export function calcWeeklyTrend(items: Array<{ created_at: string }>): number {
  const now = new Date();
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(now.getDate() - 7);
  const fourteenDaysAgo = new Date(now);
  fourteenDaysAgo.setDate(now.getDate() - 14);

  const thisWeek = items.filter((i) => new Date(i.created_at) >= sevenDaysAgo).length;
  const lastWeek = items.filter((i) => {
    const d = new Date(i.created_at);
    return d >= fourteenDaysAgo && d < sevenDaysAgo;
  }).length;

  if (lastWeek === 0) {
    return thisWeek > 0 ? 100 : 0;
  }

  return ((thisWeek - lastWeek) / lastWeek) * 100;
}