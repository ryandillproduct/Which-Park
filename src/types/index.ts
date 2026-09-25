export interface Ride {
  id: string | number;
  name: string;
  is_open: boolean;
  wait_time: number;
  last_updated: string;
  isShow?: boolean; // true for theatrical shows — display "—" instead of wait time, excluded from scoring
  isStatic?: boolean; // true for rides injected statically with no live data — display "—"
}

export interface ParkMeta {
  id: number;
  name: string;
  silhouetteKey: 'magic-kingdom' | 'epcot' | 'hollywood-studios' | 'animal-kingdom';
  showtimesUrl: string;
  themeParksId: string;
}

export interface ScoredPark extends ParkMeta {
  score: number;
  label: string;
  rides: Ride[];
  hours: string | null;
  isOpen: boolean;
  closingTimeMs: number | null;
  avgWaitMinutes: number;
  headlinerWaitMinutes: number;
  goScore: number;
  openAttractionCount: number;
  tiebreakerNote?: string;
  tie?: { rival: string; reason: string }; // set when this park won a Go Score tie against the next park
}

export interface Recommendation {
  parkId: number;
  parkName: string;
  avgWaitMinutes: number;
  crowdScore: number;
  closingTimeMs: number | null;
  opener: string;
}

export interface ApiResponse {
  parks: ScoredPark[];
  recommendation: Recommendation | null;
}
