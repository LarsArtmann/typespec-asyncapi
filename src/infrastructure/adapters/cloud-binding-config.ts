/**
 * Base configuration for cloud provider bindings
 * TODO: Use this somewhere???
 */
export type CloudBindingConfig = {
	/** Cloud provider identifier */
	provider?: string

	/** Service region or zone */
	region?: string

	/** Environment (dev, staging, prod) */
	environment?: string

	/** Additional tags for resource organization */
	tags?: string[]

	/** Authentication configuration */
	auth?: {
		type: 'iam-role' | 'access-keys' | 'oauth' | 'service-account'
		[key: string]: unknown
	}
}