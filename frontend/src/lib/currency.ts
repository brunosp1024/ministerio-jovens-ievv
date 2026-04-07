function toCurrencyString(value?: string | number | null) {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value);
}

function toNormalizedCurrencyValue(value?: string | number | null) {
  const rawValue = toCurrencyString(value).trim();

  if (!rawValue) {
    return "";
  }

  if (rawValue.includes(".")) {
    const [integerPartRaw = "0", decimalPartRaw = "00"] = rawValue.split(".");
    const integerPart = integerPartRaw.replace(/\D/g, "") || "0";
    const decimalPart = decimalPartRaw.replace(/\D/g, "").padEnd(2, "0").slice(0, 2);
    return `${integerPart}.${decimalPart}`;
  }

  if (/^\d+$/.test(rawValue)) {
    return `${rawValue}.00`;
  }

  return normalizeCurrencyInput(rawValue);
}

export function normalizeCurrencyInput(rawValue: string | number | null) {
  const digits = toCurrencyString(rawValue).replace(/\D/g, "");

  if (!digits) {
    return "";
  }

  const paddedDigits = digits.padStart(3, "0");
  const integerPart = paddedDigits.slice(0, -2).replace(/^0+(?=\d)/, "") || "0";
  const decimalPart = paddedDigits.slice(-2);

  return `${integerPart}.${decimalPart}`;
}

export function formatCurrencyInputValue(value?: string | number | null) {
  const normalizedValue = toNormalizedCurrencyValue(value);

  if (!normalizedValue) {
    return "";
  }

  const [integerPartRaw, decimalPartRaw = "00"] = normalizedValue.split(".");
  const integerPart = (integerPartRaw || "0").replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  const decimalPart = decimalPartRaw.padEnd(2, "0").slice(0, 2);

  return `${integerPart},${decimalPart}`;
}

export function normalizedCurrencyToCents(value?: string | number | null) {
  const normalizedValue = toNormalizedCurrencyValue(value);

  if (!normalizedValue) {
    return 0;
  }

  const [integerPartRaw = "0", decimalPartRaw = "00"] = normalizedValue.split(".");
  const integerPart = Number.parseInt(integerPartRaw, 10) || 0;
  const decimalPart = Number.parseInt(decimalPartRaw.padEnd(2, "0").slice(0, 2), 10) || 0;

  return integerPart * 100 + decimalPart;
}

export function centsToNormalizedCurrency(cents: number) {
  const safeCents = Number.isFinite(cents) ? Math.max(0, Math.round(cents)) : 0;
  const integerPart = Math.floor(safeCents / 100);
  const decimalPart = String(safeCents % 100).padStart(2, "0");

  return `${integerPart}.${decimalPart}`;
}