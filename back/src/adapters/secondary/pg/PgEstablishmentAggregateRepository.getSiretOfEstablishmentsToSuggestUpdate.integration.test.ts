import { addDays } from "date-fns";
import subDays from "date-fns/subDays";
import { Pool, PoolClient } from "pg";
import { expectToEqual } from "shared";
import { EstablishmentAggregateBuilder } from "../../../_testBuilders/establishmentAggregate.test.helpers";
import { getTestPgPool } from "../../../_testBuilders/getTestPgPool";
import { makeKyselyDb } from "./sql/database";
import { PgEstablishmentAggregateRepository } from "./PgEstablishmentAggregateRepository";
import { PgNotificationRepository } from "./PgNotificationRepository";
import { PgOutboxRepository } from "./PgOutboxRepository";

describe("PgScriptsQueries", () => {
  let pool: Pool;
  let client: PoolClient;
  let pgEstablishmentAggregateRepository: PgEstablishmentAggregateRepository;
  let pgOutboxRepository: PgOutboxRepository;
  let pgNotificationRepository: PgNotificationRepository;

  beforeAll(async () => {
    pool = getTestPgPool();
    client = await pool.connect();
  });

  beforeEach(async () => {
    await client.query("DELETE FROM immersion_contacts");
    await client.query("DELETE FROM establishments");
    await client.query("DELETE FROM outbox_failures");
    await client.query("DELETE FROM outbox_publications");
    await client.query("DELETE FROM outbox");
    await client.query("DELETE FROM notifications_email_recipients");
    await client.query("DELETE FROM notifications_email");
    const db = makeKyselyDb(pool);
    pgOutboxRepository = new PgOutboxRepository(db);
    pgNotificationRepository = new PgNotificationRepository(db);
    pgEstablishmentAggregateRepository = new PgEstablishmentAggregateRepository(
      db,
    );
  });

  afterAll(async () => {
    client.release();
    await pool.end();
  });

  describe("getSiretOfEstablishmentsToSuggestUpdate", () => {
    it("gets only the establishment that before since and that have not received the suggest email recently", async () => {
      const before = new Date("2023-07-01");
      const toUpdateDate = subDays(before, 5);
      const establishmentToUpdate = new EstablishmentAggregateBuilder()
        .withEstablishmentSiret("11110000111100")
        .withEstablishmentUpdatedAt(toUpdateDate)
        .withContactId("11111111-1111-4000-1111-111111111111")
        .build();

      // <<<<<----------- this is the legacy behavior, we keep it until we reach the 6 months.
      // We can remove this part of the code, and the FormEstablishmentEditLinkSent events in january 2024

      const establishmentWithLinkSentEvent = new EstablishmentAggregateBuilder()
        .withEstablishmentSiret("22220000222200")
        .withEstablishmentUpdatedAt(toUpdateDate)
        .withContactId("22222222-2222-4000-2222-222222222222")
        .build();

      await pgOutboxRepository.save({
        id: "22222222-2222-4000-2222-000000000000",
        topic: "FormEstablishmentEditLinkSent",
        payload: {
          siret: establishmentWithLinkSentEvent.establishment.siret,
        } as any,
        occurredAt: addDays(before, 1).toISOString(),
        publications: [],
        wasQuarantined: false,
      });

      // end of legacy ----------->>>>>>

      const eventWithNotificationSavedButLongAgo =
        new EstablishmentAggregateBuilder()
          .withEstablishmentSiret("33330000333300")
          .withEstablishmentUpdatedAt(toUpdateDate)
          .withContactId("33333333-3333-4000-3333-333333333333")
          .build();

      await pgNotificationRepository.save({
        id: "33333333-3333-4000-3333-000000000000",
        followedIds: {
          establishmentSiret:
            eventWithNotificationSavedButLongAgo.establishment.siret,
        },
        kind: "email",
        templatedContent: {
          kind: "SUGGEST_EDIT_FORM_ESTABLISHMENT",
          recipients: ["joe@mail.com"],
          params: {
            editFrontUrl: "http://edit-front.com",
            businessAddress: "24 rue des boucher 67000 strasbourg",
            businessName: "SAS FRANCE MERGUEZ DISTRIBUTION",
          },
        },
        createdAt: subDays(before, 1).toISOString(),
      });

      const eventWithRecentNotificationSaved =
        new EstablishmentAggregateBuilder()
          .withEstablishmentSiret("44440000444400")
          .withEstablishmentUpdatedAt(toUpdateDate)
          .withContactId("44444444-4444-4000-4444-444444444444")
          .build();

      await pgNotificationRepository.save({
        id: "44444444-4444-4000-4444-000000000000",
        followedIds: {
          establishmentSiret:
            eventWithRecentNotificationSaved.establishment.siret,
        },
        kind: "email",
        templatedContent: {
          kind: "SUGGEST_EDIT_FORM_ESTABLISHMENT",
          recipients: ["jack@mail.com"],
          params: {
            editFrontUrl: "http://edit-jack-front.com",
            businessAddress: "24 rue des boucher 67000 strasbourg",
            businessName: "SAS FRANCE MERGUEZ DISTRIBUTION",
          },
        },
        createdAt: addDays(before, 1).toISOString(),
      });

      const recentlyUpdatedEstablishment = new EstablishmentAggregateBuilder()
        .withEstablishmentSiret("99990000999900")
        .withEstablishmentUpdatedAt(addDays(before, 1))
        .withContactId("99999999-9999-4000-9999-999999999999")
        .build();

      await pgEstablishmentAggregateRepository.insertEstablishmentAggregates([
        establishmentToUpdate,
        eventWithNotificationSavedButLongAgo,
        eventWithRecentNotificationSaved,
        establishmentWithLinkSentEvent,
        recentlyUpdatedEstablishment,
      ]);

      // Act
      const sirets =
        await pgEstablishmentAggregateRepository.getSiretOfEstablishmentsToSuggestUpdate(
          before,
        );

      // Assert
      expectToEqual(sirets, [
        establishmentToUpdate.establishment.siret,
        eventWithNotificationSavedButLongAgo.establishment.siret,
      ]);
    });
  });
});
