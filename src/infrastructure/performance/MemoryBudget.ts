import type {ByteAmount} from "./ByteAmount.js"

export type MemoryBudget = {
	maxMemoryPerOperation: ByteAmount;
	maxTotalMemory: ByteAmount;
	maxGrowthRate: number; // bytes per second
	alertThreshold: number; // percentage of max before alert
	forceGCThreshold: number; // percentage of max before forced GC
}
