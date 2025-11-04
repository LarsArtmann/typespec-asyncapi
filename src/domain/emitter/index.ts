// Domain Emitter - Core AsyncAPI Emission Logic
// Contains all business logic for AsyncAPI specification generation

// export { AsyncAPIEmitter } from './AsyncAPIEmitter.js';
// AsyncAPIEmitter temporarily disabled - performance infrastructure issues
export type { IAsyncAPIEmitter } from './IAsyncAPIEmitter.js';
export { DocumentBuilder } from './DocumentBuilder.js';
export { DocumentGenerator } from './DocumentGenerator.js';
export { EmissionPipeline } from './EmissionPipeline.js';
export { ProcessingService } from './ProcessingService.js';

// Discovery services
export { DiscoveryService } from './DiscoveryService.js';
// export { DiscoveryServiceInterface } from './DiscoveryServiceInterface.js'; // REMOVED: Interface not defined in source file
export type { DiscoveryResult } from './DiscoveryResult.js';