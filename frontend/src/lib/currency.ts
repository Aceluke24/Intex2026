const usd0 = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const usd2 = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatUSD(value: number, fractionDigits = 2) {
  if (fractionDigits === 0) {
    return usd0.format(value);
  }

  if (fractionDigits === 2) {
    return usd2.format(value);
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(value);
}

export function formatUSDCompactThousands(value: number, fractionDigits = 0) {
  return `$${(value / 1000).toFixed(fractionDigits)}k`;
}