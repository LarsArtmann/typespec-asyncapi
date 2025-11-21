/**
 * Channel Decorator
 * 
 * TypeSpec channel decorator implementation for AsyncAPI generation
 */

export interface ChannelDecorator {
  channelName: string;
  address: string;
  description?: string;
  parameters?: Record<string, any>;
}

/**
 * Create channel decorator
 */
export function createChannelDecorator(options: ChannelDecorator): ChannelDecorator {
  return {
    ...options,
    address: options.address.startsWith('/') ? options.address : `/${options.address}`
  };
}