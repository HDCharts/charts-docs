export function formatPublishedAt(value?: string): string {
  if (!value) {
    return 'Unavailable';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  const absolute = new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
  const differenceInSeconds = (date.getTime() - Date.now()) / 1000;
  const absoluteDifferenceInSeconds = Math.abs(differenceInSeconds);

  let divisor = 1;
  let unit: Intl.RelativeTimeFormatUnit = 'second';
  if (absoluteDifferenceInSeconds >= 86400) {
    divisor = 86400;
    unit = 'day';
  } else if (absoluteDifferenceInSeconds >= 3600) {
    divisor = 3600;
    unit = 'hour';
  } else if (absoluteDifferenceInSeconds >= 60) {
    divisor = 60;
    unit = 'minute';
  }

  const relative = new Intl.RelativeTimeFormat(undefined, { numeric: 'always' }).format(
    Math.round(differenceInSeconds / divisor),
    unit,
  );
  return `${absolute} (${relative})`;
}
