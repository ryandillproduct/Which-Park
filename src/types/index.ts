export interface Ride {
  id: number;
  name: string;
  is_open: boolean;
  wait_time: number;
  last_updated: string;
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
}

export interface ScoredPark extends ParkMeta {
  score: number;
  label: string;
  rides: Ride[];
}

export interface ApiResponse {
  parks: ScoredPark[];
}
