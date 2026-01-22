export function formatMoney(priceCents, currency = "MXN") {
  const amount = (priceCents || 0) / 100;
  try {
    return new Intl.NumberFormat("es-MX", { style: "currency", currency }).format(amount);
  } catch {
    return `$${amount.toFixed(2)} ${currency}`;
  }
}
