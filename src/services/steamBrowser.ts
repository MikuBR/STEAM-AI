export interface SteamSearchItem {
  id: number;
  name: string;
  price: string;
}

export async function searchSteamGames(query: string): Promise<SteamSearchItem[]> {
  if (!query.trim()) return [];
  try {
    const res = await fetch(
      `https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(query)}&l=english&cc=US`
    );
    const data = await res.json();
    return data?.items || [];
  } catch {
    return [];
  }
}
