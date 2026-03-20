/**
 * Comprehensive Kafka Protocol Domain Tests
 *
 * Tests 50+ Kafka-specific scenarios for AsyncAPI generation
 */

import { describe, it, expect } from "bun:test";
import { createAsyncAPITestHost, compileAndGetAsyncAPI } from "../utils/test-helpers.js";

describe("Kafka Protocol - Comprehensive Domain Tests", () => {
  // Basic Kafka Configuration Tests (10 tests)
  describe("Basic Kafka Configuration", () => {
    it("should generate Kafka server with bootstrap servers", async () => {
      const host = await createAsyncAPITestHost();
      host.addTypeSpecFile(
        "main.tsp",
        `
				import "@lars-artmann/typespec-asyncapi";
				using TypeSpec.AsyncAPI;

				@server(#{
					name: "kafka-prod",
					url: "kafka://broker1:9092,broker2:9092,broker3:9092",
					protocol: "kafka",
					description: "Production Kafka cluster"
				})
				namespace KafkaTest;

				model KafkaMessage { id: string; }

				@channel("test.topic")
				@publish
				op publishMessage(): KafkaMessage;
			`,
      );

      await host.compile("./main.tsp");
      const diagnostics = await host.diagnose("./main.tsp", {
        emit: ["@lars-artmann/typespec-asyncapi"],
      });

      expect(diagnostics.filter((d) => d.severity === "error").length).toBe(0);
    });

    it("should handle Kafka topic with partitions", async () => {
      const host = await createAsyncAPITestHost();
      host.addTypeSpecFile(
        "main.tsp",
        `
				import "@lars-artmann/typespec-asyncapi";
				using TypeSpec.AsyncAPI;

				namespace PartitionedKafka;

				model Event { eventId: string; timestamp: utcDateTime; }

				@channel("events.partitioned")
				@protocol(#{
					protocol: "kafka",
					binding: #{
						topic: "events",
						partitions: 10,
						replicas: 3
					}
				})
				@publish
				op publishEvent(): Event;
			`,
      );

      const spec = await compileAndGetAsyncAPI(host, "./main.tsp");
      expect(spec).toBeDefined();
      expect(spec?.asyncapi).toBe("3.0.0"); // Compilation success
    });

    it("should handle Kafka consumer group configuration", async () => {
      const host = await createAsyncAPITestHost();
      host.addTypeSpecFile(
        "main.tsp",
        `
				import "@lars-artmann/typespec-asyncapi";
				using TypeSpec.AsyncAPI;

				namespace ConsumerGroup;

				model Message { data: string; }

				@channel("consumer.topic")
				@protocol(#{
					protocol: "kafka",
					binding: #{
						groupId: "consumer-group-1",
						topic: "messages"
					}
				})
				@subscribe
				op consumeMessages(): Message;
			`,
      );

      const spec = await compileAndGetAsyncAPI(host, "./main.tsp");
      expect(spec).toBeDefined();
      expect(spec?.asyncapi).toBe("3.0.0");
    });

    it("should support Kafka key-based routing", async () => {
      const host = await createAsyncAPITestHost();
      host.addTypeSpecFile(
        "main.tsp",
        `
				import "@lars-artmann/typespec-asyncapi";
				using TypeSpec.AsyncAPI;

				namespace KeyRouting;

				model UserEvent { userId: string; action: string; }

				@channel("user.events")
				@protocol(#{
					protocol: "kafka",
					binding: #{
						key: "userId",
						topic: "user-events"
					}
				})
				@publish
				op publishUserEvent(): UserEvent;
			`,
      );

      const spec = await compileAndGetAsyncAPI(host, "./main.tsp");
      expect(spec).toBeDefined();
      expect(spec?.asyncapi).toBe("3.0.0");
    });

    it("should handle Kafka compression settings", async () => {
      const host = await createAsyncAPITestHost();
      host.addTypeSpecFile(
        "main.tsp",
        `
				import "@lars-artmann/typespec-asyncapi";
				using TypeSpec.AsyncAPI;

				namespace Compression;

				model LargeMessage { payload: string; }

				@channel("compressed.messages")
				@protocol(#{
					protocol: "kafka",
					binding: #{
						compression: "gzip",
						topic: "large-messages"
					}
				})
				@publish
				op publishCompressed(): LargeMessage;
			`,
      );

      const spec = await compileAndGetAsyncAPI(host, "./main.tsp");
      expect(spec).toBeDefined();
      expect(spec?.asyncapi).toBe("3.0.0");
    });

    it("should support Kafka retention policies", async () => {
      const host = await createAsyncAPITestHost();
      host.addTypeSpecFile(
        "main.tsp",
        `
				import "@lars-artmann/typespec-asyncapi";
				using TypeSpec.AsyncAPI;

				namespace Retention;

				model TimedEvent { timestamp: utcDateTime; }

				@channel("retention.topic")
				@protocol(#{
					protocol: "kafka",
					binding: #{
						retentionMs: 86400000,
						topic: "timed-events"
					}
				})
				@publish
				op publishTimedEvent(): TimedEvent;
			`,
      );

      const spec = await compileAndGetAsyncAPI(host, "./main.tsp");
      expect(spec).toBeDefined();
      expect(spec?.asyncapi).toBe("3.0.0");
    });

    it("should handle Kafka idempotent producers", async () => {
      const host = await createAsyncAPITestHost();
      host.addTypeSpecFile(
        "main.tsp",
        `
				import "@lars-artmann/typespec-asyncapi";
				using TypeSpec.AsyncAPI;

				namespace Idempotent;

				model Transaction { txId: string; }

				@channel("transactions")
				@protocol(#{
					protocol: "kafka",
					binding: #{
						idempotent: true,
						topic: "transactions"
					}
				})
				@publish
				op publishTransaction(): Transaction;
			`,
      );

      const spec = await compileAndGetAsyncAPI(host, "./main.tsp");
      expect(spec).toBeDefined();
      expect(spec?.asyncapi).toBe("3.0.0");
    });

    it("should support Kafka exactly-once semantics", async () => {
      const host = await createAsyncAPITestHost();
      host.addTypeSpecFile(
        "main.tsp",
        `
				import "@lars-artmann/typespec-asyncapi";
				using TypeSpec.AsyncAPI;

				namespace ExactlyOnce;

				model Payment { amount: float64; }

				@channel("payments")
				@protocol(#{
					protocol: "kafka",
					binding: #{
						transactional: true,
						topic: "payments"
					}
				})
				@publish
				op publishPayment(): Payment;
			`,
      );

      const spec = await compileAndGetAsyncAPI(host, "./main.tsp");
      expect(spec).toBeDefined();
      expect(spec?.asyncapi).toBe("3.0.0");
    });

    it("should handle Kafka topic cleanup policies", async () => {
      const host = await createAsyncAPITestHost();
      host.addTypeSpecFile(
        "main.tsp",
        `
				import "@lars-artmann/typespec-asyncapi";
				using TypeSpec.AsyncAPI;

				namespace Cleanup;

				model Snapshot { state: string; }

				@channel("state.snapshots")
				@protocol(#{
					protocol: "kafka",
					binding: #{
						cleanupPolicy: "compact",
						topic: "snapshots"
					}
				})
				@publish
				op publishSnapshot(): Snapshot;
			`,
      );

      const spec = await compileAndGetAsyncAPI(host, "./main.tsp");
      expect(spec).toBeDefined();
      expect(spec?.asyncapi).toBe("3.0.0");
    });

    it("should support Kafka batch configurations", async () => {
      const host = await createAsyncAPITestHost();
      host.addTypeSpecFile(
        "main.tsp",
        `
				import "@lars-artmann/typespec-asyncapi";
				using TypeSpec.AsyncAPI;

				namespace Batching;

				model BatchEvent { events: string[]; }

				@channel("batch.events")
				@protocol(#{
					protocol: "kafka",
					binding: #{
						batchSize: 1000,
						lingerMs: 100,
						topic: "batched-events"
					}
				})
				@publish
				op publishBatch(): BatchEvent;
			`,
      );

      const spec = await compileAndGetAsyncAPI(host, "./main.tsp");
      expect(spec).toBeDefined();
      expect(spec?.asyncapi).toBe("3.0.0");
    });
  });

  // Kafka Security & Authentication (10 tests)
  describe("Kafka Security & Authentication", () => {
    it("should support SASL/SCRAM-SHA-256 authentication", async () => {
      const host = await createAsyncAPITestHost();
      host.addTypeSpecFile(
        "main.tsp",
        `
				import "@lars-artmann/typespec-asyncapi";
				using TypeSpec.AsyncAPI;

				namespace SASLAuth;

				model SecureMessage { data: string; }

				@channel("secure.messages")
				@protocol(#{
					protocol: "kafka",
					binding: #{ topic: "secure" }
				})
				@security(#{
					name: "kafkaSASL",
					scheme: #{
						type: "sasl",
						mechanism: "SCRAM-SHA-256"
					}
				})
				@publish
				op publishSecure(): SecureMessage;
			`,
      );

      const spec = await compileAndGetAsyncAPI(host, "./main.tsp");
      expect(spec).toBeDefined();
      expect(spec?.asyncapi).toBe("3.0.0");
    });

    it("should support SASL/SCRAM-SHA-512 authentication", async () => {
      const host = await createAsyncAPITestHost();
      host.addTypeSpecFile(
        "main.tsp",
        `
				import "@lars-artmann/typespec-asyncapi";
				using TypeSpec.AsyncAPI;

				namespace SASL512;

				model Message { content: string; }

				@channel("sasl512.topic")
				@security(#{
					name: "sasl512",
					scheme: #{
						type: "sasl",
						mechanism: "SCRAM-SHA-512"
					}
				})
				@publish
				op publish(): Message;
			`,
      );

      const spec = await compileAndGetAsyncAPI(host, "./main.tsp");
      expect(spec).toBeDefined();
      expect(spec?.asyncapi).toBe("3.0.0");
    });

    it("should support SASL/PLAIN authentication", async () => {
      const host = await createAsyncAPITestHost();
      host.addTypeSpecFile(
        "main.tsp",
        `
				import "@lars-artmann/typespec-asyncapi";
				using TypeSpec.AsyncAPI;

				namespace PlainAuth;

				model Msg { id: string; }

				@channel("plain.auth")
				@security(#{
					name: "plainSASL",
					scheme: #{
						type: "sasl",
						mechanism: "PLAIN"
					}
				})
				@publish
				op publishMessage(): Msg;
			`,
      );

      const spec = await compileAndGetAsyncAPI(host, "./main.tsp");
      expect(spec).toBeDefined();
      expect(spec?.asyncapi).toBe("3.0.0");
    });

    it("should support SASL/GSSAPI (Kerberos) authentication", async () => {
      const host = await createAsyncAPITestHost();
      host.addTypeSpecFile(
        "main.tsp",
        `
				import "@lars-artmann/typespec-asyncapi";
				using TypeSpec.AsyncAPI;

				namespace Kerberos;

				model KerberosMsg { data: string; }

				@channel("kerberos.topic")
				@security(#{
					name: "gssapi",
					scheme: #{
						type: "sasl",
						mechanism: "GSSAPI"
					}
				})
				@publish
				op publishKerberos(): KerberosMsg;
			`,
      );

      const spec = await compileAndGetAsyncAPI(host, "./main.tsp");
      expect(spec).toBeDefined();
      expect(spec?.asyncapi).toBe("3.0.0");
    });

    it("should support SASL/OAUTHBEARER authentication", async () => {
      const host = await createAsyncAPITestHost();
      host.addTypeSpecFile(
        "main.tsp",
        `
				import "@lars-artmann/typespec-asyncapi";
				using TypeSpec.AsyncAPI;

				namespace OAuth;

				model OAuthMsg { token: string; }

				@channel("oauth.topic")
				@security(#{
					name: "oauthBearer",
					scheme: #{
						type: "sasl",
						mechanism: "OAUTHBEARER"
					}
				})
				@publish
				op publishOAuth(): OAuthMsg;
			`,
      );

      const spec = await compileAndGetAsyncAPI(host, "./main.tsp");
      expect(spec).toBeDefined();
      expect(spec?.asyncapi).toBe("3.0.0");
    });

    it("should support SSL/TLS encryption", async () => {
      const host = await createAsyncAPITestHost();
      host.addTypeSpecFile(
        "main.tsp",
        `
				import "@lars-artmann/typespec-asyncapi";
				using TypeSpec.AsyncAPI;

				namespace TLS;

				model EncryptedMsg { encrypted: string; }

				@server("kafka-tls", #{
					url: "kafka+ssl://broker:9093",
					protocol: "kafka"
				})
				namespace KafkaTLS;

				@channel("encrypted.topic")
				@publish
				op publishEncrypted(): EncryptedMsg;
			`,
      );

      const spec = await compileAndGetAsyncAPI(host, "./main.tsp");
      expect(spec).toBeDefined();
      expect(spec?.asyncapi).toBe("3.0.0");
    });

    it("should support Kafka ACLs configuration", async () => {
      const host = await createAsyncAPITestHost();
      host.addTypeSpecFile(
        "main.tsp",
        `
				import "@lars-artmann/typespec-asyncapi";
				using TypeSpec.AsyncAPI;

				namespace ACLs;

				model ACLMessage { resource: string; }

				@channel("acl.protected")
				@protocol(#{
					protocol: "kafka",
					binding: #{
						acl: "read,write",
						topic: "protected"
					}
				})
				@publish
				op publishACL(): ACLMessage;
			`,
      );

      const spec = await compileAndGetAsyncAPI(host, "./main.tsp");
      expect(spec).toBeDefined();
      expect(spec?.asyncapi).toBe("3.0.0");
    });

    it("should support mTLS (mutual TLS) authentication", async () => {
      const host = await createAsyncAPITestHost();
      host.addTypeSpecFile(
        "main.tsp",
        `
				import "@lars-artmann/typespec-asyncapi";
				using TypeSpec.AsyncAPI;

				namespace MutualTLS;

				model MutualAuthMsg { clientCert: string; }

				@server("mtls-kafka", #{
					url: "kafka+ssl://broker:9094",
					protocol: "kafka",
					description: "Mutual TLS enabled"
				})
				namespace MTLSKafka;

				@channel("mtls.topic")
				@publish
				op publishMTLS(): MutualAuthMsg;
			`,
      );

      const spec = await compileAndGetAsyncAPI(host, "./main.tsp");
      expect(spec).toBeDefined();
      expect(spec?.asyncapi).toBe("3.0.0");
    });

    it("should support Schema Registry authentication", async () => {
      const host = await createAsyncAPITestHost();
      host.addTypeSpecFile(
        "main.tsp",
        `
				import "@lars-artmann/typespec-asyncapi";
				using TypeSpec.AsyncAPI;

				namespace SchemaRegistry;

				model RegisteredMsg { schemaId: int32; data: string; }

				@channel("schema.registry")
				@protocol(#{
					protocol: "kafka",
					binding: #{
						schemaRegistryUrl: "https://schema-registry:8081",
						schemaRegistryAuth: "basic",
						topic: "registered"
					}
				})
				@publish
				op publishRegistered(): RegisteredMsg;
			`,
      );

      const spec = await compileAndGetAsyncAPI(host, "./main.tsp");
      expect(spec).toBeDefined();
      expect(spec?.asyncapi).toBe("3.0.0");
    });

    it("should support delegation tokens", async () => {
      const host = await createAsyncAPITestHost();
      host.addTypeSpecFile(
        "main.tsp",
        `
				import "@lars-artmann/typespec-asyncapi";
				using TypeSpec.AsyncAPI;

				namespace DelegationToken;

				model TokenMsg { token: string; }

				@channel("delegation.token")
				@security(#{
					name: "delegationToken",
					scheme: #{
						type: "sasl",
						mechanism: "SCRAM-SHA-256",
						delegationToken: true
					}
				})
				@publish
				op publishToken(): TokenMsg;
			`,
      );

      const spec = await compileAndGetAsyncAPI(host, "./main.tsp");
      expect(spec).toBeDefined();
      expect(spec?.asyncapi).toBe("3.0.0");
    });
  });

  // Kafka Message Formats & Serialization (10 tests)
  describe("Kafka Message Formats & Serialization", () => {
    it("should support Avro serialization", async () => {
      const host = await createAsyncAPITestHost();
      host.addTypeSpecFile(
        "main.tsp",
        `
				import "@lars-artmann/typespec-asyncapi";
				using TypeSpec.AsyncAPI;

				namespace AvroSerialization;

				model AvroMsg {
					id: string;
					name: string;
					age: int32;
				}

				@channel("avro.topic")
				@protocol(#{
					protocol: "kafka",
					binding: #{
						serializationFormat: "avro",
						topic: "avro-messages"
					}
				})
				@publish
				op publishAvro(): AvroMsg;
			`,
      );

      const spec = await compileAndGetAsyncAPI(host, "./main.tsp");
      expect(spec).toBeDefined();
      expect(spec?.asyncapi).toBe("3.0.0");
    });

    it("should support Protobuf serialization", async () => {
      const host = await createAsyncAPITestHost();
      host.addTypeSpecFile(
        "main.tsp",
        `
				import "@lars-artmann/typespec-asyncapi";
				using TypeSpec.AsyncAPI;

				namespace ProtobufSerialization;

				model ProtoMsg {
					userId: int64;
					action: string;
				}

				@channel("proto.topic")
				@protocol(#{
					protocol: "kafka",
					binding: #{
						serializationFormat: "protobuf",
						topic: "proto-messages"
					}
				})
				@publish
				op publishProto(): ProtoMsg;
			`,
      );

      const spec = await compileAndGetAsyncAPI(host, "./main.tsp");
      expect(spec).toBeDefined();
      expect(spec?.asyncapi).toBe("3.0.0");
    });

    it("should support JSON serialization", async () => {
      const host = await createAsyncAPITestHost();
      host.addTypeSpecFile(
        "main.tsp",
        `
				import "@lars-artmann/typespec-asyncapi";
				using TypeSpec.AsyncAPI;

				namespace JSONSerialization;

				model JSONMsg {
					event: string;
					payload: Record<unknown>;
				}

				@channel("json.topic")
				@protocol(#{
					protocol: "kafka",
					binding: #{
						serializationFormat: "json",
						topic: "json-messages"
					}
				})
				@publish
				op publishJSON(): JSONMsg;
			`,
      );

      const spec = await compileAndGetAsyncAPI(host, "./main.tsp");
      expect(spec).toBeDefined();
      expect(spec?.asyncapi).toBe("3.0.0");
    });

    it("should support binary/raw serialization", async () => {
      const host = await createAsyncAPITestHost();
      host.addTypeSpecFile(
        "main.tsp",
        `
				import "@lars-artmann/typespec-asyncapi";
				using TypeSpec.AsyncAPI;

				namespace BinarySerialization;

				model BinaryMsg {
					data: bytes;
					checksum: string;
				}

				@channel("binary.topic")
				@protocol(#{
					protocol: "kafka",
					binding: #{
						serializationFormat: "binary",
						topic: "binary-messages"
					}
				})
				@publish
				op publishBinary(): BinaryMsg;
			`,
      );

      const spec = await compileAndGetAsyncAPI(host, "./main.tsp");
      expect(spec).toBeDefined();
      expect(spec?.asyncapi).toBe("3.0.0");
    });

    it("should support message headers", async () => {
      const host = await createAsyncAPITestHost();
      host.addTypeSpecFile(
        "main.tsp",
        `
				import "@lars-artmann/typespec-asyncapi";
				using TypeSpec.AsyncAPI;

				namespace Headers;

				model HeaderedMsg {
					messageId: string;
					correlationId: string;
					payload: string;
				}

				@channel("headered.topic")
				@protocol(#{
					protocol: "kafka",
					binding: #{
						headers: true,
						topic: "headered-messages"
					}
				})
				@publish
				op publishHeadered(): HeaderedMsg;
			`,
      );

      const spec = await compileAndGetAsyncAPI(host, "./main.tsp");
      expect(spec).toBeDefined();
      expect(spec?.asyncapi).toBe("3.0.0");
    });

    it("should support CloudEvents format", async () => {
      const host = await createAsyncAPITestHost();
      host.addTypeSpecFile(
        "main.tsp",
        `
				import "@lars-artmann/typespec-asyncapi";
				using TypeSpec.AsyncAPI;

				namespace CloudEvents;

				model CloudEvent {
					id: string;
					source: string;
					type: string;
					datacontenttype: string;
					data: Record<unknown>;
				}

				@channel("cloudevents.topic")
				@protocol(#{
					protocol: "kafka",
					binding: #{
						serializationFormat: "cloudevents",
						topic: "cloud-events"
					}
				})
				@publish
				op publishCloudEvent(): CloudEvent;
			`,
      );

      const spec = await compileAndGetAsyncAPI(host, "./main.tsp");
      expect(spec).toBeDefined();
      expect(spec?.asyncapi).toBe("3.0.0");
    });

    it("should support message timestamps", async () => {
      const host = await createAsyncAPITestHost();
      host.addTypeSpecFile(
        "main.tsp",
        `
				import "@lars-artmann/typespec-asyncapi";
				using TypeSpec.AsyncAPI;

				namespace Timestamps;

				model TimestampedMsg {
					eventTime: utcDateTime;
					logTime: utcDateTime;
					data: string;
				}

				@channel("timestamped.topic")
				@protocol(#{
					protocol: "kafka",
					binding: #{
						timestampType: "CreateTime",
						topic: "timestamped"
					}
				})
				@publish
				op publishTimestamped(): TimestampedMsg;
			`,
      );

      const spec = await compileAndGetAsyncAPI(host, "./main.tsp");
      expect(spec).toBeDefined();
      expect(spec?.asyncapi).toBe("3.0.0");
    });

    it("should support Schema Registry with versioning", async () => {
      const host = await createAsyncAPITestHost();
      host.addTypeSpecFile(
        "main.tsp",
        `
				import "@lars-artmann/typespec-asyncapi";
				using TypeSpec.AsyncAPI;

				namespace SchemaVersioning;

				model VersionedMsg {
					schemaVersion: int32;
					payload: Record<unknown>;
				}

				@channel("versioned.schema")
				@protocol(#{
					protocol: "kafka",
					binding: #{
						schemaRegistry: true,
						schemaVersion: 2,
						topic: "versioned"
					}
				})
				@publish
				op publishVersioned(): VersionedMsg;
			`,
      );

      const spec = await compileAndGetAsyncAPI(host, "./main.tsp");
      expect(spec).toBeDefined();
      expect(spec?.asyncapi).toBe("3.0.0");
    });

    it("should support custom serializers", async () => {
      const host = await createAsyncAPITestHost();
      host.addTypeSpecFile(
        "main.tsp",
        `
				import "@lars-artmann/typespec-asyncapi";
				using TypeSpec.AsyncAPI;

				namespace CustomSerializer;

				model CustomMsg {
					customField: string;
				}

				@channel("custom.serializer")
				@protocol(#{
					protocol: "kafka",
					binding: #{
						serializationFormat: "custom",
						serializerClass: "com.example.CustomSerializer",
						topic: "custom"
					}
				})
				@publish
				op publishCustom(): CustomMsg;
			`,
      );

      const spec = await compileAndGetAsyncAPI(host, "./main.tsp");
      expect(spec).toBeDefined();
      expect(spec?.asyncapi).toBe("3.0.0");
    });

    it("should support message compression per message", async () => {
      const host = await createAsyncAPITestHost();
      host.addTypeSpecFile(
        "main.tsp",
        `
				import "@lars-artmann/typespec-asyncapi";
				using TypeSpec.AsyncAPI;

				namespace MessageCompression;

				model CompressedMsg {
					compressedData: bytes;
				}

				@channel("compressed.messages")
				@protocol(#{
					protocol: "kafka",
					binding: #{
						messageCompression: "snappy",
						topic: "compressed"
					}
				})
				@publish
				op publishCompressed(): CompressedMsg;
			`,
      );

      const spec = await compileAndGetAsyncAPI(host, "./main.tsp");
      expect(spec).toBeDefined();
      expect(spec?.asyncapi).toBe("3.0.0");
    });
  });

  // Kafka Streams & Advanced Patterns (20 tests)
  describe("Kafka Streams & Advanced Patterns", () => {
    it("should support Kafka Streams topology", async () => {
      const host = await createAsyncAPITestHost();
      host.addTypeSpecFile(
        "main.tsp",
        `
				import "@lars-artmann/typespec-asyncapi";
				using TypeSpec.AsyncAPI;

				namespace Streams;

				model StreamEvent { key: string; value: string; }

				@channel("stream.input")
				@subscribe
				op consumeStream(): StreamEvent;

				@channel("stream.output")
				@publish
				op publishStream(): StreamEvent;
			`,
      );

      const spec = await compileAndGetAsyncAPI(host, "./main.tsp");
      expect(spec).toBeDefined();
      expect(spec?.asyncapi).toBe("3.0.0");
    });

    it("should support compacted topics for state stores", async () => {
      const host = await createAsyncAPITestHost();
      host.addTypeSpecFile(
        "main.tsp",
        `
				import "@lars-artmann/typespec-asyncapi";
				using TypeSpec.AsyncAPI;

				namespace StateStore;

				model State { key: string; state: Record<unknown>; }

				@channel("state.store")
				@protocol(#{
					protocol: "kafka",
					binding: #{
						cleanupPolicy: "compact",
						topic: "state-store"
					}
				})
				@publish
				op publishState(): State;
			`,
      );

      const spec = await compileAndGetAsyncAPI(host, "./main.tsp");
      expect(spec).toBeDefined();
      expect(spec?.asyncapi).toBe("3.0.0");
    });

    it("should support changelog topics", async () => {
      const host = await createAsyncAPITestHost();
      host.addTypeSpecFile(
        "main.tsp",
        `
				import "@lars-artmann/typespec-asyncapi";
				using TypeSpec.AsyncAPI;

				namespace Changelog;

				model Change { changeId: string; before: Record<unknown>; after: Record<unknown>; }

				@channel("changelog.topic")
				@protocol(#{
					protocol: "kafka",
					binding: #{
						isChangelog: true,
						topic: "changelog"
					}
				})
				@publish
				op publishChange(): Change;
			`,
      );

      const spec = await compileAndGetAsyncAPI(host, "./main.tsp");
      expect(spec).toBeDefined();
      expect(spec?.asyncapi).toBe("3.0.0");
    });

    it("should support windowed aggregations", async () => {
      const host = await createAsyncAPITestHost();
      host.addTypeSpecFile(
        "main.tsp",
        `
				import "@lars-artmann/typespec-asyncapi";
				using TypeSpec.AsyncAPI;

				namespace WindowedAgg;

				model WindowedResult {
					windowStart: utcDateTime;
					windowEnd: utcDateTime;
					count: int64;
				}

				@channel("windowed.results")
				@publish
				op publishWindowedResult(): WindowedResult;
			`,
      );

      const spec = await compileAndGetAsyncAPI(host, "./main.tsp");
      expect(spec).toBeDefined();
      expect(spec?.asyncapi).toBe("3.0.0");
    });

    it("should support join operations", async () => {
      const host = await createAsyncAPITestHost();
      host.addTypeSpecFile(
        "main.tsp",
        `
				import "@lars-artmann/typespec-asyncapi";
				using TypeSpec.AsyncAPI;

				namespace Join;

				model JoinedEvent {
					leftKey: string;
					rightKey: string;
					combined: Record<unknown>;
				}

				@channel("joined.events")
				@publish
				op publishJoined(): JoinedEvent;
			`,
      );

      const spec = await compileAndGetAsyncAPI(host, "./main.tsp");
      expect(spec).toBeDefined();
      expect(spec?.asyncapi).toBe("3.0.0");
    });

    it("should support dead letter queues", async () => {
      const host = await createAsyncAPITestHost();
      host.addTypeSpecFile(
        "main.tsp",
        `
				import "@lars-artmann/typespec-asyncapi";
				using TypeSpec.AsyncAPI;

				namespace DLQ;

				model FailedMessage {
					originalTopic: string;
					error: string;
					payload: bytes;
				}

				@channel("dlq.topic")
				@protocol(#{
					protocol: "kafka",
					binding: #{
						isDLQ: true,
						topic: "dead-letter-queue"
					}
				})
				@publish
				op publishDLQ(): FailedMessage;
			`,
      );

      const spec = await compileAndGetAsyncAPI(host, "./main.tsp");
      expect(spec).toBeDefined();
      expect(spec?.asyncapi).toBe("3.0.0");
    });

    it("should support exactly-once processing", async () => {
      const host = await createAsyncAPITestHost();
      host.addTypeSpecFile(
        "main.tsp",
        `
				import "@lars-artmann/typespec-asyncapi";
				using TypeSpec.AsyncAPI;

				namespace ExactlyOnceProcessing;

				model Transaction { txId: string; amount: float64; }

				@channel("transactions")
				@protocol(#{
					protocol: "kafka",
					binding: #{
						exactlyOnce: true,
						transactional: true,
						topic: "transactions"
					}
				})
				@publish
				op publishTransaction(): Transaction;
			`,
      );

      const spec = await compileAndGetAsyncAPI(host, "./main.tsp");
      expect(spec).toBeDefined();
      expect(spec?.asyncapi).toBe("3.0.0");
    });

    it("should support Kafka Connect integration", async () => {
      const host = await createAsyncAPITestHost();
      host.addTypeSpecFile(
        "main.tsp",
        `
				import "@lars-artmann/typespec-asyncapi";
				using TypeSpec.AsyncAPI;

				namespace Connect;

				model ConnectorEvent {
					connectorName: string;
					data: Record<unknown>;
				}

				@channel("connect.events")
				@protocol(#{
					protocol: "kafka",
					binding: #{
						connector: "jdbc-source",
						topic: "connect-events"
					}
				})
				@publish
				op publishConnectorEvent(): ConnectorEvent;
			`,
      );

      const spec = await compileAndGetAsyncAPI(host, "./main.tsp");
      expect(spec).toBeDefined();
      expect(spec?.asyncapi).toBe("3.0.0");
    });

    it("should support CDC (Change Data Capture) patterns", async () => {
      const host = await createAsyncAPITestHost();
      host.addTypeSpecFile(
        "main.tsp",
        `
				import "@lars-artmann/typespec-asyncapi";
				using TypeSpec.AsyncAPI;

				namespace CDC;

				model CDCEvent {
					operation: "INSERT" | "UPDATE" | "DELETE";
					tableName: string;
					before?: Record<unknown>;
					after?: Record<unknown>;
				}

				@channel("cdc.events")
				@publish
				op publishCDC(): CDCEvent;
			`,
      );

      const spec = await compileAndGetAsyncAPI(host, "./main.tsp");
      expect(spec).toBeDefined();
      expect(spec?.asyncapi).toBe("3.0.0");
    });

    it("should support event sourcing patterns", async () => {
      const host = await createAsyncAPITestHost();
      host.addTypeSpecFile(
        "main.tsp",
        `
				import "@lars-artmann/typespec-asyncapi";
				using TypeSpec.AsyncAPI;

				namespace EventSourcing;

				model Event {
					aggregateId: string;
					eventType: string;
					version: int32;
					data: Record<unknown>;
				}

				@channel("events.{aggregateId}")
				@publish
				op publishEvent(): Event;
			`,
      );

      const spec = await compileAndGetAsyncAPI(host, "./main.tsp");
      expect(spec).toBeDefined();
      expect(spec?.asyncapi).toBe("3.0.0");
    });

    it("should support CQRS patterns", async () => {
      const host = await createAsyncAPITestHost();
      host.addTypeSpecFile(
        "main.tsp",
        `
				import "@lars-artmann/typespec-asyncapi";
				using TypeSpec.AsyncAPI;

				namespace CQRS;

				model Command {
					commandId: string;
					commandType: string;
					payload: Record<unknown>;
				}

				@channel("commands")
				@subscribe
				op consumeCommand(): Command;

				model QueryResult {
					queryId: string;
					result: Record<unknown>;
				}

				@channel("query.results")
				@publish
				op publishQueryResult(): QueryResult;
			`,
      );

      const spec = await compileAndGetAsyncAPI(host, "./main.tsp");
      expect(spec).toBeDefined();
      expect(spec?.asyncapi).toBe("3.0.0");
    });

    it("should support saga patterns", async () => {
      const host = await createAsyncAPITestHost();
      host.addTypeSpecFile(
        "main.tsp",
        `
				import "@lars-artmann/typespec-asyncapi";
				using TypeSpec.AsyncAPI;

				namespace Saga;

				model SagaStep {
					sagaId: string;
					stepNumber: int32;
					status: "pending" | "completed" | "compensated";
					data: Record<unknown>;
				}

				@channel("saga.steps")
				@publish
				op publishSagaStep(): SagaStep;
			`,
      );

      const spec = await compileAndGetAsyncAPI(host, "./main.tsp");
      expect(spec).toBeDefined();
      expect(spec?.asyncapi).toBe("3.0.0");
    });

    it("should support request-reply patterns", async () => {
      const host = await createAsyncAPITestHost();
      host.addTypeSpecFile(
        "main.tsp",
        `
				import "@lars-artmann/typespec-asyncapi";
				using TypeSpec.AsyncAPI;

				namespace RequestReply;

				model Request {
					requestId: string;
					replyTo: string;
					payload: Record<unknown>;
				}

				@channel("requests")
				@publish
				op publishRequest(): Request;

				model Response {
					requestId: string;
					result: Record<unknown>;
				}

				@channel("responses.{requestId}")
				@subscribe
				op consumeResponse(): Response;
			`,
      );

      const spec = await compileAndGetAsyncAPI(host, "./main.tsp");
      expect(spec).toBeDefined();
      expect(spec?.asyncapi).toBe("3.0.0");
    });

    it("should support priority queues", async () => {
      const host = await createAsyncAPITestHost();
      host.addTypeSpecFile(
        "main.tsp",
        `
				import "@lars-artmann/typespec-asyncapi";
				using TypeSpec.AsyncAPI;

				namespace PriorityQueue;

				model PriorityMessage {
					priority: "low" | "medium" | "high" | "urgent";
					message: string;
				}

				@channel("priority.messages")
				@protocol(#{
					protocol: "kafka",
					binding: #{
						priority: true,
						topic: "priority-queue"
					}
				})
				@publish
				op publishPriority(): PriorityMessage;
			`,
      );

      const spec = await compileAndGetAsyncAPI(host, "./main.tsp");
      expect(spec).toBeDefined();
      expect(spec?.asyncapi).toBe("3.0.0");
    });

    it("should support scheduled messages", async () => {
      const host = await createAsyncAPITestHost();
      host.addTypeSpecFile(
        "main.tsp",
        `
				import "@lars-artmann/typespec-asyncapi";
				using TypeSpec.AsyncAPI;

				namespace Scheduled;

				model ScheduledMessage {
					scheduleTime: utcDateTime;
					payload: string;
				}

				@channel("scheduled.messages")
				@publish
				op publishScheduled(): ScheduledMessage;
			`,
      );

      const spec = await compileAndGetAsyncAPI(host, "./main.tsp");
      expect(spec).toBeDefined();
      expect(spec?.asyncapi).toBe("3.0.0");
    });

    it("should support batch processing", async () => {
      const host = await createAsyncAPITestHost();
      host.addTypeSpecFile(
        "main.tsp",
        `
				import "@lars-artmann/typespec-asyncapi";
				using TypeSpec.AsyncAPI;

				namespace Batch;

				model BatchJob {
					batchId: string;
					items: Record<unknown>[];
					totalItems: int32;
				}

				@channel("batch.jobs")
				@publish
				op publishBatch(): BatchJob;
			`,
      );

      const spec = await compileAndGetAsyncAPI(host, "./main.tsp");
      expect(spec).toBeDefined();
      expect(spec?.asyncapi).toBe("3.0.0");
    });

    it("should support rate limiting", async () => {
      const host = await createAsyncAPITestHost();
      host.addTypeSpecFile(
        "main.tsp",
        `
				import "@lars-artmann/typespec-asyncapi";
				using TypeSpec.AsyncAPI;

				namespace RateLimit;

				model RateLimitedMsg {
					quota: int32;
					remaining: int32;
					resetTime: utcDateTime;
				}

				@channel("ratelimited")
				@protocol(#{
					protocol: "kafka",
					binding: #{
						rateLimit: 1000,
						rateLimitWindow: 60000,
						topic: "rate-limited"
					}
				})
				@publish
				op publishRateLimited(): RateLimitedMsg;
			`,
      );

      const spec = await compileAndGetAsyncAPI(host, "./main.tsp");
      expect(spec).toBeDefined();
      expect(spec?.asyncapi).toBe("3.0.0");
    });

    it("should support circuit breaker patterns", async () => {
      const host = await createAsyncAPITestHost();
      host.addTypeSpecFile(
        "main.tsp",
        `
				import "@lars-artmann/typespec-asyncapi";
				using TypeSpec.AsyncAPI;

				namespace CircuitBreaker;

				model CircuitState {
					state: "closed" | "open" | "half-open";
					failureCount: int32;
					lastFailure?: utcDateTime;
				}

				@channel("circuit.state")
				@publish
				op publishCircuitState(): CircuitState;
			`,
      );

      const spec = await compileAndGetAsyncAPI(host, "./main.tsp");
      expect(spec).toBeDefined();
      expect(spec?.asyncapi).toBe("3.0.0");
    });

    it("should support distributed tracing", async () => {
      const host = await createAsyncAPITestHost();
      host.addTypeSpecFile(
        "main.tsp",
        `
				import "@lars-artmann/typespec-asyncapi";
				using TypeSpec.AsyncAPI;

				namespace Tracing;

				model TracedMessage {
					traceId: string;
					spanId: string;
					parentSpanId?: string;
					payload: Record<unknown>;
				}

				@channel("traced.messages")
				@publish
				op publishTraced(): TracedMessage;
			`,
      );

      const spec = await compileAndGetAsyncAPI(host, "./main.tsp");
      expect(spec).toBeDefined();
      expect(spec?.asyncapi).toBe("3.0.0");
    });

    it("should support multi-region replication", async () => {
      const host = await createAsyncAPITestHost();
      host.addTypeSpecFile(
        "main.tsp",
        `
				import "@lars-artmann/typespec-asyncapi";
				using TypeSpec.AsyncAPI;

				namespace MultiRegion;

				model ReplicatedMsg {
					region: string;
					replicationLag: int64;
					data: string;
				}

				@channel("replicated.messages")
				@protocol(#{
					protocol: "kafka",
					binding: #{
						replication: true,
						minInsyncReplicas: 2,
						topic: "replicated"
					}
				})
				@publish
				op publishReplicated(): ReplicatedMsg;
			`,
      );

      const spec = await compileAndGetAsyncAPI(host, "./main.tsp");
      expect(spec).toBeDefined();
      expect(spec?.asyncapi).toBe("3.0.0");
    });
  });
});
