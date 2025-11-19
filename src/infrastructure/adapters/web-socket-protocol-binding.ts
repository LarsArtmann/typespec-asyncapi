import type { WebSocketChannelBinding } from "./web-socket-channel-binding.js";
import type {
  WebSocketChannelBindingConfig,
  WebSocketMessageBinding,
  WebSocketMessageBindingConfig,
} from "./protocol-bindings.js";

//TODO: MAGIC NUMBERS!
export class WebSocketProtocolBinding {
  static createChannelBinding(
    config: WebSocketChannelBindingConfig = {},
  ): WebSocketChannelBinding {
    return {
      bindingVersion: "0.1.0",
      ...config,
    };
  }

  static createMessageBinding(
    config: WebSocketMessageBindingConfig = {},
  ): WebSocketMessageBinding {
    return {
      bindingVersion: "0.1.0",
      ...config,
    };
  }
}
