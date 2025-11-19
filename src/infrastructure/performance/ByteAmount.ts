import { PERFORMANCE_CONSTANTS } from "../../constants/defaults.js";

export type ByteAmount = number & { readonly brand: "ByteAmount" };

// Helper functions for creating ByteAmount values using centralized constants
export const createByteAmount = (bytes: number): ByteAmount =>
  bytes as ByteAmount;
export const createKilobyteAmount = (kb: number): ByteAmount =>
  (kb * PERFORMANCE_CONSTANTS.BYTES_PER_KB) as ByteAmount;
export const createMegabyteAmount = (mb: number): ByteAmount =>
  (mb * PERFORMANCE_CONSTANTS.BYTES_PER_MB) as ByteAmount;
export const createGigabyteAmount = (gb: number): ByteAmount =>
  (gb * PERFORMANCE_CONSTANTS.BYTES_PER_GB) as ByteAmount;
