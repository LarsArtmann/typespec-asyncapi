import type {CloudBindingType} from "../constants/cloud-binding-type.js"
import type {CloudBindingConfig} from "./cloud-binding-config.js"

/**
 * Complete binding configuration with metadata
 * TODO: Improve types!
 */
export type CloudBinding = {
	/** Binding type identifier */
	bindingType: CloudBindingType;
	/** Type-specific configuration */
	config: CloudBindingConfig;
	/** Binding metadata */
	metadata?: {
		/** Environment (dev, staging, prod) */
		environment?: string;
		/** Region or availability zone */
		region?: string;
		/** Version of binding specification */
		version?: string;
		/** Additional tags for organization */
		tags?: string[];
	};
}