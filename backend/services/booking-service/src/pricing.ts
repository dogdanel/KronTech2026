/** Bill in whole hours, rounding up partial hours. */
export function computeTotalCents(
  startAt: Date,
  endAt: Date,
  pricePerHourCents: number
): number {
  const ms = endAt.getTime() - startAt.getTime();
  const hours = Math.ceil(ms / (1000 * 60 * 60));
  return Math.max(0, hours * pricePerHourCents);
}
