export function formatPrice(minorUnits: number, currencyCode: string): string {
  const major = minorUnits / 100;
  if (currencyCode === "GEL") {
    return `${major.toFixed(2)} ₾`;
  }
  return new Intl.NumberFormat(undefined, { style: "currency", currency: currencyCode }).format(major);
}
