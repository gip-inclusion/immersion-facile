import type { Pool } from "pg";
import {
  type AgencyDto,
  AgencyDtoBuilder,
  type AgencyWithUsersRights,
  type ApiConsumer,
  type ApiConsumerContact,
  type ConventionDto,
  ConventionDtoBuilder,
  DiscussionBuilder,
  type DiscussionDto,
  defaultPhoneNumber,
  type ExtractFromExisting,
  expectArraysToEqualIgnoringOrder,
  Notification,
  type PhoneNumber,
} from "shared";
import {
  type KyselyDb,
  makeKyselyDb,
} from "../../../../config/pg/kysely/kyselyUtils";
import type { Database } from "../../../../config/pg/kysely/model/database";
import { makeTestPgPool } from "../../../../config/pg/pgPool";
import { toAgencyWithRights } from "../../../../utils/agency";
import { PgAgencyRepository } from "../../../agency/adapters/PgAgencyRepository";
import { PgConventionRepository } from "../../../convention/adapters/PgConventionRepository";
import { PgDiscussionRepository } from "../../../establishment/adapters/PgDiscussionRepository";
import { PgEstablishmentAggregateRepository } from "../../../establishment/adapters/PgEstablishmentAggregateRepository";
import type {
  EstablishmentAggregate,
  EstablishmentUserRight,
} from "../../../establishment/entities/EstablishmentAggregate";
import {
  EstablishmentAggregateBuilder,
  EstablishmentEntityBuilder,
} from "../../../establishment/helpers/EstablishmentBuilders";
import { ApiConsumerBuilder } from "../../api-consumer/adapters/InMemoryApiConsumerRepository";
import { PgApiConsumerRepository } from "../../api-consumer/adapters/PgApiConsumerRepository";
import { PgNotificationRepository } from "../../notifications/adapters/PgNotificationRepository";
import { CustomTimeGateway } from "../../time-gateway/adapters/CustomTimeGateway";
import type { TimeGateway } from "../../time-gateway/ports/TimeGateway";
import { createPgUow } from "../../unit-of-work/adapters/createPgUow";
import { PgUowPerformer } from "../../unit-of-work/adapters/PgUowPerformer";
import { UuidV4Generator } from "../../uuid-generator/adapters/UuidGeneratorImplementations";
import { getPhoneNumbers } from "../adapters/pgPhoneHelper";
import { insertPhoneNumber } from "../adapters/pgPhoneTestFileHelper";
import {
  makeUpdateInvalidPhone,
  type UpdateInvalidPhone,
} from "./UpdateInvalidPhone";
import type { PhoneInDB } from "./VerifyAndRequestInvalidPhonesUpdate";

type TablesWithPhoneReference = ExtractFromExisting<
  keyof Database,
  | "discussions"
  | "agencies"
  | "actors"
  | "api_consumers"
  | "establishments__users"
  | "notifications_sms"
>;

