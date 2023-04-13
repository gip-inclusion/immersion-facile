import { Pool, PoolClient } from "pg";

import { getTestPgPool } from "../../../_testBuilders/getTestPgPool";
import { makeCreateNewEvent } from "../../../domain/core/eventBus/EventBus";
import { DomainEvent, DomainTopic } from "../../../domain/core/eventBus/events";
import { CustomTimeGateway } from "../core/TimeGateway/CustomTimeGateway";
import { TestUuidGenerator } from "../core/UuidGeneratorImplementations";

import { PgOutboxQueries } from "./PgOutboxQueries";
import { PgOutboxRepository } from "./PgOutboxRepository";

describe("PgOutboxQueries for form establishments", () => {
  let pool: Pool;
  let client: PoolClient;
  let outboxQueries: PgOutboxQueries;
  const uuidGenerator = new TestUuidGenerator();
  const timeGateway = new CustomTimeGateway();
  const quarantinedTopic: DomainTopic = "ImmersionApplicationRejected";

  const createNewEvent = makeCreateNewEvent({
    uuidGenerator,
    timeGateway,
    quarantinedTopics: [quarantinedTopic],
  });

  beforeAll(async () => {
    pool = getTestPgPool();
    client = await pool.connect();
  });

  afterAll(async () => {
    client.release();
    await pool.end();
  });

  beforeEach(async () => {
    await client.query("DELETE FROM outbox_failures");
    await client.query("DELETE FROM outbox_publications");
    await client.query("DELETE FROM outbox");

    outboxQueries = new PgOutboxQueries(client);
  });

  describe("Pg implementation of method getLastDateOfFormEstablishmentEditLinkSentWithSiret", () => {
    const siret = "12345678901234";
    it("Returns undefined if there is no previous event FormEstablishmentEditLinkSent with given siret in payload", async () => {
      // Act
      const actualLastDate =
        await outboxQueries.getLastPayloadOfFormEstablishmentEditLinkSentWithSiret(
          siret,
        );
      // Assert
      expect(actualLastDate).toBeUndefined();
    });
    it("Returns the last previous event FormEstablishmentEditLinkSent with given siret in payload", async () => {
      // Prepare
      timeGateway.setNextDate(new Date("2020-01-01"));
      uuidGenerator.setNextUuid("dddddd99-9d0d-dddd-dd6d-6dd9dd38dddd");
      const eventWithSiret_01jan20 = createNewEvent({
        topic: "FormEstablishmentEditLinkSent",
        payload: {
          siret,
          iat: new Date("2020-01-01").getTime(),
          exp: new Date("2020-01-02").getTime(),
          version: 1,
        },
      });

      timeGateway.setNextDate(new Date("2020-01-05"));
      uuidGenerator.setNextUuid("eeeeee99-9d0d-dddd-dd6d-6dd9dd38dddd");

      const eventWithSiret_05jan20 = createNewEvent({
        topic: "FormEstablishmentEditLinkSent",
        payload: {
          siret,
          iat: new Date("2020-01-05").getTime(),
          exp: new Date("2020-01-06").getTime(),
          version: 1,
        },
      });

      uuidGenerator.setNextUuid("ffffff99-9d0d-dddd-dd6d-6dd9dd38dddd");
      const eventWithOtherSiret_05jan20 = createNewEvent({
        topic: "FormEstablishmentEditLinkSent",
        payload: {
          siret: "11111111111111",
          iat: new Date("2020-01-05").getTime(),
          exp: new Date("2020-01-06").getTime(),
          version: 1,
        },
      });
      await storeInOutbox([
        eventWithSiret_01jan20,
        eventWithSiret_05jan20,
        eventWithOtherSiret_05jan20,
      ]);

      // Act
      const actualLastPayload =
        await outboxQueries.getLastPayloadOfFormEstablishmentEditLinkSentWithSiret(
          siret,
        );
      // Assert
      expect(actualLastPayload).toEqual(eventWithSiret_05jan20.payload);
    });
  });

  const storeInOutbox = async (events: DomainEvent[]) => {
    await Promise.all(
      events.map((event) => new PgOutboxRepository(client).save(event)),
    );
  };
});
