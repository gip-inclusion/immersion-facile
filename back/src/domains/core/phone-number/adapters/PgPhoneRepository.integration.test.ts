import { subSeconds } from "date-fns";
import type { Pool } from "pg";
import {
  type AgencyDto,
  AgencyDtoBuilder,
  type AgencyWithUsersRights,
  type ApiConsumer,
  ConnectedUserBuilder,
  type ConventionDto,
  ConventionDtoBuilder,
  DiscussionBuilder,
  type DiscussionDto,
  defaultPhoneNumber,
  expectArraysToEqualIgnoringOrder,
  expectToEqual,
  type Phone,
  type PhoneNumber,
} from "shared";
import {
  type KyselyDb,
  makeKyselyDb,
} from "../../../../config/pg/kysely/kyselyUtils";
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
import { UuidV4Generator } from "../../uuid-generator/adapters/UuidGeneratorImplementations";
import {
  type TablesWithPhoneReference,
  tablesWithPhoneReference,
} from "../ports/PhoneRepository";
import type { UpdatePhonePayload } from "../use-cases/UpdateInvalidPhone";
import { PgPhoneRepository } from "./PgPhoneRepository";
import { getOrCreatePhoneIds } from "./pgPhoneHelper";

type PhoneReference = {
  tableName: TablesWithPhoneReference;
  objectIdWithPhoneReference: string;
};

