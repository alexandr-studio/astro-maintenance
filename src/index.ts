import { maintenance, MaintenanceOptions } from "./integration";

// Re-export the MaintenanceOptions type
export type { MaintenanceOptions } from "./integration";

// Export both maintenance (new name) and maintenanceIntegration (old name) for backward compatibility
export { maintenance };

// Default export uses the new function name
export default maintenance;
