// Keys match ParkMeta.id. Names must match queue-times.com ride names.
// Partial/case-insensitive matching is handled in scoring.ts.
export const HEADLINERS: Record<number, string[]> = {
  6: [ // Magic Kingdom
    'Seven Dwarfs Mine Train',
    'TRON Lightcycle / Run',
    'Space Mountain',
    'Big Thunder Mountain Railroad',
    'Haunted Mansion',
  ],
  5: [ // EPCOT
    'Guardians of the Galaxy: Cosmic Rewind',
    'Frozen Ever After',
    'Test Track',
    "Remy's Ratatouille Adventure",
    "Soarin'",
  ],
  7: [ // Hollywood Studios
    'Star Wars: Rise of the Resistance',
    'Slinky Dog Dash',
    "Mickey & Minnie's Runaway Railway",
    'Tower of Terror',
    "Rock 'n' Roller Coaster",
  ],
  8: [ // Animal Kingdom
    'Avatar Flight of Passage',
    "Na'vi River Journey",
    'Expedition Everest',
    'Kilimanjaro Safaris',
    "Bluey's Wild Ride",
  ],
};
