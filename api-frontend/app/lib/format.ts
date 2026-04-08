/* Formats a timestamp for display instead of the raw value */
export function formatTimestamp(value?: string | null): string {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  const iso = date.toISOString();
  const yyyyMmDd = iso.slice(0, 10);
  const hhMm = iso.slice(11, 16);
  return `${yyyyMmDd} ${hhMm} UTC`;
}
