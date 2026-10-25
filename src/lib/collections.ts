/** Takes one item from each group in turn: [[a1, a2], [b1]] → [a1, b1, a2]. */
export function roundRobin<T>(groups: T[][]): T[] {
  const longest = Math.max(0, ...groups.map((group) => group.length));
  const result: T[] = [];
  for (let index = 0; index < longest; index++) {
    for (const group of groups) {
      const item = group[index];
      if (item !== undefined) result.push(item);
    }
  }
  return result;
}

/**
 * The homepage "Fresh picks" row: fruit and vegetables taken in turn, leaving out seasonal items,
 * which have their own section right below it, so no product is shown twice.
 */
export function freshPicks<T extends { is_seasonal?: boolean }>(fruits: T[], vegetables: T[], limit: number): T[] {
  return roundRobin([fruits, vegetables].map((group) => group.filter((p) => !p.is_seasonal))).slice(0, limit);
}