describe("PgPhoneRepository", () => {
  let pool: Pool;
  let db: KyselyDb;
  let uuidGenerator: UuidV4Generator;
  let timeGateway: TimeGateway;
  let now: Date;
  let tenSecondsAgo: Date;

  let pgPhoneRepository: PgPhoneRepository;
  let pgAgencyRepository: PgAgencyRepository;
  let pgConventionRepository: PgConventionRepository;
  let pgApiConsumerRepository: PgApiConsumerRepository;
  let pgDiscussionRepository: PgDiscussionRepository;
  let pgUserRepository: PgUserRepository;
  let pgEstablishmentAggregateRepository: PgEstablishmentAggregateRepository;

  const defautPhoneNumber: PhoneNumber = "+33600000000";
  const correctPhoneNumber: PhoneNumber = "+33555689727";
  const fixablePhoneNumber: PhoneNumber = "+32784423078";
  const fixedPhoneNumber: PhoneNumber = "+33784423078";

  beforeAll(async () => {
    pool = makeTestPgPool();
    db = makeKyselyDb(pool);
    uuidGenerator = new UuidV4Generator();

    pgAgencyRepository = new PgAgencyRepository(db);
    pgConventionRepository = new PgConventionRepository(db);
    pgApiConsumerRepository = new PgApiConsumerRepository(db);
    pgDiscussionRepository = new PgDiscussionRepository(db);
    pgUserRepository = new PgUserRepository(db);
    pgEstablishmentAggregateRepository = new PgEstablishmentAggregateRepository(
      db,
    );
  });

  beforeEach(async () => {
    pgPhoneRepository = new PgPhoneRepository(db);
    timeGateway = new CustomTimeGateway();
    now = timeGateway.now();
    tenSecondsAgo = subSeconds(now, 10);

    await db.deleteFrom("users").execute();
    await db.deleteFrom("users__agencies").execute();
    await db.deleteFrom("users_admins").execute();
    await db.deleteFrom("establishments").execute();
    await db.deleteFrom("marketing_establishment_contacts").execute();
    await db.deleteFrom("establishments_deleted").execute();
    await db.deleteFrom("establishments__users").execute();
    await db.deleteFrom("establishment_lead_events").execute();
    await db.deleteFrom("establishments_location_positions").execute();
    await db.deleteFrom("establishments_location_infos").execute();
    await db.deleteFrom("outbox_failures").execute();
    await db.deleteFrom("outbox_publications").execute();
    await db.deleteFrom("outbox").execute();
    await db.deleteFrom("discussions").execute();
    await db.deleteFrom("convention_drafts").execute();
    await db.deleteFrom("convention_templates").execute();
    await db.deleteFrom("conventions").execute();
    await db.deleteFrom("agencies").execute();
    await db.deleteFrom("actors").execute();
    await db.deleteFrom("api_consumers").execute();
    await db.deleteFrom("establishments__users").execute();
    await db.deleteFrom("phone_numbers").execute();
  });

  afterAll(async () => {
    await pool.end();
  });

  const generateRandomSiret = () => {
    return (Math.floor(Math.random() * 9e13) + 1e13).toString();
  };

  const insertPhone = async (phoneToInsert: Phone): Promise<void> => {
    await db
      .insertInto("phone_numbers")
      .values({
        id: phoneToInsert.id,
        phone_number: phoneToInsert.phoneNumber,
        verified_at: phoneToInsert.verifiedAt,
        verification_status: phoneToInsert.verificationStatus,
      })
      .execute();
  };

  const createPhoneReferencesOnAllTables = async (
    phoneNumber: PhoneNumber,
  ): Promise<PhoneReference[]> => {
    const validator = new ConnectedUserBuilder()
      .withId(uuidGenerator.new())
      .withEmail(`${uuidGenerator.new()}@agency1.fr`)
      .withProConnectInfos(null)
      .buildUser();
    const agency: AgencyDto = new AgencyDtoBuilder()
      .withId(uuidGenerator.new())
      .withAgencySiret(generateRandomSiret())
      .withPhoneNumber(phoneNumber)
      .build();

    const conventionWithPhoneNumber: ConventionDto = new ConventionDtoBuilder()
      .withId(uuidGenerator.new())
      .withAgencyId(agency.id)
      .withBeneficiary({
        birthdate: new Date("2000-05-26").toISOString(),
        firstName: "Nolwenn",
        lastName: "Le Bihan",
        role: "beneficiary",
        email: `${uuidGenerator.new()}@breizh.com`,
        phone: phoneNumber,
      })
      .withEstablishmentTutorPhone(phoneNumber)
      .withEstablishmentRepresentativePhone(phoneNumber)
      .build();

    const apiConsumerWithPhoneNumber: ApiConsumer = new ApiConsumerBuilder()
      .withId(uuidGenerator.new())
      .withContact({
        emails: [`${uuidGenerator.new()}@abc.com`],
        firstName: "Erwan",
        lastName: "Leguidec",
        phone: phoneNumber,
        job: "Crêpier",
      })
      .build();

    const discussionWithPhoneNumber: DiscussionDto = new DiscussionBuilder()
      .withId(uuidGenerator.new())
      .withPotentialBeneficiaryPhone(phoneNumber)
      .build();

    const establishmentUser = new ConnectedUserBuilder()
      .withId(uuidGenerator.new())
      .withEmail(`${uuidGenerator.new()}@lebricoleur.com`)
      .withProConnectInfos(null)
      .buildUser();
    const establishmentUserRight: EstablishmentUserRight = {
      role: "establishment-contact",
      shouldReceiveDiscussionNotifications: false,
      userId: establishmentUser.id,
      phone: phoneNumber,
    };
    const establishmentAggregate: EstablishmentAggregate =
      new EstablishmentAggregateBuilder()
        .withEstablishmentSiret(generateRandomSiret())
        .withLocationId(uuidGenerator.new().toString())
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

    const referenceByTable: Record<TablesWithPhoneReference, PhoneReference> = {
      agencies: {
        tableName: "agencies",
        objectIdWithPhoneReference: agency.id,
      },
      actors: {
        tableName: "actors",
        objectIdWithPhoneReference: conventionWithPhoneNumber.id,
      },
      api_consumers: {
        tableName: "api_consumers",
        objectIdWithPhoneReference: apiConsumerWithPhoneNumber.id,
      },
      discussions: {
        tableName: "discussions",
        objectIdWithPhoneReference: discussionWithPhoneNumber.id,
      },
      establishments__users: {
        tableName: "establishments__users",
        objectIdWithPhoneReference: establishmentUserRight.userId,
      },
    };

    return Object.values(referenceByTable);
  };

  const expectPhoneReferencesToMatchPhoneNumber = async (
    phoneReferences: PhoneReference[],
    phoneNumber: PhoneNumber,
  ) => {
    const expectByTable: Record<
      TablesWithPhoneReference,
      (id: string) => Promise<void>
    > = {
      agencies: async (id) => {
        const agency = await pgAgencyRepository.getById(id);
        expect(agency?.phoneNumber).toBe(phoneNumber);
      },

      actors: async (id) => {
        const convention = await pgConventionRepository.getById(id);
        expect(convention?.signatories.beneficiary.phone).toBe(phoneNumber);
        expect(convention?.establishmentTutor.phone).toBe(phoneNumber);
        expect(convention?.signatories.establishmentRepresentative.phone).toBe(
          phoneNumber,
        );
      },

      api_consumers: async (id) => {
        const apiConsumer = await pgApiConsumerRepository.getById(id);
        expect(apiConsumer?.contact.phone).toBe(phoneNumber);
      },

      discussions: async (id) => {
        const discussion = await pgDiscussionRepository.getById(id);
        expect(discussion?.potentialBeneficiary.phone).toBe(phoneNumber);
      },

      establishments__users: async (id) => {
        const establishmentAggregateWithUser =
          await pgEstablishmentAggregateRepository.getEstablishmentAggregatesByFilters(
            { userId: id },
          );
        const userRight = establishmentAggregateWithUser?.[0].userRights.find(
          (userRight) => userRight.userId === id,
        );
        expect(userRight?.phone).toBe(phoneNumber);
      },
    };

    await Promise.all(
      phoneReferences.map(({ tableName, objectIdWithPhoneReference }) =>
        expectByTable[tableName](objectIdWithPhoneReference),
      ),
    );
  };

  describe("getConflictingPhoneNumberId", () => {
    it("returns null when no conflicting phone number exists", async () => {
      await getOrCreatePhoneIds(db, [correctPhoneNumber]);

      const conflictingPhone =
        await pgPhoneRepository.getConflictingPhoneNumberId({
          phoneNumber: defautPhoneNumber,
        });

      expect(conflictingPhone).toBe(null);
    });

    it("returns the conflicting phone number id when a conflict exists", async () => {
      const correctPhoneId = (
        await getOrCreatePhoneIds(db, [correctPhoneNumber])
      )[correctPhoneNumber];

      const conflictingPhone =
        await pgPhoneRepository.getConflictingPhoneNumberId({
          phoneNumber: correctPhoneNumber,
        });

      expect(conflictingPhone).toBe(correctPhoneId);
    });
  });

  describe("fixConflictingPhoneUpdate", () => {
    it("does nothing if current phone id does not exist", async () => {
      const unknownConflictingPhoneId = 999;

      const fixablePhone: Phone = {
        id: 1,
        phoneNumber: fixablePhoneNumber,
        verifiedAt: null,
        verificationStatus: "PENDING_VERIFICATION",
      };

      await insertPhone(fixablePhone);

      const updatePhonePayload: UpdatePhonePayload = {
        currentPhone: { ...fixablePhone, id: unknownConflictingPhoneId },
        newPhoneNumber: fixedPhoneNumber,
        newVerificationDate: tenSecondsAgo.toISOString(),
        triggeredBy: { kind: "crawler" },
      };

      await pgPhoneRepository.fixConflictingPhoneUpdate({
        conflictingPhoneNumberId: unknownConflictingPhoneId,
        updatePhonePayload,
      });

      expectToEqual((await pgPhoneRepository.getPhoneNumbers()).phones, [
        fixablePhone,
      ]);
    });

    it("fix the conflicting phone number by updating all references and deleting old reference", async () => {
      const conflictingFixablePhone: Phone = {
        id: 1,
        phoneNumber: fixablePhoneNumber,
        verifiedAt: null,
        verificationStatus: "NOT_VERIFIED",
      };

      const fixedPhone: Phone = {
        id: 2,
        phoneNumber: fixedPhoneNumber,
        verifiedAt: null,
        verificationStatus: "NOT_VERIFIED",
      };

      await insertPhone(fixedPhone);
      await insertPhone(conflictingFixablePhone);

      await createPhoneReferencesOnAllTables(fixedPhoneNumber);
      const fixablePhoneReferences =
        await createPhoneReferencesOnAllTables(fixablePhoneNumber);

      const updateConflictingPhonePayload: UpdatePhonePayload = {
        currentPhone: conflictingFixablePhone,
        newPhoneNumber: fixedPhoneNumber,
        newVerificationDate: subSeconds(now, 10).toISOString(),
        triggeredBy: { kind: "crawler" },
      };

      await pgPhoneRepository.fixConflictingPhoneUpdate({
        conflictingPhoneNumberId: fixedPhone.id,
        updatePhonePayload: updateConflictingPhonePayload,
      });

      expectArraysToEqualIgnoringOrder(
        (await pgPhoneRepository.getPhoneNumbers({ limit: 100 })).phones,
        [fixedPhone],
      );
      await expectPhoneReferencesToMatchPhoneNumber(
        fixablePhoneReferences,
        fixedPhoneNumber,
      );
    });
  });

  describe("fixNotConflictingPhone", () => {
    it("does nothing when no phone id matches the update payload", async () => {
      const unknownConflictingPhoneId = 999;

      const nonConflictingPhone: Phone = {
        id: 1,
        phoneNumber: fixablePhoneNumber,
        verifiedAt: null,
        verificationStatus: "PENDING_VERIFICATION",
      };

      await insertPhone(nonConflictingPhone);

      const updatePhonePayload: UpdatePhonePayload = {
        currentPhone: { ...nonConflictingPhone, id: unknownConflictingPhoneId },
        newPhoneNumber: fixedPhoneNumber,
        newVerificationDate: tenSecondsAgo.toISOString(),
        triggeredBy: { kind: "crawler" },
      };

      await pgPhoneRepository.fixConflictingPhoneUpdate({
        conflictingPhoneNumberId: unknownConflictingPhoneId,
        updatePhonePayload,
      });

      expectToEqual((await pgPhoneRepository.getPhoneNumbers()).phones, [
        nonConflictingPhone,
      ]);
    });

    it("updates a fixable phone correctly", async () => {
      const nonConflictingPhone: Phone = {
        id: 1,
        phoneNumber: fixablePhoneNumber,
        verifiedAt: null,
        verificationStatus: "PENDING_VERIFICATION",
      };

      await insertPhone(nonConflictingPhone);

      const updateNonConflictingPhonePayload: UpdatePhonePayload = {
        currentPhone: nonConflictingPhone,
        newPhoneNumber: fixedPhoneNumber,
        newVerificationDate: tenSecondsAgo.toISOString(),
        triggeredBy: { kind: "crawler" },
      };

      await pgPhoneRepository.fixNotConflictingPhone({
        updatePhonePayload: updateNonConflictingPhonePayload,
      });

      expectArraysToEqualIgnoringOrder(
        (await pgPhoneRepository.getPhoneNumbers({ limit: 100 })).phones,
        [
          {
            ...nonConflictingPhone,
            phoneNumber: fixedPhoneNumber,
            verifiedAt: new Date(
              updateNonConflictingPhonePayload.newVerificationDate,
            ),
            verificationStatus: "VERIFICATION_COMPLETED",
          },
        ],
      );
    });
  });

  describe("getPhoneNumbers", () => {
    it("returns all phone numbers when no filter is provided", async () => {
      const phone1: Phone = {
        id: 1,
        phoneNumber: correctPhoneNumber,
        verifiedAt: null,
        verificationStatus: "PENDING_VERIFICATION",
      };
      const phone2: Phone = {
        id: 2,
        phoneNumber: fixablePhoneNumber,
        verifiedAt: null,
        verificationStatus: "NOT_VERIFIED",
      };

      await insertPhone(phone1);
      await insertPhone(phone2);

      const { phones } = await pgPhoneRepository.getPhoneNumbers({
        limit: 100,
      });

      expectArraysToEqualIgnoringOrder(phones, [phone1, phone2]);
    });

    it("returns only phone numbers with the filtered verification status", async () => {
      const pendingPhone: Phone = {
        id: 1,
        phoneNumber: correctPhoneNumber,
        verifiedAt: null,
        verificationStatus: "PENDING_VERIFICATION",
      };
      const notVerifiedPhone: Phone = {
        id: 2,
        phoneNumber: fixablePhoneNumber,
        verifiedAt: null,
        verificationStatus: "NOT_VERIFIED",
      };

      await insertPhone(pendingPhone);
      await insertPhone(notVerifiedPhone);

      const { phones } = await pgPhoneRepository.getPhoneNumbers({
        limit: 100,
        verificationStatus: ["PENDING_VERIFICATION"],
      });

      expectArraysToEqualIgnoringOrder(phones, [pendingPhone]);
    });

    it("returns only phone numbers verified before the given date", async () => {
      const oldVerifiedPhone: Phone = {
        id: 1,
        phoneNumber: correctPhoneNumber,
        verifiedAt: tenSecondsAgo,
        verificationStatus: "VERIFICATION_COMPLETED",
      };
      const recentPhone: Phone = {
        id: 2,
        phoneNumber: fixablePhoneNumber,
        verifiedAt: now,
        verificationStatus: "VERIFICATION_COMPLETED",
      };

      await insertPhone(oldVerifiedPhone);
      await insertPhone(recentPhone);

      const { phones } = await pgPhoneRepository.getPhoneNumbers({
        verifiedBefore: now,
        limit: 100,
      });

      expectToEqual(phones, [oldVerifiedPhone]);
    });

    it("returns at most the given limit of phone numbers", async () => {
      const phone1: Phone = {
        id: 1,
        phoneNumber: correctPhoneNumber,
        verifiedAt: null,
        verificationStatus: "PENDING_VERIFICATION",
      };
      const phone2: Phone = {
        id: 2,
        phoneNumber: fixablePhoneNumber,
        verifiedAt: null,
        verificationStatus: "NOT_VERIFIED",
      };

      await insertPhone(phone1);
      await insertPhone(phone2);

      const { phones, cursorId } = await pgPhoneRepository.getPhoneNumbers({
        limit: 1,
      });

      expect(phones).toHaveLength(1);
      expectToEqual(cursorId, 1);
    });

    it("returns an empty array when no phone numbers match the filters", async () => {
      const { phones, cursorId } = await pgPhoneRepository.getPhoneNumbers({
        limit: 100,
      });

      expectToEqual(phones, []);
      expect(cursorId).toBeNull();
    });
  });

  describe("markAsVerified", () => {
    it("marks the given phone ids as verified with the provided date", async () => {
      const phone: Phone = {
        id: 1,
        phoneNumber: correctPhoneNumber,
        verifiedAt: null,
        verificationStatus: "PENDING_VERIFICATION",
      };

      await insertPhone(phone);

      await pgPhoneRepository.markAsVerified({
        phoneIds: [phone.id],
        verifiedDate: tenSecondsAgo,
      });

      const { phones } = await pgPhoneRepository.getPhoneNumbers({
        limit: 100,
      });

      expectToEqual(phones, [{ ...phone, verifiedAt: tenSecondsAgo }]);
    });

    it("does nothing when an empty list of phone ids is provided", async () => {
      const phone: Phone = {
        id: 1,
        phoneNumber: correctPhoneNumber,
        verifiedAt: null,
        verificationStatus: "PENDING_VERIFICATION",
      };

      await insertPhone(phone);

      await pgPhoneRepository.markAsVerified({
        phoneIds: [],
        verifiedDate: tenSecondsAgo,
      });

      const { phones } = await pgPhoneRepository.getPhoneNumbers({
        limit: 100,
      });

      expectToEqual(phones, [phone]);
    });
  });

  describe("updateVerificationStatus", () => {
    it("does nothing if phone id is not found", async () => {
      const unknownPhoneId = 999;

      const phone: Phone = {
        id: 1,
        phoneNumber: correctPhoneNumber,
        verifiedAt: null,
        verificationStatus: "PENDING_VERIFICATION",
      };
      await insertPhone(phone);

      await pgPhoneRepository.updateVerificationStatus({
        phoneIds: [unknownPhoneId],
        verificationStatus: "VERIFICATION_COMPLETED",
      });
      expectToEqual((await pgPhoneRepository.getPhoneNumbers()).phones, [
        phone,
      ]);
    });

    it("updates the verification status for the given phone ids", async () => {
      const phone1: Phone = {
        id: 1,
        phoneNumber: correctPhoneNumber,
        verifiedAt: null,
        verificationStatus: "PENDING_VERIFICATION",
      };

      const phone2: Phone = {
        id: 2,
        phoneNumber: defaultPhoneNumber,
        verifiedAt: null,
        verificationStatus: "PENDING_VERIFICATION",
      };

      await insertPhone(phone1);
      await insertPhone(phone2);

      await pgPhoneRepository.updateVerificationStatus({
        phoneIds: [phone1.id, phone2.id],
        verificationStatus: "VERIFICATION_COMPLETED",
      });

      const { phones } = await pgPhoneRepository.getPhoneNumbers({
        limit: 100,
      });

      expectToEqual(phones, [
        { ...phone1, verificationStatus: "VERIFICATION_COMPLETED" },
        { ...phone2, verificationStatus: "VERIFICATION_COMPLETED" },
      ]);
    });

    it("does nothing when an empty list of phone ids is provided", async () => {
      const phone: Phone = {
        id: 1,
        phoneNumber: correctPhoneNumber,
        verifiedAt: null,
        verificationStatus: "PENDING_VERIFICATION",
      };

      await insertPhone(phone);

      await pgPhoneRepository.updateVerificationStatus({
        phoneIds: [],
        verificationStatus: "VERIFICATION_COMPLETED",
      });

      const { phones } = await pgPhoneRepository.getPhoneNumbers({
        limit: 100,
      });

      expectToEqual(phones, [phone]);
    });
  });

  describe("getTableNamesReferencingPhoneNumbers", () => {
    it("returns the list of table names that reference phone numbers", async () => {
      const tablesWithPhoneReferenceInDB =
        await pgPhoneRepository.getTableNamesReferencingPhoneNumbers();
      expectArraysToEqualIgnoringOrder(
        tablesWithPhoneReferenceInDB,
        tablesWithPhoneReference,
      );
    });
  });
});
