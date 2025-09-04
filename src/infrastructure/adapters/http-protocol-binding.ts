import type {HttpOperationBinding} from "./http-operation-binding.js"
import type {HttpMessageBinding} from "./http-message-binding.js"
import type {HttpMessageBindingConfig, HttpOperationBindingConfig} from "./protocol-bindings.js"

//TODO: MAGIC NUMBERS!
export class HttpProtocolBinding {
	static createOperationBinding(config: HttpOperationBindingConfig = {}): HttpOperationBinding {
		return {
			bindingVersion: "0.3.0",
			type: config.type ?? "request",
			...config,
		}
	}

	static createMessageBinding(config: HttpMessageBindingConfig = {}): HttpMessageBinding {
		return {
			bindingVersion: "0.3.0",
			...config,
		}
	}
}