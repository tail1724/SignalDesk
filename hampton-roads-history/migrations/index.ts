import * as migration_20260716_010821_initial_baseline from './20260716_010821_initial_baseline';
import * as migration_20260716_013020_add_media from './20260716_013020_add_media';
import * as migration_20260717_023356_newsroom_control_plane from './20260717_023356_newsroom_control_plane';

export const migrations = [
  {
    up: migration_20260716_010821_initial_baseline.up,
    down: migration_20260716_010821_initial_baseline.down,
    name: '20260716_010821_initial_baseline',
  },
  {
    up: migration_20260716_013020_add_media.up,
    down: migration_20260716_013020_add_media.down,
    name: '20260716_013020_add_media',
  },
  {
    up: migration_20260717_023356_newsroom_control_plane.up,
    down: migration_20260717_023356_newsroom_control_plane.down,
    name: '20260717_023356_newsroom_control_plane'
  },
];
