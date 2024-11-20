import { addDays } from "date-fns";
import subDays from "date-fns/subDays";
import { Pool } from "pg";
import { UserBuilder, expectToEqual } from "shared";
import { KyselyDb, makeKyselyDb } from "../../../config/pg/kysely/kyselyUtils";
import { getTestPgPool } from "../../../config/pg/pgUtils";
import { PgUserRepository } from "../../core/authentication/inclusion-connect/adapters/PgUserRepository";
import { PgNotificationRepository } from "../../core/notifications/adapters/PgNotificationRepository";
import { UuidV4Generator } from "../../core/uuid-generator/adapters/UuidGeneratorImplementations";
import { EstablishmentUserRight } from "../entities/EstablishmentEntity";
import { EstablishmentAggregateBuilder } from "../helpers/EstablishmentBuilders";
import { PgEstablishmentAggregateRepository } from "./PgEstablishmentAggregateRepository";

describe("PgScriptsQueries", () => {
  const user = new UserBuilder().withId(new UuidV4Generator().new()).build();
  const userRight: EstablishmentUserRight = {
    role: "establishment-admin",
    job: "osef",
    phone: "3615-OSEF",
    userId: user.id,
  };

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
    await db.deleteFrom("establishments__users").execute();
    await db.deleteFrom("establishments_location_infos").execute();
    await db.deleteFrom("establishments_location_positions").execute();
    await db.deleteFrom("establishments").execute();
    await db.deleteFrom("outbox_failures").execute();
    await db.deleteFrom("outbox_publications").execute();
    await db.deleteFrom("outbox").execute();
    await db.deleteFrom("notifications_email_recipients").execute();
    await db.deleteFrom("notifications_email").execute();
    await db.deleteFrom("users").execute();

    await new PgUserRepository(db).save(user, "proConnect");
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
        .withLocationId("aaaaaaaa-aaaa-4000-aaaa-aaaaaaaaaaaa")
        .withUserRights([userRight])
        .build();

      const establishmentWithNotificationSavedButLongAgo =
        new EstablishmentAggregateBuilder()
          .withEstablishmentSiret("33330000333300")
          .withEstablishmentUpdatedAt(toUpdateDate)
          .withUserRights([userRight])
          .build();

      await pgNotificationRepository.save({
        id: "33333333-3333-4000-3333-000000000000",
        followedIds: {
          establishmentSiret:
            establishmentWithNotificationSavedButLongAgo.establishment.siret,
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

      const establishmentWithRecentNotificationSaved =
        new EstablishmentAggregateBuilder()
          .withEstablishmentSiret("44440000444400")
          .withEstablishmentUpdatedAt(toUpdateDate)
          .withLocationId("aaaaaaaa-aaaa-4000-cccc-cccccccccccc")
          .withUserRights([userRight])
          .build();

      await pgNotificationRepository.save({
        id: "44444444-4444-4000-4444-000000000000",
        followedIds: {
          establishmentSiret:
            establishmentWithRecentNotificationSaved.establishment.siret,
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
        .withLocationId("aaaaaaaa-aaaa-4000-dddd-dddddddddddd")
        .withUserRights([userRight])
        .build();

      await Promise.all(
        [
          establishmentToUpdate,
          establishmentWithNotificationSavedButLongAgo,
          establishmentWithRecentNotificationSaved,
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
        establishmentWithNotificationSavedButLongAgo.establishment.siret,
      ]);
    });
  });
});
