// Public API
export { OpenDataLayer } from './odl.js';
export type { ODLOptions } from './odl.js';

// Core
export { DataLayer } from './core/data-layer.js';
export { EventBus } from './core/event-bus.js';
export type { ODLEvent } from './core/event-bus.js';
export { ContextManager } from './core/context-manager.js';
export { MiddlewarePipeline } from './core/middleware.js';
export type { MiddlewareFn } from './core/middleware.js';

// Plugins
export type { ODLPlugin } from './plugins/types.js';
export { autoPageView } from './plugins/auto-page-view.js';
export { debug } from './plugins/debug.js';
export { persistence } from './plugins/persistence.js';

// Utilities
export { generateUUID } from './utils/uuid.js';
export { now } from './utils/timestamp.js';
export { deepMerge } from './utils/deep-merge.js';
