import type { Pool } from "pg";
import {
  type AgencyDto,
  AgencyDtoBuilder,
  type AgencyId,
  type AgencyWithUsersRights,
  type ApiConsumer,
  type ApiConsumerId,
  ConnectedUserBuilder,
  type ConventionDto,
  ConventionDtoBuilder,
  type ConventionId,
  DiscussionBuilder,
  type DiscussionDto,
  type DiscussionId,
  defaultPhoneNumber,
  type ExtractFromExisting,
  expectArraysToEqualIgnoringOrder,
  expectToEqual,
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
import { EstablishmentAggregateBuilder } from "../../../establishment/helpers/EstablishmentBuilders";
import { ApiConsumerBuilder } from "../../api-consumer/adapters/InMemoryApiConsumerRepository";
import { PgApiConsumerRepository } from "../../api-consumer/adapters/PgApiConsumerRepository";
import { PgUserRepository } from "../../authentication/connected-user/adapters/PgUserRepository";
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

type RepoTablesWithPhoneReference = ExtractFromExisting<
  keyof Database,
  | "discussions"
  | "agencies"
  | "api_consumers"
  | "establishments__users"
  | "conventions"
>;

describe("UpdateInvalidPhone", () => {
  let pool: Pool;
  let kyselyDb: KyselyDb;
  let uowPerformer: PgUowPerformer;
  let timeGateway: TimeGateway;
  let now: Date;
  let uuidGenerator: UuidV4Generator;

  let pgUserRepository: PgUserRepository;

  let pgConventionRepository: PgConventionRepository;
  let pgApiConsumerRepository: PgApiConsumerRepository;
  let pgAgencyRepository: PgAgencyRepository;
  let pgDiscussionRepository: PgDiscussionRepository;
  let pgEstablishmentAggregateRepository: PgEstablishmentAggregateRepository;

  const correctPhoneNumber: PhoneNumber = "+33555689727";
  const fixablePhoneNumber: PhoneNumber = "+32784423078";
  const fixedPhoneNumber: PhoneNumber = "+33784423078";

  const agencyId: AgencyId = "550e8400-e29b-41d4-a716-446655440001";
  const conventionId: ConventionId = "550e8400-e29b-41d4-a716-446655440002";
  const apiConsumerId: ApiConsumerId = "550e8400-e29b-41d4-a716-446655440003";
  const discussionId: DiscussionId = "550e8400-e29b-41d4-a716-446655440004";
  const establishmentUserId = "550e8400-e29b-41d4-a716-446655440005";

  let updateInvalidPhone: UpdateInvalidPhone;

  beforeAll(async () => {
    pool = makeTestPgPool();
    kyselyDb = makeKyselyDb(pool);
    uowPerformer = new PgUowPerformer(kyselyDb, createPgUow);

    pgUserRepository = new PgUserRepository(kyselyDb);

    pgConventionRepository = new PgConventionRepository(kyselyDb);
    pgApiConsumerRepository = new PgApiConsumerRepository(kyselyDb);
    pgAgencyRepository = new PgAgencyRepository(kyselyDb);
    pgDiscussionRepository = new PgDiscussionRepository(kyselyDb);
    pgEstablishmentAggregateRepository = new PgEstablishmentAggregateRepository(
      kyselyDb,
    );
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

    await kyselyDb.deleteFrom("users").execute();
    await kyselyDb.deleteFrom("users__agencies").execute();
    await kyselyDb.deleteFrom("users_admins").execute();
    await kyselyDb.deleteFrom("establishments").execute();
    await kyselyDb.deleteFrom("marketing_establishment_contacts").execute();
    await kyselyDb.deleteFrom("establishments_deleted").execute();
    await kyselyDb.deleteFrom("establishments__users").execute();
    await kyselyDb.deleteFrom("establishment_lead_events").execute();
    await kyselyDb.deleteFrom("establishments_location_positions").execute();
    await kyselyDb.deleteFrom("establishments_location_infos").execute();
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

  const createPhoneReferencesOnAllTables = async (
    phoneNumber: PhoneNumber,
  ): Promise<void> => {
    const validator = new ConnectedUserBuilder()
      .withId(uuidGenerator.new())
      .withEmail("validator1@agency1.fr")
      .buildUser();
    const agency: AgencyDto = new AgencyDtoBuilder()
      .withId(agencyId)
      .withAgencySiret("11110000111100")
      .withPhoneNumber(phoneNumber)
      .build();

    const conventionWithPhoneNumber: ConventionDto = new ConventionDtoBuilder()
      .withId(conventionId)
      .withAgencyId(agency.id)
      .withBeneficiary({
        birthdate: new Date("2000-05-26").toISOString(),
        firstName: "Nolwenn",
        lastName: "Le Bihan",
        role: "beneficiary",
        email: "lebihan@breizh.com",
        phone: phoneNumber,
      })
      .withEstablishmentTutorPhone(phoneNumber)
      .withEstablishmentRepresentativePhone(phoneNumber)
      .build();

    const apiConsumerWithPhoneNumber: ApiConsumer = new ApiConsumerBuilder()
      .withId(apiConsumerId)
      .withContact({
        emails: ["abc@abc.com"],
        firstName: "Erwan",
        lastName: "Leguidec",
        phone: phoneNumber,
        job: "Crêpier",
      })
      .build();

    const discussionWithPhoneNumber: DiscussionDto = new DiscussionBuilder()
      .withId(discussionId)
      .withPotentialBeneficiaryPhone(phoneNumber)
      .build();

    const establishmentUser = new ConnectedUserBuilder()
      .withId(establishmentUserId)
      .withEmail("bob@lebricoleur.com")
      .buildUser();
    const establishmentUserRight: EstablishmentUserRight = {
      role: "establishment-contact",
      shouldReceiveDiscussionNotifications: false,
      userId: establishmentUser.id,
      phone: phoneNumber,
    };
    const establishmentAggregate: EstablishmentAggregate =
      new EstablishmentAggregateBuilder()
        .withUserRights([establishmentUserRight])
        .build();

    await pgUserRepository.save(validator);
    const agencyWithPhoneNumber: AgencyWithUsersRights = toAgencyWithRights(
      agency,
      {
        [validator.id]: {
          isNotifiedByEmail: false,
          roles: ["validator"],
        },
      },
    );
    await pgAgencyRepository.insert(agencyWithPhoneNumber);

    await pgConventionRepository.save(conventionWithPhoneNumber);

    await pgApiConsumerRepository.save(apiConsumerWithPhoneNumber);

    await pgDiscussionRepository.insert(discussionWithPhoneNumber);

    await pgUserRepository.save(establishmentUser);
    await pgEstablishmentAggregateRepository.insertEstablishmentAggregate(
      establishmentAggregate,
    );
  };

  const expectPhoneReferenceInObjectToMatch = async (
    {
      repoTableName,
      objectId,
    }: {
      repoTableName: RepoTablesWithPhoneReference;
      objectId: string;
    },
    newReferencedPhoneNumber: string,
  ) => {
    if (repoTableName === "agencies") {
      expectToEqual(
        (await pgAgencyRepository.getById(objectId))?.phoneNumber,
        newReferencedPhoneNumber,
      );
    }

    if (repoTableName === "api_consumers") {
      expectToEqual(
        (await pgApiConsumerRepository.getById(objectId))?.contact.phone,
        newReferencedPhoneNumber,
      );
    }

    if (repoTableName === "conventions") {
      const convention = await pgConventionRepository.getById(objectId);
      expectToEqual(
        convention?.signatories.beneficiary.phone,
        newReferencedPhoneNumber,
      );
      expectToEqual(
        convention?.signatories.establishmentRepresentative?.phone,
        newReferencedPhoneNumber,
      );
      expectToEqual(
        convention?.establishmentTutor.phone,
        newReferencedPhoneNumber,
      );
    }

    if (repoTableName === "discussions") {
      expectToEqual(
        (await pgDiscussionRepository.getById(objectId))?.potentialBeneficiary
          .phone,
        newReferencedPhoneNumber,
      );
    }

    if (repoTableName === "establishments__users") {
      const establishmentAggregatesWithUser: EstablishmentAggregate[] =
        await pgEstablishmentAggregateRepository.getEstablishmentAggregatesByFilters(
          { userId: establishmentUserId },
        );

      const userRightsPhones = establishmentAggregatesWithUser
        .flatMap((aggregate) => aggregate.userRights)
        .filter((userRight) => userRight.userId === establishmentUserId)
        .map((userRight) => userRight.phone);

      userRightsPhones.map((phone) =>
        expectToEqual(phone, newReferencedPhoneNumber),
      );
    }
  };

  describe("Right path", () => {
    describe("Non conflicting phone number", () => {
      it("updates a non conflicting phone number", async () => {
        const fixablePhoneId = await insertPhoneNumber(kyselyDb, {
          phoneNumber: fixablePhoneNumber,
        });

        await createPhoneReferencesOnAllTables(fixablePhoneNumber);

        const fixablePhone: PhoneInDB = {
          id: fixablePhoneId,
          phoneNumber: fixablePhoneNumber,
          verifiedAt: null,
        };

        await updateInvalidPhone.execute({
          phoneToUpdate: {
            currentPhone: fixablePhone,
            newPhoneNumber: fixedPhoneNumber,
          },
        });

        const fixedPhone: PhoneInDB = {
          id: fixablePhoneId,
          phoneNumber: fixedPhoneNumber,
          verifiedAt: now,
        };

        expectArraysToEqualIgnoringOrder(await getPhoneNumbers(kyselyDb), [
          fixedPhone,
        ]);

        await expectPhoneReferenceInObjectToMatch(
          { objectId: agencyId, repoTableName: "agencies" },
          fixedPhone.phoneNumber,
        );
        await expectPhoneReferenceInObjectToMatch(
          { objectId: apiConsumerId, repoTableName: "api_consumers" },
          fixedPhone.phoneNumber,
        );
        await expectPhoneReferenceInObjectToMatch(
          { objectId: conventionId, repoTableName: "conventions" },
          fixedPhone.phoneNumber,
        );
        await expectPhoneReferenceInObjectToMatch(
          { objectId: discussionId, repoTableName: "discussions" },
          fixedPhone.phoneNumber,
        );
        await expectPhoneReferenceInObjectToMatch(
          {
            objectId: establishmentUserId,
            repoTableName: "establishments__users",
          },
          fixedPhone.phoneNumber,
        );
      });
    });
    describe("Conflicting phone number", () => {
      it("updates multiple references on the same table", async () => {
        const fixedPhoneId = await insertPhoneNumber(kyselyDb, {
          phoneNumber: fixedPhoneNumber,
          verifiedAt: now,
        });
        const fixablePhoneId = await insertPhoneNumber(kyselyDb, {
          phoneNumber: fixablePhoneNumber,
        });

        const discussionWithPhoneNumber: DiscussionDto = new DiscussionBuilder()
          .withId(discussionId)
          .withPotentialBeneficiaryPhone(fixablePhoneNumber)
          .build();
        const discussionId2 = uuidGenerator.new();
        const discussion2WithPhoneNumber: DiscussionDto =
          new DiscussionBuilder()
            .withId(discussionId2)
            .withPotentialBeneficiaryPhone(fixablePhoneNumber)
            .build();

        await pgDiscussionRepository.insert(discussionWithPhoneNumber);
        await pgDiscussionRepository.insert(discussion2WithPhoneNumber);

        const fixablePhone: PhoneInDB = {
          id: fixablePhoneId,
          phoneNumber: fixablePhoneNumber,
          verifiedAt: null,
        };
        const fixedPhone: PhoneInDB = {
          id: fixedPhoneId,
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
          fixablePhone,
        ]);

        await expectPhoneReferenceInObjectToMatch(
          { objectId: discussionId, repoTableName: "discussions" },
          fixedPhone.phoneNumber,
        );
        await expectPhoneReferenceInObjectToMatch(
          { objectId: discussionId2, repoTableName: "discussions" },
          fixedPhone.phoneNumber,
        );
      });
      it("updates all references on multiple tables", async () => {
        const fixedPhoneId = await insertPhoneNumber(kyselyDb, {
          phoneNumber: fixedPhoneNumber,
          verifiedAt: now,
        });
        const fixablePhoneId = await insertPhoneNumber(kyselyDb, {
          phoneNumber: fixablePhoneNumber,
        });

        await createPhoneReferencesOnAllTables(fixablePhoneNumber);

        const fixablePhone: PhoneInDB = {
          id: fixablePhoneId,
          phoneNumber: fixablePhoneNumber,
          verifiedAt: null,
        };
        const fixedPhone: PhoneInDB = {
          id: fixedPhoneId,
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
          fixablePhone,
        ]);

        await expectPhoneReferenceInObjectToMatch(
          { objectId: agencyId, repoTableName: "agencies" },
          fixedPhone.phoneNumber,
        );
        await expectPhoneReferenceInObjectToMatch(
          { objectId: apiConsumerId, repoTableName: "api_consumers" },
          fixedPhone.phoneNumber,
        );
        await expectPhoneReferenceInObjectToMatch(
          { objectId: conventionId, repoTableName: "conventions" },
          fixedPhone.phoneNumber,
        );
        await expectPhoneReferenceInObjectToMatch(
          { objectId: discussionId, repoTableName: "discussions" },
          fixedPhone.phoneNumber,
        );
        await expectPhoneReferenceInObjectToMatch(
          {
            objectId: establishmentUserId,
            repoTableName: "establishments__users",
          },
          fixedPhone.phoneNumber,
        );
      });
      it("does nothing if a conflicting phone number is not referenced on any tables", async () => {
        const fixedPhoneId = await insertPhoneNumber(kyselyDb, {
          phoneNumber: fixedPhoneNumber,
          verifiedAt: now,
        });
        const fixablePhoneId = await insertPhoneNumber(kyselyDb, {
          phoneNumber: fixablePhoneNumber,
        });

        await createPhoneReferencesOnAllTables(fixedPhoneNumber);

        const fixablePhone: PhoneInDB = {
          id: fixablePhoneId,
          phoneNumber: fixablePhoneNumber,
          verifiedAt: null,
        };

        await updateInvalidPhone.execute({
          phoneToUpdate: {
            currentPhone: fixablePhone,
            newPhoneNumber: fixedPhoneNumber,
          },
        });

        const fixedPhone: PhoneInDB = {
          id: fixedPhoneId,
          phoneNumber: fixedPhoneNumber,
          verifiedAt: now,
        };

        expectArraysToEqualIgnoringOrder(await getPhoneNumbers(kyselyDb), [
          fixedPhone,
          fixablePhone,
        ]);

        await expectPhoneReferenceInObjectToMatch(
          { objectId: agencyId, repoTableName: "agencies" },
          fixedPhone.phoneNumber,
        );
        await expectPhoneReferenceInObjectToMatch(
          { objectId: apiConsumerId, repoTableName: "api_consumers" },
          fixedPhone.phoneNumber,
        );
        await expectPhoneReferenceInObjectToMatch(
          { objectId: conventionId, repoTableName: "conventions" },
          fixedPhone.phoneNumber,
        );
        await expectPhoneReferenceInObjectToMatch(
          { objectId: discussionId, repoTableName: "discussions" },
          fixedPhone.phoneNumber,
        );
        await expectPhoneReferenceInObjectToMatch(
          {
            objectId: establishmentUserId,
            repoTableName: "establishments__users",
          },
          fixedPhone.phoneNumber,
        );
      });
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
            newPhoneNumber: "not-a-phone",
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
