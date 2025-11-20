/**
 * TypeSpec AsyncAPI Library - Main TypeSpec integration entry point
 * 
 * Provides namespace and decorator exports for TypeSpec compiler integration.
 * This file is imported by lib/main.tsp to complete TypeSpec library setup.
 */

import { $decorators } from "./decorators.js";
import { $lib } from "./lib.js";

export { $decorators, $lib };
export const namespace = "TypeSpec.AsyncAPI";