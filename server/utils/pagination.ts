// Walks a Medusa list endpoint (limit/offset + count) until every item has
// been read. Stops on an empty page too, so a count that changes mid-walk
// can't loop forever.
export async function listAllPages<T>(
  fetchPage: (params: {
    limit: number
    offset: number
  }) => Promise<{ items: T[]; count: number }>,
  limit = 100,
): Promise<T[]> {
  const items: T[] = []
  let offset = 0

  while (true) {
    // Sequential on purpose: the next offset depends on this page's length.
    // eslint-disable-next-line no-await-in-loop
    const page = await fetchPage({ limit, offset })
    items.push(...page.items)
    offset += page.items.length
    if (!page.items.length || offset >= page.count) return items
  }
}
