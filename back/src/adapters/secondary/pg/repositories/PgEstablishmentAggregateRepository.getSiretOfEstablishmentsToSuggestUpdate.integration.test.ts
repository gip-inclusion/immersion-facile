import { addDays } from "date-fns";
import subDays from "date-fns/subDays";
import { Pool, PoolClient } from "pg";
import { expectToEqual } from "shared";
import { EstablishmentAggregateBuilder } from "../../offer/EstablishmentBuilders";
import { KyselyDb, makeKyselyDb } from "../kysely/kyselyUtils";
import { getTestPgPool } from "../pgUtils";
import { PgEstablishmentAggregateRepository } from "./PgEstablishmentAggregateRepository";
import { PgNotificationRepository } from "./PgNotificationRepository";
import { PgOutboxRepository } from "./PgOutboxRepository";

describe("PgScriptsQueries", () => {
  let pool: Pool;
  let client: PoolClient;
  let transaction: KyselyDb;
  let pgEstablishmentAggregateRepository: PgEstablishmentAggregateRepository;
  let pgOutboxRepository: PgOutboxRepository;
  let pgNotificationRepository: PgNotificationRepository;

  beforeAll(async () => {
    pool = getTestPgPool();
    client = await pool.connect();
    transaction = makeKyselyDb(pool);
  });

  beforeEach(async () => {
    await client.query("DELETE FROM immersion_contacts");
    await client.query("DELETE FROM establishments_locations");
    await client.query("DELETE FROM establishments");
    await client.query("DELETE FROM outbox_failures");
    await client.query("DELETE FROM outbox_publications");
    await client.query("DELETE FROM outbox");
    await client.query("DELETE FROM notifications_email_recipients");
    await client.query("DELETE FROM notifications_email");
    pgOutboxRepository = new PgOutboxRepository(transaction);
    pgNotificationRepository = new PgNotificationRepository(transaction);
    pgEstablishmentAggregateRepository = new PgEstablishmentAggregateRepository(
      transaction,
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
        .withLocationId("aaaaaaaa-aaaa-4000-aaaa-aaaaaaaaaaaa")
        .build();

      // <<<<<----------- this is the legacy behavior, we keep it until we reach the 6 months.
      // We can remove this part of the code, and the FormEstablishmentEditLinkSent events in january 2024

      const establishmentWithLinkSentEvent = new EstablishmentAggregateBuilder()
        .withEstablishmentSiret("22220000222200")
        .withEstablishmentUpdatedAt(toUpdateDate)
        .withContactId("22222222-2222-4000-2222-222222222222")
        .withLocationId("aaaaaaaa-aaaa-4000-bbbb-bbbbbbbbbbbb")
        .build();

      await pgOutboxRepository.save({
        id: "22222222-2222-4000-2222-000000000000",
        topic: "FormEstablishmentEditLinkSent",
        payload: {
          siret: establishmentWithLinkSentEvent.establishment.siret,
          version: 1,
        },
        occurredAt: addDays(before, 1).toISOString(),
        publications: [],
        status: "never-published",
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
            businessAddresses: ["24 rue des boucher 67000 strasbourg"],
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
          .withLocationId("aaaaaaaa-aaaa-4000-cccc-cccccccccccc")
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
            businessAddresses: ["24 rue des boucher 67000 strasbourg"],
            businessName: "SAS FRANCE MERGUEZ DISTRIBUTION",
          },
        },
        createdAt: addDays(before, 1).toISOString(),
      });

      const recentlyUpdatedEstablishment = new EstablishmentAggregateBuilder()
        .withEstablishmentSiret("99990000999900")
        .withEstablishmentUpdatedAt(addDays(before, 1))
        .withContactId("99999999-9999-4000-9999-999999999999")
        .withLocationId("aaaaaaaa-aaaa-4000-dddd-dddddddddddd")
        .build();

      await Promise.all(
        [
          establishmentToUpdate,
          eventWithNotificationSavedButLongAgo,
          eventWithRecentNotificationSaved,
          establishmentWithLinkSentEvent,
          recentlyUpdatedEstablishment,
        ].map((aggregate) =>
          pgEstablishmentAggregateRepository.insertEstablishmentAggregate(
            aggregate,
          ),
        ),
      );

      console.log("PRepared data");

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
