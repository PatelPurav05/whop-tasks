export function formatMoney(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
  }).format(cents / 100);
}

export function formatDate(value: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(value);
}

export function formatRelativeDeadline(value: Date): string {
  const differenceMs = value.getTime() - Date.now();
  const differenceHours = Math.ceil(differenceMs / (60 * 60 * 1000));

  if (differenceHours <= 0) {
    return "Deadline passed";
  }

  if (differenceHours < 24) {
    return `${differenceHours}h left`;
  }

  const days = Math.ceil(differenceHours / 24);
  return `${days}d left`;
}

export function getInitials(name: string): string {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  return initials || "W";
}
