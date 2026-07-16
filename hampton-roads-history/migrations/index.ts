import * as migration_20260716_010821_initial_baseline from './20260716_010821_initial_baseline';

export const migrations = [
  {
    up: migration_20260716_010821_initial_baseline.up,
    down: migration_20260716_010821_initial_baseline.down,
    name: '20260716_010821_initial_baseline'
  },
];
