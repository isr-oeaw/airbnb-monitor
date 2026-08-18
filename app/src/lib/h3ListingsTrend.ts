const TREND_URL = '/data/h3_listings_per_year.csv';

export interface TrendPoint {
  year: number;
  listings: number;
}

export type LoadedListingsTrend = Map<string, TrendPoint[]>;

const DEFAULT_YEARS = [2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026];

let trendPromise: Promise<LoadedListingsTrend> | null = null;

function parseCsv(text: string): LoadedListingsTrend {
  const lines = text.trim().split('\n').filter((line) => line.length > 0);
  if (lines.length < 2) {
    return new Map();
  }

  const header = lines[0].split(',');
  const years = header.slice(1).map((year) => Number.parseInt(year, 10));
  const byH3 = new Map<string, TrendPoint[]>();

  for (let i = 1; i < lines.length; i += 1) {
    const parts = lines[i].split(',');
    const h3 = parts[0];
    const series: TrendPoint[] = years.map((year, index) => ({
      year,
      listings: Number.parseInt(parts[index + 1] ?? '0', 10) || 0,
    }));
    byH3.set(h3, series);
  }

  return byH3;
}

export async function loadH3ListingsTrend(): Promise<LoadedListingsTrend> {
  if (!trendPromise) {
    trendPromise = fetch(TREND_URL).then(async (response) => {
      if (!response.ok) {
        throw new Error('H3-Listingstrend konnte nicht geladen werden.');
      }
      const text = await response.text();
      return parseCsv(text);
    });
  }
  return trendPromise;
}

export function getTrendForH3(loaded: LoadedListingsTrend, h3: string): TrendPoint[] {
  return loaded.get(h3) ?? DEFAULT_YEARS.map((year) => ({ year, listings: 0 }));
}
