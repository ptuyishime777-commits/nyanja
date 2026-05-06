/** Compact RWF display e.g. 25K RWF */
export function formatRwf(amount: number): string {
  const n = Math.round(amount)
  if (n >= 1_000_000) {
    const m = n / 1_000_000
    const s = m % 1 === 0 ? m.toFixed(0) : m.toFixed(1)
    return `${s}M RWF`
  }
  if (n >= 1000) {
    return `${Math.round(n / 1000)}K RWF`
  }
  return `${n} RWF`
}

/** Shoppers arrange carriers themselves; we do not add a delivery line item. */
export function deliveryFeeRwf(_option: 'pickup' | 'standard' | 'express'): number {
  void _option
  return 0
}
