/**
 * AWS SNS binding configuration
 * TODO: Improve types!
 */
export type AwsSnsBindingConfig = {
	/** Topic ARN or name */
	topic: string;
	/** AWS region */
	region?: string;
	/** Message attributes configuration */
	attributes?: Record<string, {
		type: 'String' | 'Number' | 'Binary';
		value?: string;
	}>;
	/** Filter policy for subscription filtering */
	filterPolicy?: Record<string, string | string[]>;
	/** Dead letter queue configuration */
	deadLetterQueue?: {
		targetArn: string;
		maxReceiveCount: number;
	};
}