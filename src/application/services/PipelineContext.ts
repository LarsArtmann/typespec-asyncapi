// TODO: CRITICAL - PipelineContext lacks validation or constraints - any values could be passed
// TODO: CRITICAL - Consider making PipelineContext immutable with readonly properties
import type { Program } from "@typespec/compiler";
import type { AsyncAPIObject } from "@asyncapi/parser/esm/spec-types/v3.js";
import type { AssetEmitter } from "@typespec/asset-emitter";

import type { AsyncAPIEmitterOptions } from "../../infrastructure/configuration/asyncAPIEmitterOptions.js";

export type PipelineContext = {
  program: Program;
  asyncApiDoc: AsyncAPIObject;
  emitter: AssetEmitter<string, AsyncAPIEmitterOptions>;
};
