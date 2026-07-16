import * as migration_20260716_010821_initial_baseline from './20260716_010821_initial_baseline';
import * as migration_20260716_013020_add_media from './20260716_013020_add_media';

export const migrations = [
  {
    up: migration_20260716_010821_initial_baseline.up,
    down: migration_20260716_010821_initial_baseline.down,
    name: '20260716_010821_initial_baseline',
  },
  {
    up: migration_20260716_013020_add_media.up,
    down: migration_20260716_013020_add_media.down,
    name: '20260716_013020_add_media'
  },
];
