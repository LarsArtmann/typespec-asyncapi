/**
 * Documentation Test Suite: 02-data-types.md
 * 
 * BDD tests validating TypeSpec to AsyncAPI data type mappings
 * as documented in docs/map-typespec-to-asyncapi/02-data-types.md
 */

import { describe, expect, it, beforeEach } from "bun:test"
import { createTypeSpecTestCompiler, type TypeSpecCompileResult } from "./helpers/typespec-compiler.js"
import { createAsyncAPIValidator, type AsyncAPIValidationResult } from "./helpers/asyncapi-validator.js"
import { TypeSpecFixtures, AsyncAPIFixtures, TestDataGenerator } from "./helpers/test-fixtures.js"

describe("Documentation: Data Types Mapping", () => {
  let compiler: ReturnType<typeof createTypeSpecTestCompiler>
  let validator: ReturnType<typeof createAsyncAPIValidator>

  beforeEach(() => {
    compiler = createTypeSpecTestCompiler()
    validator = createAsyncAPIValidator()
  })

  describe("GIVEN TypeSpec primitive types", () => {

    describe("WHEN mapping string types", () => {

      it("THEN should map string to JSON Schema string type", async () => {
        // Arrange
        const stringTypeCode = `
          @service({ title: "String Test Service" })
          namespace StringTestService {
            @channel("strings")
            @publish
            op publishString(@body data: StringData): void;
          }
          
          @message("StringData")
          model StringData {
            basicString: string;
            optionalString?: string;
            nullableString: string | null;
          }
        `

        // Act
        const result = await compiler.compileTypeSpec({
          code: stringTypeCode,
          emitAsyncAPI: true
        })

        // Assert
        compiler.validateCompilationSuccess(result)
        const message = result.asyncapi!.components!.messages!.StringData
        const props = message.payload.properties!

        expect(props.basicString).toEqual({ type: "string" })
        expect(props.optionalString).toEqual({ type: "string" })
        expect(props.nullableString).toEqual({ type: ["string", "null"] })
      })

      it("THEN should handle string format constraints", async () => {
        // Arrange
        const formattedStringCode = `
          @service({ title: "Formatted String Service" })
          namespace FormattedStringService {
            @channel("formatted-strings")
            @publish
            op publishFormatted(@body data: FormattedStringData): void;
          }
          
          @message("FormattedStringData")
          model FormattedStringData {
            emailField: string & @format("email");
            uriField: url;
            dateTimeField: utcDateTime;
            durationField: duration;
          }
        `

        // Act
        const result = await compiler.compileTypeSpec({
          code: formattedStringCode,
          emitAsyncAPI: true
        })

        // Assert
        const message = result.asyncapi!.components!.messages!.FormattedStringData
        const props = message.payload.properties!

        expect(props.emailField).toEqual({ type: "string", format: "email" })
        expect(props.uriField).toEqual({ type: "string", format: "uri" })
        expect(props.dateTimeField).toEqual({ type: "string", format: "date-time" })
        expect(props.durationField).toEqual({ type: "string", format: "duration" })
      })

      it("THEN should validate string constraints", async () => {
        // Arrange
        const constrainedStringCode = `
          @service({ title: "Constrained String Service" })
          namespace ConstrainedStringService {
            @channel("constrained")
            @publish
            op publishConstrained(@body data: ConstrainedStringData): void;
          }
          
          @message("ConstrainedStringData")
          model ConstrainedStringData {
            @minLength(5)
            @maxLength(50)
            constrainedString: string;
            
            @pattern("^[A-Z][a-z]+$")
            patternString: string;
          }
        `

        // Act
        const result = await compiler.compileTypeSpec({
          code: constrainedStringCode,
          emitAsyncAPI: true
        })

        // Assert
        const message = result.asyncapi!.components!.messages!.ConstrainedStringData
        const props = message.payload.properties!

        expect(props.constrainedString.minLength).toBe(5)
        expect(props.constrainedString.maxLength).toBe(50)
        expect(props.patternString.pattern).toBe("^[A-Z][a-z]+$")
      })
    })

    describe("WHEN mapping integer types", () => {

      it("THEN should map int32 to integer with int32 format", async () => {
        // Arrange & Act
        const result = await compiler.compileTypeSpec({
          code: TypeSpecFixtures.dataTypesPrimitives,
          emitAsyncAPI: true
        })

        // Assert
        compiler.validateCompilationSuccess(result)
        const message = result.asyncapi!.components!.messages!.PrimitiveTypesMessage
        const props = message.payload.properties!

        expect(props.int32Field).toEqual({ type: "integer", format: "int32" })
        expect(props.int64Field).toEqual({ type: "integer", format: "int64" })
      })

      it("THEN should handle integer constraints", async () => {
        // Arrange
        const constrainedIntegerCode = `
          @service({ title: "Integer Constraints Service" })
          namespace IntegerConstraintsService {
            @channel("integers")
            @publish
            op publishIntegers(@body data: IntegerConstraintsData): void;
          }
          
          @message("IntegerConstraintsData")
          model IntegerConstraintsData {
            @minimum(0)
            @maximum(100)
            percentageValue: int32;
            
            @exclusiveMinimum(0)
            positiveValue: int32;
            
            @multipleOf(5)
            incrementValue: int32;
          }
        `

        // Act
        const result = await compiler.compileTypeSpec({
          code: constrainedIntegerCode,
          emitAsyncAPI: true
        })

        // Assert
        const message = result.asyncapi!.components!.messages!.IntegerConstraintsData
        const props = message.payload.properties!

        expect(props.percentageValue.minimum).toBe(0)
        expect(props.percentageValue.maximum).toBe(100)
        expect(props.positiveValue.exclusiveMinimum).toBe(true)
        expect(props.incrementValue.multipleOf).toBe(5)
      })

      it("THEN should map integer variants correctly", async () => {
        // Arrange
        const integerVariantsCode = `
          @service({ title: "Integer Variants Service" })
          namespace IntegerVariantsService {
            @channel("variants")
            @publish
            op publishVariants(@body data: IntegerVariantsData): void;
          }
          
          @message("IntegerVariantsData")
          model IntegerVariantsData {
            int8Field: int8;
            int16Field: int16;
            int32Field: int32;
            int64Field: int64;
            uint8Field: uint8;
            uint16Field: uint16;
            uint32Field: uint32;
            uint64Field: uint64;
            safeintField: safeint;
          }
        `

        // Act
        const result = await compiler.compileTypeSpec({
          code: integerVariantsCode,
          emitAsyncAPI: true
        })

        // Assert
        const message = result.asyncapi!.components!.messages!.IntegerVariantsData
        const props = message.payload.properties!

        expect(props.int8Field).toEqual({ type: "integer", format: "int8" })
        expect(props.int16Field).toEqual({ type: "integer", format: "int16" })
        expect(props.uint32Field).toEqual({ type: "integer", format: "uint32" })
        expect(props.safeintField).toEqual({ type: "integer" })
      })
    })

    describe("WHEN mapping floating-point types", () => {

      it("THEN should map float32 and float64 with correct formats", async () => {
        // Arrange & Act
        const result = await compiler.compileTypeSpec({
          code: TypeSpecFixtures.dataTypesPrimitives,
          emitAsyncAPI: true
        })

        // Assert
        const message = result.asyncapi!.components!.messages!.PrimitiveTypesMessage
        const props = message.payload.properties!

        expect(props.float32Field).toEqual({ type: "number", format: "float" })
        expect(props.float64Field).toEqual({ type: "number", format: "double" })
      })

      it("THEN should handle decimal types and constraints", async () => {
        // Arrange
        const decimalTypesCode = `
          @service({ title: "Decimal Types Service" })
          namespace DecimalTypesService {
            @channel("decimals")
            @publish
            op publishDecimals(@body data: DecimalTypesData): void;
          }
          
          @message("DecimalTypesData")
          model DecimalTypesData {
            decimalField: decimal;
            decimal128Field: decimal128;
            
            @minimum(0.0)
            @maximum(1.0)
            normalizedFloat: float64;
          }
        `

        // Act
        const result = await compiler.compileTypeSpec({
          code: decimalTypesCode,
          emitAsyncAPI: true
        })

        // Assert
        const message = result.asyncapi!.components!.messages!.DecimalTypesData
        const props = message.payload.properties!

        expect(props.decimalField.type).toBe("number")
        expect(props.normalizedFloat.minimum).toBe(0.0)
        expect(props.normalizedFloat.maximum).toBe(1.0)
      })
    })

    describe("WHEN mapping boolean types", () => {

      it("THEN should map boolean to JSON Schema boolean", async () => {
        // Arrange & Act
        const result = await compiler.compileTypeSpec({
          code: TypeSpecFixtures.dataTypesPrimitives,
          emitAsyncAPI: true
        })

        // Assert
        const message = result.asyncapi!.components!.messages!.PrimitiveTypesMessage
        const props = message.payload.properties!

        expect(props.booleanField).toEqual({ type: "boolean" })
      })

      it("THEN should handle optional and nullable booleans", async () => {
        // Arrange
        const booleanVariantsCode = `
          @service({ title: "Boolean Variants Service" })
          namespace BooleanVariantsService {
            @channel("booleans")
            @publish
            op publishBooleans(@body data: BooleanVariantsData): void;
          }
          
          @message("BooleanVariantsData")
          model BooleanVariantsData {
            requiredBoolean: boolean;
            optionalBoolean?: boolean;
            nullableBoolean: boolean | null;
          }
        `

        // Act
        const result = await compiler.compileTypeSpec({
          code: booleanVariantsCode,
          emitAsyncAPI: true
        })

        // Assert
        const message = result.asyncapi!.components!.messages!.BooleanVariantsData
        const props = message.payload.properties!
        const required = message.payload.required || []

        expect(props.requiredBoolean).toEqual({ type: "boolean" })
        expect(props.optionalBoolean).toEqual({ type: "boolean" })
        expect(props.nullableBoolean).toEqual({ type: ["boolean", "null"] })
        expect(required).toContain("requiredBoolean")
        expect(required).not.toContain("optionalBoolean")
      })
    })

    describe("WHEN mapping date and time types", () => {

      it("THEN should map date/time types with correct formats", async () => {
        // Arrange & Act
        const result = await compiler.compileTypeSpec({
          code: TypeSpecFixtures.dataTypesPrimitives,
          emitAsyncAPI: true
        })

        // Assert
        const message = result.asyncapi!.components!.messages!.PrimitiveTypesMessage
        const props = message.payload.properties!

        expect(props.dateTimeField).toEqual({ type: "string", format: "date-time" })
        expect(props.durationField).toEqual({ type: "string", format: "duration" })
      })

      it("THEN should handle date/time variants", async () => {
        // Arrange
        const dateTimeVariantsCode = `
          @service({ title: "DateTime Variants Service" })
          namespace DateTimeVariantsService {
            @channel("datetimes")
            @publish
            op publishDateTimes(@body data: DateTimeVariantsData): void;
          }
          
          @message("DateTimeVariantsData")
          model DateTimeVariantsData {
            utcDateTimeField: utcDateTime;
            offsetDateTimeField: offsetDateTime;
            plainDateField: plainDate;
            plainTimeField: plainTime;
          }
        `

        // Act
        const result = await compiler.compileTypeSpec({
          code: dateTimeVariantsCode,
          emitAsyncAPI: true
        })

        // Assert
        const message = result.asyncapi!.components!.messages!.DateTimeVariantsData
        const props = message.payload.properties!

        expect(props.utcDateTimeField).toEqual({ type: "string", format: "date-time" })
        expect(props.offsetDateTimeField).toEqual({ type: "string", format: "date-time" })
        expect(props.plainDateField).toEqual({ type: "string", format: "date" })
        expect(props.plainTimeField).toEqual({ type: "string", format: "time" })
      })
    })

    describe("WHEN mapping bytes and binary types", () => {

      it("THEN should map bytes to string with byte format", async () => {
        // Arrange
        const bytesTypeCode = `
          @service({ title: "Bytes Service" })
          namespace BytesService {
            @channel("bytes")
            @publish
            op publishBytes(@body data: BytesData): void;
          }
          
          @message("BytesData")
          model BytesData {
            binaryData: bytes;
            @encode("base64")
            base64Data: bytes;
          }
        `

        // Act
        const result = await compiler.compileTypeSpec({
          code: bytesTypeCode,
          emitAsyncAPI: true
        })

        // Assert
        const message = result.asyncapi!.components!.messages!.BytesData
        const props = message.payload.properties!

        expect(props.binaryData).toEqual({ type: "string", format: "byte" })
        expect(props.base64Data).toEqual({ type: "string", format: "base64" })
      })
    })
  })

  describe("GIVEN TypeSpec array types", () => {

    describe("WHEN mapping simple arrays", () => {

      it("THEN should create array schema with items definition", async () => {
        // Arrange & Act
        const result = await compiler.compileTypeSpec({
          code: TypeSpecFixtures.dataTypesPrimitives,
          emitAsyncAPI: true
        })

        // Assert
        const message = result.asyncapi!.components!.messages!.ArrayTypesMessage
        const props = message.payload.properties!

        expect(props.stringArray).toEqual({
          type: "array",
          items: { type: "string" }
        })
        expect(props.numberArray).toEqual({
          type: "array", 
          items: { type: "integer", format: "int32" }
        })
      })

      it("THEN should handle array constraints", async () => {
        // Arrange
        const constrainedArrayCode = `
          @service({ title: "Constrained Array Service" })
          namespace ConstrainedArrayService {
            @channel("arrays")
            @publish
            op publishArrays(@body data: ConstrainedArrayData): void;
          }
          
          @message("ConstrainedArrayData")
          model ConstrainedArrayData {
            @minItems(1)
            @maxItems(10)
            boundedArray: string[];
            
            @uniqueItems
            uniqueArray: int32[];
          }
        `

        // Act
        const result = await compiler.compileTypeSpec({
          code: constrainedArrayCode,
          emitAsyncAPI: true
        })

        // Assert
        const message = result.asyncapi!.components!.messages!.ConstrainedArrayData
        const props = message.payload.properties!

        expect(props.boundedArray.minItems).toBe(1)
        expect(props.boundedArray.maxItems).toBe(10)
        expect(props.uniqueArray.uniqueItems).toBe(true)
      })
    })

    describe("WHEN mapping nested arrays", () => {

      it("THEN should handle multi-dimensional arrays", async () => {
        // Arrange
        const nestedArrayCode = `
          @service({ title: "Nested Array Service" })
          namespace NestedArrayService {
            @channel("nested-arrays")
            @publish
            op publishNestedArrays(@body data: NestedArrayData): void;
          }
          
          @message("NestedArrayData")
          model NestedArrayData {
            matrix: int32[][];
            nestedStrings: string[][][];
          }
        `

        // Act
        const result = await compiler.compileTypeSpec({
          code: nestedArrayCode,
          emitAsyncAPI: true
        })

        // Assert
        const message = result.asyncapi!.components!.messages!.NestedArrayData
        const props = message.payload.properties!

        expect(props.matrix).toEqual({
          type: "array",
          items: {
            type: "array",
            items: { type: "integer", format: "int32" }
          }
        })
        expect(props.nestedStrings.items.items).toEqual({
          type: "array",
          items: { type: "string" }
        })
      })
    })

    describe("WHEN mapping arrays of complex types", () => {

      it("THEN should reference component schemas for object arrays", async () => {
        // Arrange & Act
        const result = await compiler.compileTypeSpec({
          code: TypeSpecFixtures.dataTypesPrimitives,
          emitAsyncAPI: true
        })

        // Assert
        const message = result.asyncapi!.components!.messages!.ArrayTypesMessage
        const props = message.payload.properties!

        expect(props.objectArray).toEqual({
          type: "array",
          items: {
            $ref: "#/components/schemas/OrderItem"
          }
        })
      })
    })
  })

  describe("GIVEN TypeSpec union types", () => {

    describe("WHEN mapping simple union types", () => {

      it("THEN should create oneOf schemas for type unions", async () => {
        // Arrange & Act
        const result = await compiler.compileTypeSpec({
          code: TypeSpecFixtures.dataTypesPrimitives,
          emitAsyncAPI: true
        })

        // Assert
        const message = result.asyncapi!.components!.messages!.UnionTypesMessage
        const props = message.payload.properties!

        expect(props.typeUnion).toEqual({
          oneOf: [
            { type: "string" },
            { type: "integer", format: "int32" },
            { type: "boolean" }
          ]
        })
      })

      it("THEN should handle string literal unions as enums", async () => {
        // Arrange & Act
        const result = await compiler.compileTypeSpec({
          code: TypeSpecFixtures.dataTypesPrimitives,
          emitAsyncAPI: true
        })

        // Assert
        const message = result.asyncapi!.components!.messages!.UnionTypesMessage
        const props = message.payload.properties!

        expect(props.statusUnion).toEqual({
          type: "string",
          enum: ["active", "inactive", "pending"]
        })
      })
    })

    describe("WHEN mapping discriminated unions", () => {

      it("THEN should create discriminator-based oneOf schemas", async () => {
        // Arrange
        const discriminatedUnionCode = `
          @service({ title: "Discriminated Union Service" })
          namespace DiscriminatedUnionService {
            @channel("discriminated")
            @publish
            op publishDiscriminated(@body data: DiscriminatedData): void;
          }
          
          @discriminator("type")
          @message("Event")
          union Event {
            userEvent: UserEvent,
            orderEvent: OrderEvent,
          }
          
          model UserEvent {
            type: "user";
            userId: string;
          }
          
          model OrderEvent {
            type: "order";
            orderId: string;
          }
          
          @message("DiscriminatedData")
          model DiscriminatedData {
            event: Event;
          }
        `

        // Act
        const result = await compiler.compileTypeSpec({
          code: discriminatedUnionCode,
          emitAsyncAPI: true
        })

        // Assert
        const message = result.asyncapi!.components!.messages!.DiscriminatedData
        const props = message.payload.properties!

        expect(props.event.discriminator).toBeDefined()
        expect(props.event.discriminator.propertyName).toBe("type")
        expect(props.event.oneOf).toHaveLength(2)
      })
    })

    describe("WHEN mapping nullable unions", () => {

      it("THEN should handle null unions properly", async () => {
        // Arrange & Act
        const result = await compiler.compileTypeSpec({
          code: TypeSpecFixtures.dataTypesPrimitives,
          emitAsyncAPI: true
        })

        // Assert
        const message = result.asyncapi!.components!.messages!.OptionalFieldsMessage
        const props = message.payload.properties!

        expect(props.nullableField).toEqual({ type: ["string", "null"] })
      })
    })
  })

  describe("GIVEN TypeSpec enum types", () => {

    describe("WHEN mapping string enums", () => {

      it("THEN should create enum with string values", async () => {
        // Arrange & Act
        const result = await compiler.compileTypeSpec({
          code: TypeSpecFixtures.dataTypesEnums,
          emitAsyncAPI: true
        })

        // Assert
        const message = result.asyncapi!.components!.messages!.EnumMessage
        const props = message.payload.properties!

        expect(props.status).toEqual({
          type: "string",
          enum: ["pending", "processing", "shipped", "delivered", "cancelled"]
        })
      })
    })

    describe("WHEN mapping numeric enums", () => {

      it("THEN should create enum with integer values", async () => {
        // Arrange & Act
        const result = await compiler.compileTypeSpec({
          code: TypeSpecFixtures.dataTypesEnums,
          emitAsyncAPI: true
        })

        // Assert
        const message = result.asyncapi!.components!.messages!.EnumMessage
        const props = message.payload.properties!

        expect(props.priority).toEqual({
          type: "integer",
          enum: [1, 2, 3, 4]
        })
      })
    })

    describe("WHEN mapping mixed-type enums", () => {

      it("THEN should handle heterogeneous enum values", async () => {
        // Arrange
        const mixedEnumCode = `
          @service({ title: "Mixed Enum Service" })
          namespace MixedEnumService {
            @channel("mixed")
            @publish
            op publishMixed(@body data: MixedEnumData): void;
          }
          
          enum MixedEnum {
            StringValue: "text",
            NumericValue: 42,
            BooleanValue: true
          }
          
          @message("MixedEnumData")
          model MixedEnumData {
            mixedField: MixedEnum;
          }
        `

        // Act
        const result = await compiler.compileTypeSpec({
          code: mixedEnumCode,
          emitAsyncAPI: true
        })

        // Assert
        const message = result.asyncapi!.components!.messages!.MixedEnumData
        const props = message.payload.properties!

        expect(props.mixedField.enum).toEqual(["text", 42, true])
      })
    })
  })

  describe("GIVEN TypeSpec record types", () => {

    describe("WHEN mapping Record<string> types", () => {

      it("THEN should create additionalProperties schema", async () => {
        // Arrange & Act
        const result = await compiler.compileTypeSpec({
          code: TypeSpecFixtures.dataTypesRecords,
          emitAsyncAPI: true
        })

        // Assert
        const message = result.asyncapi!.components!.messages!.RecordTypesMessage
        const props = message.payload.properties!

        expect(props.dynamicObject).toEqual({
          type: "object",
          additionalProperties: { type: "string" }
        })
      })
    })

    describe("WHEN mapping Record<Model> types", () => {

      it("THEN should reference component schemas in additionalProperties", async () => {
        // Arrange & Act
        const result = await compiler.compileTypeSpec({
          code: TypeSpecFixtures.dataTypesRecords,
          emitAsyncAPI: true
        })

        // Assert
        const message = result.asyncapi!.components!.messages!.RecordTypesMessage
        const props = message.payload.properties!

        expect(props.typedRecord).toEqual({
          type: "object",
          additionalProperties: {
            $ref: "#/components/schemas/UserProfile"
          }
        })
      })
    })

    describe("WHEN mapping nested Record types", () => {

      it("THEN should handle Record<Record<T>> structures", async () => {
        // Arrange & Act
        const result = await compiler.compileTypeSpec({
          code: TypeSpecFixtures.dataTypesRecords,
          emitAsyncAPI: true
        })

        // Assert
        const message = result.asyncapi!.components!.messages!.RecordTypesMessage
        const props = message.payload.properties!

        expect(props.nestedRecord).toEqual({
          type: "object",
          additionalProperties: {
            type: "object",
            additionalProperties: { type: "string" }
          }
        })
      })
    })
  })

  describe("GIVEN TypeSpec model types", () => {

    describe("WHEN mapping basic models", () => {

      it("THEN should create object schemas with properties", async () => {
        // Arrange
        const basicModelCode = `
          @service({ title: "Basic Model Service" })
          namespace BasicModelService {
            @channel("models")
            @publish
            op publishModel(@body data: BasicModel): void;
          }
          
          @message("BasicModel")
          model BasicModel {
            id: string;
            name: string;
            age: int32;
            isActive: boolean;
          }
        `

        // Act
        const result = await compiler.compileTypeSpec({
          code: basicModelCode,
          emitAsyncAPI: true
        })

        // Assert
        const message = result.asyncapi!.components!.messages!.BasicModel

        expect(message.payload.type).toBe("object")
        expect(message.payload.properties!.id).toEqual({ type: "string" })
        expect(message.payload.properties!.age).toEqual({ type: "integer", format: "int32" })
        expect(message.payload.required).toEqual(["id", "name", "age", "isActive"])
      })
    })

    describe("WHEN mapping model inheritance", () => {

      it("THEN should handle model extends with allOf", async () => {
        // Arrange
        const inheritanceCode = `
          @service({ title: "Inheritance Service" })
          namespace InheritanceService {
            @channel("inheritance")
            @publish
            op publishInherited(@body data: DerivedModel): void;
          }
          
          model BaseModel {
            id: string;
            createdAt: utcDateTime;
          }
          
          @message("DerivedModel")
          model DerivedModel extends BaseModel {
            name: string;
            description: string;
          }
        `

        // Act
        const result = await compiler.compileTypeSpec({
          code: inheritanceCode,
          emitAsyncAPI: true
        })

        // Assert
        const message = result.asyncapi!.components!.messages!.DerivedModel

        expect(message.payload.allOf).toBeDefined()
        expect(message.payload.allOf).toContainEqual({
          $ref: "#/components/schemas/BaseModel"
        })
      })
    })

    describe("WHEN mapping model composition", () => {

      it("THEN should handle model spreading and composition", async () => {
        // Arrange
        const compositionCode = `
          @service({ title: "Composition Service" })
          namespace CompositionService {
            @channel("composition")
            @publish
            op publishComposed(@body data: ComposedModel): void;
          }
          
          model TimestampMixin {
            createdAt: utcDateTime;
            updatedAt: utcDateTime;
          }
          
          model MetadataMixin {
            version: int32;
            tags: string[];
          }
          
          @message("ComposedModel")
          model ComposedModel {
            id: string;
            name: string;
            ...TimestampMixin;
            ...MetadataMixin;
          }
        `

        // Act
        const result = await compiler.compileTypeSpec({
          code: compositionCode,
          emitAsyncAPI: true
        })

        // Assert
        const message = result.asyncapi!.components!.messages!.ComposedModel
        const props = message.payload.properties!

        expect(props.id).toEqual({ type: "string" })
        expect(props.name).toEqual({ type: "string" })
        expect(props.createdAt).toEqual({ type: "string", format: "date-time" })
        expect(props.version).toEqual({ type: "integer", format: "int32" })
        expect(props.tags).toEqual({ type: "array", items: { type: "string" } })
      })
    })
  })

  describe("GIVEN TypeSpec template types", () => {

    describe("WHEN mapping generic models", () => {

      it("THEN should instantiate templates with concrete types", async () => {
        // Arrange
        const templateCode = `
          @service({ title: "Template Service" })
          namespace TemplateService {
            @channel("templates")
            @publish
            op publishTemplate(@body data: StringContainer): void;
          }
          
          model Container<T> {
            value: T;
            metadata: ContainerMetadata;
          }
          
          model ContainerMetadata {
            version: int32;
            timestamp: utcDateTime;
          }
          
          @message("StringContainer")
          model StringContainer is Container<string>;
        `

        // Act
        const result = await compiler.compileTypeSpec({
          code: templateCode,
          emitAsyncAPI: true
        })

        // Assert
        const message = result.asyncapi!.components!.messages!.StringContainer
        const props = message.payload.properties!

        expect(props.value).toEqual({ type: "string" })
        expect(props.metadata).toEqual({
          $ref: "#/components/schemas/ContainerMetadata"
        })
      })
    })

    describe("WHEN mapping complex template instantiations", () => {

      it("THEN should handle nested template parameters", async () => {
        // Arrange
        const complexTemplateCode = `
          @service({ title: "Complex Template Service" })
          namespace ComplexTemplateService {
            @channel("complex")
            @publish
            op publishComplex(@body data: PagedStringList): void;
          }
          
          model Paged<T> {
            items: T[];
            totalCount: int32;
            pageSize: int32;
            currentPage: int32;
          }
          
          model List<T> {
            data: T[];
            count: int32;
          }
          
          @message("PagedStringList")
          model PagedStringList is Paged<List<string>>;
        `

        // Act
        const result = await compiler.compileTypeSpec({
          code: complexTemplateCode,
          emitAsyncAPI: true
        })

        // Assert
        const message = result.asyncapi!.components!.messages!.PagedStringList
        const props = message.payload.properties!

        expect(props.items.type).toBe("array")
        expect(props.items.items.properties!.data).toEqual({
          type: "array",
          items: { type: "string" }
        })
      })
    })
  })

  describe("GIVEN complex type combinations", () => {

    describe("WHEN mapping arrays of unions", () => {

      it("THEN should create arrays with union item types", async () => {
        // Arrange
        const arrayUnionCode = `
          @service({ title: "Array Union Service" })
          namespace ArrayUnionService {
            @channel("array-unions")
            @publish
            op publishArrayUnion(@body data: ArrayUnionData): void;
          }
          
          @message("ArrayUnionData")
          model ArrayUnionData {
            mixedArray: (string | int32)[];
            statusArray: ("active" | "inactive" | "pending")[];
          }
        `

        // Act
        const result = await compiler.compileTypeSpec({
          code: arrayUnionCode,
          emitAsyncAPI: true
        })

        // Assert
        const message = result.asyncapi!.components!.messages!.ArrayUnionData
        const props = message.payload.properties!

        expect(props.mixedArray).toEqual({
          type: "array",
          items: {
            oneOf: [
              { type: "string" },
              { type: "integer", format: "int32" }
            ]
          }
        })
        expect(props.statusArray).toEqual({
          type: "array",
          items: {
            type: "string",
            enum: ["active", "inactive", "pending"]
          }
        })
      })
    })

    describe("WHEN mapping optional arrays", () => {

      it("THEN should handle optional and nullable array types", async () => {
        // Arrange
        const optionalArrayCode = `
          @service({ title: "Optional Array Service" })
          namespace OptionalArrayService {
            @channel("optional-arrays")
            @publish
            op publishOptionalArray(@body data: OptionalArrayData): void;
          }
          
          @message("OptionalArrayData")
          model OptionalArrayData {
            requiredArray: string[];
            optionalArray?: int32[];
            nullableArray: boolean[] | null;
          }
        `

        // Act
        const result = await compiler.compileTypeSpec({
          code: optionalArrayCode,
          emitAsyncAPI: true
        })

        // Assert
        const message = result.asyncapi!.components!.messages!.OptionalArrayData
        const props = message.payload.properties!
        const required = message.payload.required || []

        expect(props.requiredArray).toEqual({
          type: "array",
          items: { type: "string" }
        })
        expect(props.optionalArray).toEqual({
          type: "array",
          items: { type: "integer", format: "int32" }
        })
        expect(props.nullableArray.oneOf).toContainEqual({ type: "null" })
        expect(required).toContain("requiredArray")
        expect(required).not.toContain("optionalArray")
      })
    })

    describe("WHEN mapping recursive types", () => {

      it("THEN should handle self-referencing models", async () => {
        // Arrange
        const recursiveCode = `
          @service({ title: "Recursive Service" })
          namespace RecursiveService {
            @channel("recursive")
            @publish
            op publishRecursive(@body data: TreeNode): void;
          }
          
          @message("TreeNode")
          model TreeNode {
            value: string;
            children?: TreeNode[];
          }
        `

        // Act
        const result = await compiler.compileTypeSpec({
          code: recursiveCode,
          emitAsyncAPI: true
        })

        // Assert
        const message = result.asyncapi!.components!.messages!.TreeNode
        const props = message.payload.properties!

        expect(props.value).toEqual({ type: "string" })
        expect(props.children).toEqual({
          type: "array",
          items: {
            $ref: "#/components/messages/TreeNode"
          }
        })
      })
    })
  })

  describe("GIVEN validation and edge cases", () => {

    describe("WHEN handling type validation", () => {

      it("THEN should validate generated schemas against AsyncAPI specification", async () => {
        // Arrange & Act
        const result = await compiler.compileTypeSpec({
          code: TypeSpecFixtures.dataTypesPrimitives,
          emitAsyncAPI: true
        })

        // Assert
        const validation = await validator.validateAsyncAPI(result.asyncapi!, {
          strict: true,
          validateSemantic: true,
          customRules: [
            {
              name: "Data Types Validation",
              description: "Validates data type mapping completeness",
              validate: (asyncapi) => {
                const errors: string[] = []
                const messages = asyncapi.components?.messages || {}
                
                for (const [messageName, message] of Object.entries(messages)) {
                  if (!message.payload) {
                    errors.push(`Message ${messageName} missing payload`)
                  }
                  
                  if (!message.payload.type) {
                    errors.push(`Message ${messageName} payload missing type`)
                  }
                }
                
                return errors
              }
            }
          ]
        })

        expect(validation.isValid).toBe(true)
        expect(validation.errors).toHaveLength(0)
      })
    })

    describe("WHEN handling large type definitions", () => {

      it("THEN should handle models with many fields efficiently", async () => {
        // Arrange
        const largeModelData = TestDataGenerator.generateRandomTestData("large")
        const largeModelCode = TestDataGenerator.generateTestService("LargeModelService", largeModelData.operationCount)

        // Act
        const startTime = Date.now()
        const result = await compiler.compileTypeSpec({
          code: largeModelCode,
          emitAsyncAPI: true
        })
        const compilationTime = Date.now() - startTime

        // Assert
        compiler.validateCompilationSuccess(result)
        expect(Object.keys(result.asyncapi!.components!.messages!)).toHaveLength(largeModelData.operationCount)
        expect(compilationTime).toBeLessThan(10000) // Should complete within 10 seconds
      })
    })

    describe("WHEN handling edge cases", () => {

      it("THEN should handle empty models", async () => {
        // Arrange
        const emptyModelCode = `
          @service({ title: "Empty Model Service" })
          namespace EmptyModelService {
            @channel("empty")
            @publish
            op publishEmpty(@body data: EmptyModel): void;
          }
          
          @message("EmptyModel")
          model EmptyModel {
          }
        `

        // Act
        const result = await compiler.compileTypeSpec({
          code: emptyModelCode,
          emitAsyncAPI: true
        })

        // Assert
        const message = result.asyncapi!.components!.messages!.EmptyModel
        expect(message.payload.type).toBe("object")
        expect(message.payload.properties).toEqual({})
      })

      it("THEN should handle models with only optional fields", async () => {
        // Arrange
        const optionalOnlyCode = `
          @service({ title: "Optional Only Service" })
          namespace OptionalOnlyService {
            @channel("optional")
            @publish
            op publishOptional(@body data: OptionalOnlyModel): void;
          }
          
          @message("OptionalOnlyModel")
          model OptionalOnlyModel {
            field1?: string;
            field2?: int32;
            field3?: boolean;
          }
        `

        // Act
        const result = await compiler.compileTypeSpec({
          code: optionalOnlyCode,
          emitAsyncAPI: true
        })

        // Assert
        const message = result.asyncapi!.components!.messages!.OptionalOnlyModel
        const required = message.payload.required || []

        expect(required).toHaveLength(0)
        expect(message.payload.properties!.field1).toEqual({ type: "string" })
        expect(message.payload.properties!.field2).toEqual({ type: "integer", format: "int32" })
        expect(message.payload.properties!.field3).toEqual({ type: "boolean" })
      })
    })
  })
})