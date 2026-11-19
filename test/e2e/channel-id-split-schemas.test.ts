/**
 * E2E Test: Channel identifiers combined with split-schemas
 *
 * Locks the interaction between `@channel(address, id)` (PR #291) and the
 * `split-schemas` option: the custom channel key must survive `$ref`
 * rewriting, paired operations must share one channel object, distinct IDs
 * at one address must stay separate channels, and every schema ref in the
 * chain (operations -> channels -> components.messages -> external files)
 * must be rewritten to its external path.
 */

import { compileAsyncAPI } from "../utils/test-helpers.js";
import type { AsyncAPIEmitterOptions } from "../../src/infrastructure/configuration/asyncAPIEmitterOptions.js";

const source = `
  namespace ChannelIdSplit;

  model UserSignedUp { userId: string; email: string; }
  model UserNotified { userId: string; channel: string; }

  @channel("events/v1/users", "userEvents")
  @publish op publishUserSignedUp(): UserSignedUp;

  @channel("events/v1/users", "userEvents")
  @subscribe op receiveUserSignedUp(): UserSignedUp;

  @channel("events/v1/live", "chatStream")
  @publish op sendChat(): UserNotified;

  @channel("events/v1/live", "presenceStream")
  @publish op sendPresence(): UserNotified;
`;

const splitOptions: AsyncAPIEmitterOptions = {
  "split-schemas": true,
  "file-type": "json",
};

describe("e2E: Channel IDs with split-schemas", () => {
  it("keys channels by id, not address, while schemas split to files", async () => {
    const { asyncApiDoc: doc } = await compileAsyncAPI(source, splitOptions);
    expect(doc).not.toBeNull();

    expect(Object.keys(doc!.channels)).toStrictEqual([
      "userEvents",
      "chatStream",
      "presenceStream",
    ]);
    expect(doc!.channels.userEvents!.address).toBe("events/v1/users");
    expect(doc!.channels.chatStream!.address).toBe("events/v1/live");
    expect(doc!.channels.presenceStream!.address).toBe("events/v1/live");
  });

  it("pairs operations sharing an id into one channel and keeps ids separate at one address", async () => {
    const { asyncApiDoc: doc } = await compileAsyncAPI(source, splitOptions);

    const sharedRef = { $ref: "#/channels/userEvents" };
    expect(doc!.operations.publishUserSignedUp!.channel).toStrictEqual(
      sharedRef,
    );
    expect(doc!.operations.receiveUserSignedUp!.channel).toStrictEqual(
      sharedRef,
    );
    expect(doc!.operations.sendChat!.channel).toStrictEqual({
      $ref: "#/channels/chatStream",
    });
    expect(doc!.operations.sendPresence!.channel).toStrictEqual({
      $ref: "#/channels/presenceStream",
    });
  });

  it("points operation messages into their own channel under the id key", async () => {
    const { asyncApiDoc: doc } = await compileAsyncAPI(source, splitOptions);

    expect(doc!.operations.publishUserSignedUp!.messages).toStrictEqual([
      { $ref: "#/channels/userEvents/messages/UserSignedUp" },
    ]);
    expect(doc!.operations.receiveUserSignedUp!.messages).toStrictEqual([
      { $ref: "#/channels/userEvents/messages/UserSignedUp" },
    ]);
    expect(doc!.operations.sendChat!.messages).toStrictEqual([
      { $ref: "#/channels/chatStream/messages/UserNotified" },
    ]);
    expect(doc!.operations.sendPresence!.messages).toStrictEqual([
      { $ref: "#/channels/presenceStream/messages/UserNotified" },
    ]);
    expect(doc!.channels.userEvents!.messages).toStrictEqual({
      UserSignedUp: { $ref: "#/components/messages/UserSignedUp" },
    });
    expect(doc!.channels.chatStream!.messages).toStrictEqual({
      UserNotified: { $ref: "#/components/messages/UserNotified" },
    });
  });

  it("rewrites schema refs to external files everywhere in the main document", async () => {
    const { asyncApiDoc: doc } = await compileAsyncAPI(source, splitOptions);

    const mainJson = JSON.stringify(doc);
    expect(mainJson).not.toContain("#/components/schemas/");
    expect(mainJson).toContain("schemas/UserSignedUp.json");
    expect(mainJson).toContain("schemas/UserNotified.json");

    expect(doc!.components!.messages!.UserSignedUp!.payload).toStrictEqual({
      $ref: "schemas/UserSignedUp.json",
    });
    expect(doc!.components!.messages!.UserNotified!.payload).toStrictEqual({
      $ref: "schemas/UserNotified.json",
    });
  });

  it("emits parseable schema files whose names match the rewritten refs", async () => {
    const { allOutputFiles } = await compileAsyncAPI(source, splitOptions);

    const signedUpFile = allOutputFiles.get("UserSignedUp.json");
    expect(signedUpFile).toBeDefined();
    const signedUp = JSON.parse(signedUpFile!);
    expect(signedUp.type).toBe("object");
    expect(signedUp.properties.userId.type).toBe("string");
    expect(signedUp.properties.email.type).toBe("string");

    const notifiedFile = allOutputFiles.get("UserNotified.json");
    expect(notifiedFile).toBeDefined();
    const notified = JSON.parse(notifiedFile!);
    expect(notified.type).toBe("object");
    expect(notified.properties.channel.type).toBe("string");
  });

  it("keeps the same ref chain for YAML output", async () => {
    const { asyncApiDoc: doc, allOutputFiles } = await compileAsyncAPI(source, {
      "split-schemas": true,
      "file-type": "yaml",
    } as AsyncAPIEmitterOptions);

    expect(doc!.operations.sendPresence!.channel).toStrictEqual({
      $ref: "#/channels/presenceStream",
    });
    expect(doc!.components!.messages!.UserNotified!.payload).toStrictEqual({
      $ref: "schemas/UserNotified.yaml",
    });
    expect(allOutputFiles.has("UserNotified.yaml")).toBe(true);
  });
});
