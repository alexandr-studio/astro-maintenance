/// <reference types="astro/client" />

import type { MaintenanceOptions } from './index';

/**
 * Astro-Maintenance virtual module type declarations
 */
declare module 'virtual:astro-maintenance/options' {
  const options: MaintenanceOptions;
  export { options };
}
