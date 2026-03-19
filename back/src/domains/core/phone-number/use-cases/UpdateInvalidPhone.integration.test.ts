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
  type Phone,
  type PhoneNumber,
} from "shared";
import {
  type KyselyDb,
  makeKyselyDb,
} from "../../../../config/pg/kysely/kyselyUtils";
import type { Database } from "../../../../config/pg/kysely/model/database";
import { makeTestPgPool } from "../../../../config/pg/pgPool";
import { toAgencyWithRights } from "../../../../utils/agency";
import type {
  EstablishmentAggregate,
  EstablishmentUserRight,
} from "../../../establishment/entities/EstablishmentAggregate";
import { EstablishmentAggregateBuilder } from "../../../establishment/helpers/EstablishmentBuilders";
import { ApiConsumerBuilder } from "../../api-consumer/adapters/InMemoryApiConsumerRepository";
import { CustomTimeGateway } from "../../time-gateway/adapters/CustomTimeGateway";
import type { TimeGateway } from "../../time-gateway/ports/TimeGateway";
import { createPgUow } from "../../unit-of-work/adapters/createPgUow";
import { PgUowPerformer } from "../../unit-of-work/adapters/PgUowPerformer";
import type { UnitOfWork } from "../../unit-of-work/ports/UnitOfWork";
import { UuidV4Generator } from "../../uuid-generator/adapters/UuidGeneratorImplementations";
import {
  type TablesWithPhoneReference,
  tablesWithPhoneReference,
} from "../ports/PhoneRepository";
import {
  makeUpdateInvalidPhone,
  type UpdateInvalidPhone,
  type UpdatePhonePayload,
} from "./UpdateInvalidPhone";

type PhoneReference = {
  tableName: TablesWithPhoneReference;
  objectIdWithPhoneReference: string;
};

