export function fuzzyScore(query: string, text: string): number {
  const q = query.trim().toLowerCase();
  if (!q) return 1;
  const t = text.toLowerCase();

  if (t === q) return 10_000;
  if (t.startsWith(q)) return 5_000 - (t.length - q.length);

  const idx = t.indexOf(q);
  if (idx !== -1) {
    const boundary = idx === 0 || /[\s\-_/]/.test(t[idx - 1] ?? "");
    return (boundary ? 2_000 : 1_000) - idx;
  }

  let ti = 0;
  let score = 0;
  let streak = 0;
  let prev = -2;
  for (let qi = 0; qi < q.length; qi++) {
    const ch = q[qi]!;
    let found = -1;
    for (let j = ti; j < t.length; j++) {
      if (t[j] === ch) {
        found = j;
        break;
      }
    }
    if (found === -1) return 0;
    streak = found === prev + 1 ? streak + 1 : 1;
    score += streak * 3;
    const before = found === 0 ? " " : (t[found - 1] ?? "");
    if (/[\s\-_/]/.test(before)) score += 8;
    prev = found;
    ti = found + 1;
  }
  return score;
}

export function rankCommands<T extends { label: string; keywords?: string[] }>(
  items: T[],
  query: string,
): T[] {
  if (!query.trim()) return items;
  const scored: { item: T; score: number }[] = [];
  for (const item of items) {
    const haystacks = [item.label, ...(item.keywords ?? [])];
    let best = 0;
    for (const h of haystacks) {
      const s = fuzzyScore(query, h);
      if (s > best) best = s;
    }
    if (best > 0) scored.push({ item, score: best });
  }
  scored.sort((a, b) => b.score - a.score);
  return scored.map((x) => x.item);
}
