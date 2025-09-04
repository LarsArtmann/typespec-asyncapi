export type ByteAmount = number & { readonly brand: 'ByteAmount' };

// Helper functions for creating ByteAmount values
export const createByteAmount = (bytes: number): ByteAmount => bytes as ByteAmount;
export const createKilobyteAmount = (kb: number): ByteAmount => (kb * 1024) as ByteAmount;
export const createMegabyteAmount = (mb: number): ByteAmount => (mb * 1024 * 1024) as ByteAmount;
export const createGigabyteAmount = (gb: number): ByteAmount => (gb * 1024 * 1024 * 1024) as ByteAmount;