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

export function groupBy<T>(items: T[], key: (item: T) => string): T[][] {
  const groups = new Map<string, T[]>();
  for (const item of items) {
    const k = key(item);
    groups.set(k, [...(groups.get(k) ?? []), item]);
  }
  return [...groups.values()];
}