describe("UpdateInvalidPhone", () => {
  let pool: Pool;
  let kyselyDb: KyselyDb;
  let uowPerformer: PgUowPerformer;
  let timeGateway: TimeGateway;
  let now: Date;
  let uuidGenerator: UuidV4Generator;

  let pgConventionRepository: PgConventionRepository;
  let pgApiConsumerRepository: PgApiConsumerRepository;
  let pgAgencyRepository: PgAgencyRepository;
  let pgDiscussionRepository: PgDiscussionRepository;
  let pgEstablishmentAggregateRepository: PgEstablishmentAggregateRepository;
  let pgNotificationsSms: PgNotificationRepository;

  const correctPhoneNumber: PhoneNumber = "+33555689727";
  const fixablePhoneNumber: PhoneNumber = "+32784423078";
  const fixedPhoneNumber: PhoneNumber = "+33784423078";
  const unfixablePhoneNumber: PhoneNumber = "+33728661119";

  let updateInvalidPhone: UpdateInvalidPhone;

  beforeAll(async () => {
    pool = makeTestPgPool();
    kyselyDb = makeKyselyDb(pool);
    uowPerformer = new PgUowPerformer(kyselyDb, createPgUow);

    pgConventionRepository = new PgConventionRepository(kyselyDb);
    pgApiConsumerRepository = new PgApiConsumerRepository(kyselyDb);
    pgAgencyRepository = new PgAgencyRepository(kyselyDb);
    pgDiscussionRepository = new PgDiscussionRepository(kyselyDb);
    pgEstablishmentAggregateRepository = new PgEstablishmentAggregateRepository(
      kyselyDb,
    );
    pgNotificationsSms = new PgNotificationRepository(kyselyDb);
  });

  afterAll(async () => {
    await pool.end();
  });

  beforeEach(async () => {
    timeGateway = new CustomTimeGateway();
    now = timeGateway.now();
    uuidGenerator = new UuidV4Generator();
    updateInvalidPhone = makeUpdateInvalidPhone({
      deps: { timeGateway, kyselyDb },
      uowPerformer,
    });

    await kyselyDb.deleteFrom("outbox_failures").execute();
    await kyselyDb.deleteFrom("outbox_publications").execute();
    await kyselyDb.deleteFrom("outbox").execute();
    await kyselyDb.deleteFrom("discussions").execute();
    await kyselyDb.deleteFrom("convention_drafts").execute();
    await kyselyDb.deleteFrom("convention_templates").execute();
    await kyselyDb.deleteFrom("conventions").execute();
    await kyselyDb.deleteFrom("agencies").execute();
    await kyselyDb.deleteFrom("actors").execute();
    await kyselyDb.deleteFrom("api_consumers").execute();
    await kyselyDb.deleteFrom("establishments__users").execute();
    await kyselyDb.deleteFrom("phone_numbers").execute();
  });

  const createPhoneReferences = async (
    phoneNumber: PhoneNumber,
    referencesToCreate: TablesWithPhoneReference[] = [
      "actors",
      "agencies",
      "api_consumers",
      "discussions",
      "establishments__users",
    ],
  ) => {
    if (referencesToCreate.includes("agencies")) {
      const agency: AgencyDto = new AgencyDtoBuilder()
        .withId(uuidGenerator.new())
        .withAgencySiret("11110000111100")
        .withPhoneNumber(phoneNumber)
        .build();

      const agencyWithPhoneNumber: AgencyWithUsersRights = toAgencyWithRights(
        agency,
        {
          [uuidGenerator.new()]: {
            isNotifiedByEmail: false,
            roles: ["validator"],
          },
        },
      );
      await pgAgencyRepository.insert(agencyWithPhoneNumber);
    }

    if (referencesToCreate.includes("actors")) {
      const conventionWithPhoneNumber: ConventionDto =
        new ConventionDtoBuilder()
          .withId(uuidGenerator.new())
          .withBeneficiary({
            birthdate: new Date("2000-05-26").toDateString(),
            firstName: "Nolwenn",
            lastName: "Le Bihan",
            role: "beneficiary",
            email: "lebihan@breizh.com",
            phone: phoneNumber,
          })
          .build();
      await pgConventionRepository.save(conventionWithPhoneNumber);
    }

    if (referencesToCreate.includes("api_consumers")) {
      const apiConsumerWithPhoneNumber: ApiConsumer = new ApiConsumerBuilder()
        .withId(uuidGenerator.new())
        .withContact({
          emails: ["abc@abc.com"],
          firstName: "Erwan",
          lastName: "Leguidec",
          phone: phoneNumber,
          job: "Crêpier",
        })
        .build();
      await pgApiConsumerRepository.save(apiConsumerWithPhoneNumber);
    }

    if (referencesToCreate.includes("discussions")) {
      const discussionWithPhoneNumber: DiscussionDto = new DiscussionBuilder()
        .withId(uuidGenerator.new())
        .withPotentialBeneficiaryPhone(phoneNumber)
        .build();
      await pgDiscussionRepository.insert(discussionWithPhoneNumber);
    }

    if (referencesToCreate.includes("establishments__users")) {
      const establishmentUserRight: EstablishmentUserRight = {
        role: "establishment-contact",
        shouldReceiveDiscussionNotifications: false,
        userId: uuidGenerator.new(),
        phone: phoneNumber,
      };

      const establishmentAggregate: EstablishmentAggregate =
        new EstablishmentAggregateBuilder()
          .withUserRights([establishmentUserRight])
          .build();

      await pgEstablishmentAggregateRepository.insertEstablishmentAggregate(
        establishmentAggregate,
      );
    }
  };

  describe("Right path", () => {
    describe("Non conflicting phone number", () => {
      it("updates a non conflicting phone number", async () => {
        await createPhoneReferences(fixablePhoneNumber);

        const fixablePhoneId: number = await insertPhoneNumber(kyselyDb, {
          phoneNumber: fixablePhoneNumber,
        });
        const fixablePhone: PhoneInDB = {
          id: fixablePhoneId,
          phoneNumber: fixablePhoneNumber,
          verifiedAt: null,
        };
        const fixedPhone: PhoneInDB = {
          id: fixablePhoneId,
          phoneNumber: fixedPhoneNumber,
          verifiedAt: now,
        };

        await updateInvalidPhone.execute({
          phoneToUpdate: {
            currentPhone: fixablePhone,
            newPhoneNumber: fixedPhone.phoneNumber,
          },
        });

        expectArraysToEqualIgnoringOrder(await getPhoneNumbers(kyselyDb), [
          fixedPhone,
        ]);
      });
    });
    describe("Conflicting phone number", () => {
      it("updates multiple references the same table", () => {});
      it("updates all references on multiple tables", () => {});
      it("does nothing if a conflicting phone number is not referenced on any tables", () => {});
    });
  });

  describe("Wrong path", () => {
    it("throws if kysely not defined", async () => {
      updateInvalidPhone = makeUpdateInvalidPhone({
        uowPerformer,
        deps: { timeGateway, kyselyDb: null },
      });

      await expect(
        updateInvalidPhone.execute({
          phoneToUpdate: {
            currentPhone: {
              id: 1,
              phoneNumber: defaultPhoneNumber,
              verifiedAt: null,
            },
            newPhoneNumber: defaultPhoneNumber,
          },
        }),
      ).rejects.toThrow();
    });

    it("throws if newPhoneNumber has invalid format", async () => {
      await expect(
        updateInvalidPhone.execute({
          phoneToUpdate: {
            currentPhone: {
              id: 1,
              phoneNumber: defaultPhoneNumber,
              verifiedAt: null,
            },
            newPhoneNumber: "not-a-phone" as PhoneNumber,
          },
        }),
      ).rejects.toThrow();
    });

    it("does nothing if currentPhone.id does not exist in DB and newPhoneNumber is not conflicting", async () => {
      const notExistingId = 9999;

      const currentPhone: PhoneInDB = {
        id: notExistingId,
        phoneNumber: defaultPhoneNumber,
        verifiedAt: null,
      };

      await updateInvalidPhone.execute({
        phoneToUpdate: { currentPhone, newPhoneNumber: correctPhoneNumber },
      });

      expectArraysToEqualIgnoringOrder(await getPhoneNumbers(kyselyDb), []);
    });

    it("does nothing if currentPhone.id does not exist in DB and currentPhone.phoneNumber is conflicting", async () => {
      const defaultPhoneId: number = await insertPhoneNumber(kyselyDb, {
        phoneNumber: defaultPhoneNumber,
      });
      const defaultPhone: PhoneInDB = {
        id: defaultPhoneId,
        phoneNumber: defaultPhoneNumber,
        verifiedAt: null,
      };

      expectArraysToEqualIgnoringOrder(await getPhoneNumbers(kyselyDb), [
        defaultPhone,
      ]);

      const notExistingId = 9999;
      const conflictingDefaultPhoneNumberWithNonExistingId: PhoneInDB = {
        id: notExistingId,
        phoneNumber: defaultPhone.phoneNumber,
        verifiedAt: null,
      };

      await updateInvalidPhone.execute({
        phoneToUpdate: {
          currentPhone: conflictingDefaultPhoneNumberWithNonExistingId,
          newPhoneNumber: correctPhoneNumber,
        },
      });

      expectArraysToEqualIgnoringOrder(await getPhoneNumbers(kyselyDb), [
        defaultPhone,
      ]);
    });

    it("does nothing if newPhoneNumber is identical to currentPhone", async () => {
      const fixedPhoneId: number = await insertPhoneNumber(kyselyDb, {
        phoneNumber: fixedPhoneNumber,
      });
      const currentFixedPhone: PhoneInDB = {
        id: fixedPhoneId,
        phoneNumber: fixedPhoneNumber,
        verifiedAt: null,
      };

      await updateInvalidPhone.execute({
        phoneToUpdate: {
          currentPhone: currentFixedPhone,
          newPhoneNumber: currentFixedPhone.phoneNumber,
        },
      });
      expectArraysToEqualIgnoringOrder(await getPhoneNumbers(kyselyDb), [
        currentFixedPhone,
      ]);
    });
  });
});
