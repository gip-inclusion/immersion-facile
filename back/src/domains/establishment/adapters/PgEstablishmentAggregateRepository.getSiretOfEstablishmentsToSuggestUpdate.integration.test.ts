import { addDays } from "date-fns";
import subDays from "date-fns/subDays";
import { Pool } from "pg";
import { expectToEqual } from "shared";
import { KyselyDb, makeKyselyDb } from "../../../config/pg/kysely/kyselyUtils";
import { getTestPgPool } from "../../../config/pg/pgUtils";
import { PgNotificationRepository } from "../../core/notifications/adapters/PgNotificationRepository";
import { EstablishmentAggregateBuilder } from "../helpers/EstablishmentBuilders";
import { PgEstablishmentAggregateRepository } from "./PgEstablishmentAggregateRepository";

describe("PgScriptsQueries", () => {
  let pool: Pool;
  let db: KyselyDb;
  let pgEstablishmentAggregateRepository: PgEstablishmentAggregateRepository;
  let pgNotificationRepository: PgNotificationRepository;

  beforeAll(async () => {
    pool = getTestPgPool();
    db = makeKyselyDb(pool);
    pgNotificationRepository = new PgNotificationRepository(db);
    pgEstablishmentAggregateRepository = new PgEstablishmentAggregateRepository(
      db,
    );
  });

  beforeEach(async () => {
    await db.deleteFrom("establishments_contacts").execute();
    await db.deleteFrom("establishments_location_infos").execute();
    await db.deleteFrom("establishments_location_positions").execute();
    await db.deleteFrom("establishments").execute();
    await db.deleteFrom("outbox_failures").execute();
    await db.deleteFrom("outbox_publications").execute();
    await db.deleteFrom("outbox").execute();
    await db.deleteFrom("notifications_email_recipients").execute();
    await db.deleteFrom("notifications_email").execute();
  });

  afterAll(async () => {
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
          recentlyUpdatedEstablishment,
        ].map((aggregate) =>
          pgEstablishmentAggregateRepository.insertEstablishmentAggregate(
            aggregate,
          ),
        ),
      );

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
