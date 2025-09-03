import type {AwsSnsBindingConfig} from "./aws-sns-binding-config.js"
import type {GoogleCloudPubSubBindingConfig} from "./google-cloud-pub-sub-binding-config.js"
import type {KafkaBindingConfig} from "./kafka-binding-config.js"

import type {AwsSqsBindingConfig} from "./aws-sqs-binding-config.js"

/**
 * Union type for all binding configurations
 * TODO: Improve types!
 */
export type CloudBindingConfig =
	| AwsSnsBindingConfig
	| AwsSqsBindingConfig
	| GoogleCloudPubSubBindingConfig
	| KafkaBindingConfig
	| Record<string, unknown> // For other binding types