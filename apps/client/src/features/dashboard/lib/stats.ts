export function percentChange(
  current: number,
  previous: number,
): number | undefined {
  if (previous === 0) {
    return undefined;
  }

  return ((current - previous) / previous) * 100;
}