describe("UpdateInvalidPhone", () => {
  let pool: Pool;
  let kyselyDb: KyselyDb;
  let uow: UnitOfWork;
  let uowPerformer: PgUowPerformer;
  let timeGateway: TimeGateway;
  let uuidGenerator: UuidV4Generator;
  let now: Date;

  let updateInvalidPhone: UpdateInvalidPhone;

  const fixablePhoneNumber: PhoneNumber = "+32784423078";
  const fixedPhoneNumber: PhoneNumber = "+33784423078";

  const insertPhoneNumber = async (phoneToInsert: Phone): Promise<void> => {
    await kyselyDb
      .insertInto("phone_numbers")
      .values({
        id: phoneToInsert.id,
        phone_number: phoneToInsert.phoneNumber,
        verified_at: phoneToInsert.verifiedAt,
        verification_status: phoneToInsert.verificationStatus,
      })
      .execute();
  };

  const generateRandomSiret = () => {
    return (Math.floor(Math.random() * 9e13) + 1e13).toString();
  };

  beforeAll(async () => {
    pool = makeTestPgPool();
    kyselyDb = makeKyselyDb(pool);
    uow = createPgUow(kyselyDb);
  });

  afterAll(async () => {
    await pool.end();
  });

  beforeEach(async () => {
    timeGateway = new CustomTimeGateway();
    now = timeGateway.now();
    uuidGenerator = new UuidV4Generator();

    uowPerformer = new PgUowPerformer(kyselyDb, createPgUow);
    updateInvalidPhone = makeUpdateInvalidPhone({
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

    await uow.userRepository.save(validator);
    const agencyWithPhoneNumber: AgencyWithUsersRights = toAgencyWithRights(
      agency,
      {
        [validator.id]: {
          isNotifiedByEmail: false,
          roles: ["validator"],
        },
      },
    );

    await uow.agencyRepository.insert(agencyWithPhoneNumber);
    await uow.conventionRepository.save(conventionWithPhoneNumber);
    await uow.apiConsumerRepository.save(apiConsumerWithPhoneNumber);
    await uow.discussionRepository.insert(discussionWithPhoneNumber);
    await uow.userRepository.save(establishmentUser);
    await uow.establishmentAggregateRepository.insertEstablishmentAggregate(
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
        const agency = await uow.agencyRepository.getById(id);
        expect(agency?.phoneNumber).toBe(phoneNumber);
      },

      actors: async (id) => {
        const convention = await uow.conventionRepository.getById(id);
        expect(convention?.signatories.beneficiary.phone).toBe(phoneNumber);
        expect(convention?.establishmentTutor.phone).toBe(phoneNumber);
        expect(convention?.signatories.establishmentRepresentative.phone).toBe(
          phoneNumber,
        );
      },

      api_consumers: async (id) => {
        const apiConsumer = await uow.apiConsumerRepository.getById(id);
        expect(apiConsumer?.contact.phone).toBe(phoneNumber);
      },

      discussions: async (id) => {
        const discussion = await uow.discussionRepository.getById(id);
        expect(discussion?.potentialBeneficiary.phone).toBe(phoneNumber);
      },

      establishments__users: async (id) => {
        const establishmentAggregateWithUser =
          await uow.establishmentAggregateRepository.getEstablishmentAggregatesByFilters(
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

  it("updates a non conflicting phone number", async () => {
    const nonConflictingPhone: Phone = {
      id: 1,
      phoneNumber: fixablePhoneNumber,
      verifiedAt: null,
      verificationStatus: "PENDING_VERIFICATION",
    };

    await insertPhoneNumber(nonConflictingPhone);

    const updateNonConflictingPhonePayload: UpdatePhonePayload = {
      currentPhone: nonConflictingPhone,
      newPhoneNumber: fixedPhoneNumber,
      newVerificationDate: subSeconds(now, 10).toISOString(),
      triggeredBy: { kind: "crawler" },
    };

    await updateInvalidPhone.execute(updateNonConflictingPhonePayload);

    expectArraysToEqualIgnoringOrder(
      await uow.phoneRepository.getPhoneNumbers({ limit: 100 }),
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

  it("updates a conflicting phone referenced on multiple tables and delete old and unused phone reference", async () => {
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

    await insertPhoneNumber(fixedPhone);
    await insertPhoneNumber(conflictingFixablePhone);

    await createPhoneReferencesOnAllTables(fixedPhoneNumber);
    const objectsWithFixablePhoneReferences =
      await createPhoneReferencesOnAllTables(fixablePhoneNumber);

    const updateConflictingPhonePayload: UpdatePhonePayload = {
      currentPhone: conflictingFixablePhone,
      newPhoneNumber: fixedPhoneNumber,
      newVerificationDate: subSeconds(now, 10).toISOString(),
      triggeredBy: { kind: "crawler" },
    };

    await updateInvalidPhone.execute(updateConflictingPhonePayload);

    expectArraysToEqualIgnoringOrder(
      await uow.phoneRepository.getPhoneNumbers({ limit: 100 }),
      [fixedPhone],
    );
    await expectPhoneReferencesToMatchPhoneNumber(
      objectsWithFixablePhoneReferences,
      fixedPhoneNumber,
    );
  });

  it("throws if newPhoneNumber has invalid format", async () => {
    await expect(
      updateInvalidPhone.execute({
        currentPhone: {
          id: 1,
          phoneNumber: defaultPhoneNumber,
          verifiedAt: null,
          verificationStatus: "PENDING_VERIFICATION",
        },
        newPhoneNumber: "not-a-phone",
        newVerificationDate: now.toISOString(),
        triggeredBy: { kind: "crawler" },
      }),
    ).rejects.toThrow();
  });

  it("does nothing if newPhoneNumber is identical to currentPhone", async () => {
    const defaultPhone: Phone = {
      id: 1,
      phoneNumber: defaultPhoneNumber,
      verifiedAt: null,
      verificationStatus: "PENDING_VERIFICATION",
    };

    await insertPhoneNumber(defaultPhone);

    const objectsWithDefaultPhoneReferences =
      await createPhoneReferencesOnAllTables(defaultPhoneNumber);

    await updateInvalidPhone.execute({
      currentPhone: defaultPhone,
      newPhoneNumber: defaultPhoneNumber,
      newVerificationDate: now.toISOString(),
      triggeredBy: { kind: "crawler" },
    });

    expectArraysToEqualIgnoringOrder(
      await uow.phoneRepository.getPhoneNumbers({ limit: 100 }),
      [defaultPhone],
    );
    await expectPhoneReferencesToMatchPhoneNumber(
      objectsWithDefaultPhoneReferences,
      defaultPhoneNumber,
    );
  });

  it("does nothing if currentPhone.id does not exist in DB", async () => {
    const nonExistingId = 999;
    const phone: Phone = {
      id: nonExistingId,
      phoneNumber: fixablePhoneNumber,
      verifiedAt: null,
      verificationStatus: "PENDING_VERIFICATION",
    };

    await updateInvalidPhone.execute({
      currentPhone: phone,
      newPhoneNumber: fixedPhoneNumber,
      newVerificationDate: now.toISOString(),
      triggeredBy: { kind: "crawler" },
    });

    expectArraysToEqualIgnoringOrder(
      await uow.phoneRepository.getPhoneNumbers({ limit: 100 }),
      [],
    );
  });

  it("throws if TablesWithPhoneReference does not contain all tables with phone reference", async () => {
    const isReportedTableWithPhoneReference = (
      table: keyof Database,
    ): table is TablesWithPhoneReference =>
      (tablesWithPhoneReference as readonly (keyof Database)[]).includes(table);

    const tablesWithPhoneReferenceInDB =
      await uow.phoneRepository.getTableNamesReferencingPhoneNumbers();
    const unsupportedTables = tablesWithPhoneReferenceInDB.filter(
      (table) => !isReportedTableWithPhoneReference(table),
    );
    if (unsupportedTables.length > 0) {
      throw new Error(
        `Phone reference in tables [${unsupportedTables.join(", ")}] is not updated`,
      );
    }
  });
});
