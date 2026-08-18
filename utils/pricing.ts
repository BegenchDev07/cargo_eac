export function calculateOrderPrice(weightKg: number, cubicMeters: number): number {
  if (weightKg > 500) {
    return weightKg * 0.8;
  }
  if (weightKg >= 230) {
    return cubicMeters * 235;
  }
  return cubicMeters * 140;
}

export function formatPrice(value: number): string {
  return `$${value.toFixed(2)}`;
}
