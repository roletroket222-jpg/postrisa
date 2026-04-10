const currencyFormatter = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

const dateFormatter = new Intl.DateTimeFormat("id-ID", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

const dateOnlyFormatter = new Intl.DateTimeFormat("id-ID", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

const numberFormatter = new Intl.NumberFormat("id-ID");

export function formatCurrency(value: number) {
  return currencyFormatter.format(value);
}

export function formatDate(value: Date | string) {
  return dateFormatter.format(new Date(value));
}

export function formatDateOnly(value: Date | string) {
  return dateOnlyFormatter.format(new Date(value));
}

export function formatDateInput(value: Date | string) {
  return new Date(value).toISOString().slice(0, 10);
}

export function formatNumber(value: number) {
  return numberFormatter.format(value);
}
