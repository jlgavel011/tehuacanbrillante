// Utility function to group data by a key and calculate sum
export const groupAndSum = (data: any[], groupKey: string, sumKey: string) => {
  return Object.entries(
    data.reduce((acc, item) => {
      const key = item[groupKey];
      acc[key] = (acc[key] || 0) + Number(item[sumKey]);
      return acc;
    }, {})
  ).map(([name, value]) => ({ name, value }));
};

// Utility function to group data by a key and count occurrences
export const groupAndCount = (data: any[], groupKey: string) => {
  return Object.entries(
    data.reduce((acc, item) => {
      const key = item[groupKey];
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {})
  ).map(([name, value]) => ({ name, value }));
};

// Utility function to calculate percentage
export const calculatePercentage = (value: number, total: number) => {
  return total === 0 ? 0 : (value / total) * 100;
};

// Utility function to format numbers with commas
export const formatNumber = (num: number) => {
  return new Intl.NumberFormat("es-MX").format(num);
};

// Utility function to format dates
export const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat("es-MX", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

// Utility function to format duration in minutes to hours and minutes
export const formatDuration = (minutes: number) => {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes}m`;
};

// Utility function to group data by time period
export const groupByTimePeriod = (
  data: any[],
  dateKey: string,
  period: "hour" | "day" | "week" | "month"
) => {
  return data.reduce((acc: any[], item) => {
    const date = new Date(item[dateKey]);
    let periodKey;

    switch (period) {
      case "hour":
        periodKey = new Date(
          date.getFullYear(),
          date.getMonth(),
          date.getDate(),
          date.getHours()
        ).toISOString();
        break;
      case "day":
        periodKey = new Date(
          date.getFullYear(),
          date.getMonth(),
          date.getDate()
        ).toISOString();
        break;
      case "week":
        const firstDayOfWeek = new Date(
          date.getFullYear(),
          date.getMonth(),
          date.getDate() - date.getDay()
        );
        periodKey = firstDayOfWeek.toISOString();
        break;
      case "month":
        periodKey = new Date(
          date.getFullYear(),
          date.getMonth(),
          1
        ).toISOString();
        break;
    }

    const existingPeriod = acc.find((p) => p.period === periodKey);
    if (existingPeriod) {
      existingPeriod.count += 1;
      existingPeriod.items.push(item);
    } else {
      acc.push({
        period: periodKey,
        count: 1,
        items: [item],
      });
    }

    return acc;
  }, []);
}; 