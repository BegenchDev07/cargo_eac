export interface PricingRates {
  density_threshold: number;
  base_rate: number;
  excess_rate: number;
}

// Fallback if the pricing_settings record can't be fetched
export const DEFAULT_RATES: PricingRates = {
  density_threshold: 250,
  base_rate: 140,
  excess_rate: 0.4,
};

// Calculated values are rounded to 3 decimal places
export function round3(value: number): number {
  return Math.round(value * 1000) / 1000;
}

/**
 * Density-based pricing.
 * density = total_weight / total_volume (kg per m3)
 * rate per m3 = base_rate while density <= threshold,
 * above it base_rate + (density - threshold) * excess_rate
 * (the overweight surcharge for heavy-but-compact cargo).
 * price = rate * total_volume
 */
export function calculateOrderPrice(
  totalWeight: number,
  totalVolume: number,
  rates: PricingRates = DEFAULT_RATES
): number {
  if (!totalVolume || totalVolume <= 0) return 0;

  const density = totalWeight / totalVolume;
  const rate =
    density <= rates.density_threshold
      ? rates.base_rate
      : rates.base_rate + (density - rates.density_threshold) * rates.excess_rate;

  return round3(rate * totalVolume);
}

export function formatPrice(value: number): string {
  return `$${value.toFixed(3)}`;
}
