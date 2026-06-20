export interface Ride {
  id: number;
  name: string;
  is_open: boolean;
  wait_time: number;
  last_updated: string;
  isShow?: boolean; // true for theatrical shows — display "—" instead of wait time, excluded from scoring
}

export interface Land {
  name: string;
  rides: Ride[];
}

export interface QueueTimesResponse {
  lands: Land[];
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
