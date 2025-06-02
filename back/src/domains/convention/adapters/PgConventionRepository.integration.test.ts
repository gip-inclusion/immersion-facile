import { addDays, subDays } from "date-fns";
import type { Pool } from "pg";
import {
  AgencyDtoBuilder,
  type AppellationAndRomeDto,
  type BeneficiaryCurrentEmployer,
  type BeneficiaryRepresentative,
  type ConventionDto,
  ConventionDtoBuilder,
  type ConventionId,
  type EstablishmentRepresentative,
  type EstablishmentTutor,
  type FtConnectToken,
  type WithAcquisition,
  errors,
  expectPromiseToFailWithError,
  expectToEqual,
  reasonableSchedule,
} from "shared";
import { v4 as uuid } from "uuid";
import {
  type KyselyDb,
  makeKyselyDb,
} from "../../../config/pg/kysely/kyselyUtils";
import { getTestPgPool } from "../../../config/pg/pgUtils";
import { toAgencyWithRights } from "../../../utils/agency";
import { makeUniqueUserForTest } from "../../../utils/user";
import { PgAgencyRepository } from "../../agency/adapters/PgAgencyRepository";
import { PgUserRepository } from "../../core/authentication/inclusion-connect/adapters/PgUserRepository";
import { CustomTimeGateway } from "../../core/time-gateway/adapters/CustomTimeGateway";
import { PgConventionRepository } from "./PgConventionRepository";

describe("PgConventionRepository", () => {
  const anyConventionUpdatedAt = new Date("2022-05-20T12:43:11").toISOString();
  const beneficiaryRepresentative: BeneficiaryRepresentative = {
    role: "beneficiary-representative",
    email: "legal@representative.com",
    firstName: "The",
    lastName: "Representative",
    phone: "+33112233445",
  };

  const userFtExternalId = "749dd14f-c82a-48b1-b1bb-fffc5467e4d4";
  const agency = new AgencyDtoBuilder().withId(uuid()).build();
  const styliste: AppellationAndRomeDto = {
    romeCode: "B1805",
    romeLabel: "Stylisme",
    appellationCode: "19540",
    appellationLabel: "Styliste",
  };

  const conventionStylisteBuilder = new ConventionDtoBuilder()
    .withImmersionAppellation(styliste)
    .withUpdatedAt(anyConventionUpdatedAt)
    .withAgencyReferentFirstName("Fredy")
    .withAgencyReferentLastName("L'ACCOMPAGNATEUR")
    .withAgencyId(agency.id);

  let pool: Pool;
  let conventionRepository: PgConventionRepository;
  let db: KyselyDb;
  let timeGateway: CustomTimeGateway;

  beforeAll(async () => {
    pool = getTestPgPool();
    db = makeKyselyDb(pool);

    const validator = makeUniqueUserForTest(uuid());
    await new PgUserRepository(db).save(validator);
    await new PgAgencyRepository(db).insert(
      toAgencyWithRights(new AgencyDtoBuilder().withId(uuid()).build(), {
        [validator.id]: { isNotifiedByEmail: true, roles: ["validator"] },
      }),
    );
    timeGateway = new CustomTimeGateway();
  });

  afterAll(async () => {
    await pool.end();
  });

  beforeEach(async () => {
    timeGateway = new CustomTimeGateway();
    await db.deleteFrom("partners_pe_connect").execute();
    await db.deleteFrom("conventions").execute();
    await db.deleteFrom("actors").execute();
    await db.deleteFrom("partners_pe_connect").execute();
    await db.deleteFrom("convention_external_ids").execute();
    await db.deleteFrom("agency_groups__agencies").execute();
    await db.deleteFrom("agency_groups").execute();
    await db.deleteFrom("agencies").execute();

    const validator = makeUniqueUserForTest(uuid());

    await new PgUserRepository(db).save(validator);
    await new PgAgencyRepository(db).insert(
      toAgencyWithRights(agency, {
        [validator.id]: { isNotifiedByEmail: true, roles: ["validator"] },
      }),
    );

    conventionRepository = new PgConventionRepository(db);
  });

  it("Adds a new convention", async () => {
    const convention = conventionStylisteBuilder
      .withId("aaaaac99-9c0b-1bbb-bb6d-6bb9bd38aaaa")
      .withEstablishmentNumberOfEmployeesRange("20-49")
      .withAgencyId(agency.id)
      .build();

    expect(await conventionRepository.getById(convention.id)).toBeUndefined();

    const savedExternalId = await conventionRepository.save(
      convention,
      anyConventionUpdatedAt,
    );

    expect(await conventionRepository.getById(convention.id)).toEqual(
      convention,
    );
    expect(savedExternalId).toBeUndefined();
  });

  it("fails to add a convention if it already exits", async () => {
    const convention = new ConventionDtoBuilder()
      .withInternshipKind("immersion")
      .withId("aaaaac99-9c0b-1bbb-bb6d-6bb9bd38aaaa")
      .withAgencyId(agency.id)
      .withDateStart(new Date("2023-01-02").toISOString())
      .withDateEnd(new Date("2023-01-06").toISOString())
      .withSchedule(reasonableSchedule)
      .withAgencyReferentFirstName("Fredy")
      .withAgencyReferentLastName("L'ACCOMPAGNATEUR")
      .build();

    await conventionRepository.save(convention);

    await expectPromiseToFailWithError(
      conventionRepository.save(convention),
      errors.convention.conflict({ conventionId: convention.id }),
    );
  });

  it("Adds/Update a new CCI convention", async () => {
    const convention = conventionStylisteBuilder
      .withInternshipKind("mini-stage-cci")
      .withId("aaaaac99-9c0b-1bbb-bb6d-6bb9bd38aaaa")
      .withDateStart(new Date("2023-01-02").toISOString())
      .withDateEnd(new Date("2023-01-06").toISOString())
      .withEstablishmentNumberOfEmployeesRange("1-2")
      .withSchedule(reasonableSchedule)
      .build();

    await conventionRepository.save(convention, anyConventionUpdatedAt);

    expect(await conventionRepository.getById(convention.id)).toEqual(
      convention,
    );

    const updatedConvention = new ConventionDtoBuilder(convention)
      .withBeneficiaryFirstName("Marvin")
      .withEstablishmentNumberOfEmployeesRange("20-49")
      .withUpdatedAt(anyConventionUpdatedAt)
      .build();

    await conventionRepository.update(
      updatedConvention,
      anyConventionUpdatedAt,
    );
    expect(await conventionRepository.getById(updatedConvention.id)).toEqual(
      updatedConvention,
    );
  });

  it("Adds a new convention with field workConditions undefined and no signatories", async () => {
    const convention = conventionStylisteBuilder
      .withoutWorkCondition()
      .notSigned()
      .build();

    await conventionRepository.save(convention, anyConventionUpdatedAt);

    const fetchedConvention = await conventionRepository.getById(convention.id);
    expect(fetchedConvention).toEqual(convention);
  });

  it("Keeps acquisition params when provided", async () => {
    const withAcquisition: WithAcquisition = {
      acquisitionKeyword: "acquisition-keyword",
      acquisitionCampaign: "acquisition-campaign",
    };

    const convention = new ConventionDtoBuilder()
      .withImmersionAppellation(styliste)
      .withoutWorkCondition()
      .withAgencyId(agency.id)
      .withAcquisition(withAcquisition)
      .notSigned()
      .build();

    await conventionRepository.save(convention);

    const result = await db
      .selectFrom("conventions")
      .select(["acquisition_campaign", "acquisition_keyword"])
      .execute();

    expectToEqual(result, [
      {
        acquisition_campaign: "acquisition-campaign",
        acquisition_keyword: "acquisition-keyword",
      },
    ]);
  });

  it("Adds a convention renewed from another one", async () => {
    const existingConvention = conventionStylisteBuilder
      .withStatus("ACCEPTED_BY_VALIDATOR")
      .withId("11111111-1111-4111-1111-111111111111")
      .withEstablishmentNumberOfEmployeesRange("20-49")
      .build();

    await conventionRepository.save(existingConvention);

    const renewedConvention = conventionStylisteBuilder
      .withId("22222222-2222-4222-2222-222222222222")
      .withStatus("READY_TO_SIGN")
      .withRenewed({
        from: existingConvention.id,
        justification: "some justification",
      })
      .build();

    await conventionRepository.save(renewedConvention, anyConventionUpdatedAt);

    const fetchedConvention = await conventionRepository.getById(
      renewedConvention.id,
    );
    expectToEqual(fetchedConvention, renewedConvention);
  });

  it("Adds a new convention with beneficiary extra fields", async () => {
    const extraFields = {
      isRqth: false,
      emergencyContact: "jean bon",
    };
    const convention = new ConventionDtoBuilder()
      .withBeneficiary({
        birthdate: new Date("2000-05-26").toISOString(),
        firstName: "Jean",
        lastName: "Bono",
        role: "beneficiary",
        email: "jean@bono.com",
        phone: "+33836656565",
        ...extraFields,
      })
      .withAgencyId(agency.id)
      .build();

    await conventionRepository.save(convention);

    const conventionRetreived = await conventionRepository.getById(
      convention.id,
    );

    expectToEqual(conventionRetreived?.signatories.beneficiary, {
      ...convention.signatories.beneficiary,
      ...extraFields,
    });
  });

  it("Adds a new convention with beneficiary extra fields without isRqth", async () => {
    const extraFields = {
      emergencyContact: "jean bon",
    };
    const convention = new ConventionDtoBuilder()
      .withBeneficiary({
        birthdate: new Date("2000-05-26").toISOString(),
        firstName: "Jean",
        lastName: "Bono",
        role: "beneficiary",
        email: "jean@bono.com",
        phone: "+33836656565",
        ...extraFields,
      })
      .withAgencyId(agency.id)
      .build();

    await conventionRepository.save(convention);

    const conventionRetreived = await conventionRepository.getById(
      convention.id,
    );

    expect(conventionRetreived?.signatories.beneficiary.isRqth).toBeUndefined();
  });

  it("Adds a new convention with a beneficiary having a federatedIdentity with a payload", async () => {
    const extraFields = {
      emergencyContact: "jean bon",
    };
    const convention = new ConventionDtoBuilder()
      .withBeneficiary({
        birthdate: new Date("2000-05-26").toISOString(),
        firstName: "Jean",
        lastName: "Bono",
        role: "beneficiary",
        email: "jean@bono.com",
        phone: "+33836656565",
        ...extraFields,
      })
      .withFederatedIdentity({
        provider: "peConnect",
        token: userFtExternalId,
        payload: {
          advisor: {
            email: "john@mail.com",
            firstName: "John",
            lastName: "Doe",
            type: "PLACEMENT",
          },
        },
      })
      .withAgencyId(agency.id)
      .build();

    await db
      .insertInto("partners_pe_connect")
      .values({
        user_pe_external_id: userFtExternalId,
        convention_id: convention.id,
        email: "john@mail.com",
        firstname: "John",
        lastname: "Doe",
        type: "PLACEMENT",
      })
      .execute();

    await conventionRepository.save(convention);

    const conventionRetreived = await conventionRepository.getById(
      convention.id,
    );

    expect(
      conventionRetreived?.signatories.beneficiary.federatedIdentity,
    ).toStrictEqual({
      provider: "peConnect",
      token: userFtExternalId,
      payload: {
        advisor: {
          email: "john@mail.com",
          firstName: "John",
          lastName: "Doe",
          type: "PLACEMENT",
        },
      },
    });
  });

  it("Adds a new convention with a beneficiary having a federatedIdentity without a payload", async () => {
    const extraFields = {
      emergencyContact: "jean bon",
    };
    const convention = new ConventionDtoBuilder()
      .withBeneficiary({
        birthdate: new Date("2000-05-26").toISOString(),
        firstName: "Jean",
        lastName: "Bono",
        role: "beneficiary",
        email: "jean@bono.com",
        phone: "+33836656565",
        ...extraFields,
      })
      .withFederatedIdentity({
        provider: "peConnect",
        token: userFtExternalId,
      })
      .withAgencyId(agency.id)
      .build();

    await db
      .insertInto("partners_pe_connect")
      .values({
        user_pe_external_id: userFtExternalId,
        convention_id: convention.id,
        email: null,
        firstname: null,
        lastname: null,
        type: null,
      })
      .execute();

    await conventionRepository.save(convention);

    const conventionRetreived = await conventionRepository.getById(
      convention.id,
    );

    expect(
      conventionRetreived?.signatories.beneficiary.federatedIdentity,
    ).toStrictEqual({
      provider: "peConnect",
      token: userFtExternalId,
    });
  });

  it("Only one actor when the convention has same establisment tutor and representative", async () => {
    const email = "tutor123w@mail.com";
    const tutor: EstablishmentTutor = {
      firstName: "Joe",
      lastName: "Doe",
      job: "Chef",
      email,
      phone: "0111223344",
      role: "establishment-tutor",
    };

    const convention = new ConventionDtoBuilder()
      .withEstablishmentTutor(tutor)
      .withEstablishmentRepresentative({
        ...tutor,
        role: "establishment-representative",
      })
      .withAgencyId(agency.id)
      .build();

    const getEmailBuilder = db
      .selectFrom("actors")
      .select("email")
      .where("email", "=", email);

    const results1 = await getEmailBuilder.execute();
    expectToEqual(results1, []);

    await conventionRepository.save(convention);

    const results2 = await getEmailBuilder.execute();
    expectToEqual(results2, [{ email }]);
  });

  it("clear convention signatories signedAt", async () => {
    const conventionId: ConventionId = "aaaaac99-9c0b-1aaa-aa6d-6bb9bd38aaaa";
    const conventionBuilder = conventionStylisteBuilder
      .withId(conventionId)
      .withBeneficiaryRepresentative({
        phone: "+33611221122",
        firstName: "John",
        lastName: "Doe",
        email: "john@email.com",
        role: "beneficiary-representative",
        signedAt: new Date().toISOString(),
      })
      .withStatus("PARTIALLY_SIGNED")
      .signedByBeneficiary("2024-02-02")
      .signedByEstablishmentRepresentative("2024-02-03");

    await conventionRepository.save(conventionBuilder.build());

    const updatedConvention = conventionBuilder
      .withStatus("READY_TO_SIGN")
      .notSigned();

    await conventionRepository.update(updatedConvention.build());

    const conventionInDB = await conventionRepository.getById(conventionId);

    expect(conventionInDB?.signatories.beneficiary.signedAt).toBeUndefined();
    expect(
      conventionInDB?.signatories.beneficiaryRepresentative?.signedAt,
    ).toBeUndefined();
    expect(
      conventionInDB?.signatories.establishmentRepresentative.signedAt,
    ).toBeUndefined();
  });

  it("Retrieves federated identity if exists", async () => {
    const ftConnectId: FtConnectToken = "bbbbac99-9c0b-bbbb-bb6d-6bb9bd38bbbb";
    const convention = conventionStylisteBuilder
      .withFederatedIdentity({
        provider: "peConnect",
        token: ftConnectId,
        payload: {
          advisor: {
            email: "john@mail.com",
            firstName: "John",
            lastName: "Doe",
            type: "PLACEMENT",
          },
        },
      })
      .build();

    await db
      .insertInto("partners_pe_connect")
      .values({
        user_pe_external_id: ftConnectId,
        convention_id: convention.id,
        email: "john@mail.com",
        firstname: "John",
        lastname: "Doe",
        type: "PLACEMENT",
      })
      .execute();

    await conventionRepository.save(convention, anyConventionUpdatedAt);

    expectToEqual(
      await conventionRepository.getById(convention.id),
      convention,
    );
  });

  it("Updates an already saved immersion", async () => {
    const idA: ConventionId = "aaaaac99-9c0b-1aaa-aa6d-6bb9bd38aaaa";
    const convention = conventionStylisteBuilder
      .withId(idA)
      .withStatus("ACCEPTED_BY_VALIDATOR")
      .withEstablishmentNumberOfEmployeesRange("20-49")
      .build();
    await conventionRepository.save(convention);

    const updatedConvention = conventionStylisteBuilder
      .withId(idA)
      .withStatus("CANCELLED")
      .withBeneficiaryEmail("some.updated@email.com")
      .withStatusJustification("some justification")
      .withDateStart(new Date("2024-10-20").toISOString())
      .withDateEnd(new Date("2024-10-24").toISOString())
      .withEstablishmentNumberOfEmployeesRange("200-249")
      .build();

    await conventionRepository.update(
      updatedConvention,
      anyConventionUpdatedAt,
    );

    expect(await conventionRepository.getById(idA)).toEqual(updatedConvention);
  });

  it("Adds a new convention with a beneficiary representative", async () => {
    const convention = conventionStylisteBuilder
      .withId("aaaaac99-9c0b-1bbb-bb6d-6bb9bd38aaaa")
      .withBeneficiaryRepresentative(beneficiaryRepresentative)
      .build();

    await conventionRepository.save(convention, anyConventionUpdatedAt);

    expect(await conventionRepository.getById(convention.id)).toEqual(
      convention,
    );
  });

  describe("Update convention", () => {
    it("Update convention with different tutor and establishment rep", async () => {
      const tutor: EstablishmentTutor = {
        firstName: "Joe",
        lastName: "Doe",
        job: "Tutor",
        email: "tutor123w@mail.com",
        phone: "0111223344",
        role: "establishment-tutor",
      };

      const conventionId = "40400404-0000-0000-0000-6bb9bd38bbbb";

      const conventionWithSameTutorAndRep = new ConventionDtoBuilder()
        .withId(conventionId)
        .withEstablishmentTutor(tutor)
        .withEstablishmentRepresentative({
          ...tutor,
          role: "establishment-representative",
        })
        .withAgencyId(agency.id)
        .build();

      const conventionWithDiffTutorAndRep = new ConventionDtoBuilder(
        conventionWithSameTutorAndRep,
      )
        .withEstablishmentRepresentative({
          role: "establishment-representative",
          firstName: "Rep",
          lastName: "Rep",
          email: "Rep@rep.com",
          phone: "rep",
        })
        .build();

      //SAVE CONVENTION WITH SAME TUTOR & REP
      await conventionRepository.save(conventionWithSameTutorAndRep);
      await expectTutorAndRepToHaveSameId(conventionId);

      //UPDATE CONVENTION WITH DIFFERENT TUTOR & REP"
      await conventionRepository.update(conventionWithDiffTutorAndRep);
      await expectTutorAndRepToHaveDifferentIds(conventionId);

      //UPDATE CONVENTION WITH SAME TUTOR & REP
      await conventionRepository.update(conventionWithSameTutorAndRep);
      await expectTutorAndRepToHaveSameId(conventionId);
    });

    it("Update convention with beneficiary current employer", async () => {
      const beneficiaryCurrentEmployer: BeneficiaryCurrentEmployer = {
        firstName: "Current",
        lastName: "Employer",
        email: "current.employer@mail.com",
        phone: "+33111223344",
        role: "beneficiary-current-employer",
        businessName: "Entreprise .Inc",
        businessSiret: "01234567891234",
        job: "Boss",
        businessAddress: "Rue des Bouchers 67065 Strasbourg",
      };

      const conventionId = "40400404-0000-0000-0000-6bb9bd38aaaa";

      const conventionWithoutBeneficiaryCurrentEmployer =
        new ConventionDtoBuilder()
          .withId(conventionId)
          .withAgencyId(agency.id)
          .build();

      const conventionWithBeneficiaryCurrentEmployer = new ConventionDtoBuilder(
        conventionWithoutBeneficiaryCurrentEmployer,
      )
        .withBeneficiaryCurrentEmployer(beneficiaryCurrentEmployer)
        .build();

      //SAVE CONVENTION WITHOUT BENEFICIARY CURRENT EMPLOYER
      await conventionRepository.save(
        conventionWithoutBeneficiaryCurrentEmployer,
      );

      await expectConventionHaveBeneficiaryCurrentEmployer(
        conventionRepository,
        conventionId,
        undefined,
      );

      //SAVE CONVENTION WITH BENEFICIARY CURRENT EMPLOYER
      await conventionRepository.update(
        conventionWithBeneficiaryCurrentEmployer,
      );

      await expectConventionHaveBeneficiaryCurrentEmployer(
        conventionRepository,
        conventionId,
        beneficiaryCurrentEmployer,
      );

      //SAVE CONVENTION WITH BENEFICIARY CURRENT EMPLOYER UPDATED
      const newBeneficiaryCurrentEmployer: BeneficiaryCurrentEmployer = {
        businessName: "NEW EMPLOYER .INC",
        businessSiret: "00112233445566",
        email: "boss@employer.com",
        firstName: "NEW",
        lastName: "BOSS",
        job: "Boss",
        phone: "+33112233445",
        role: "beneficiary-current-employer",
        businessAddress: "Rue des Bouchers 67065 Strasbourg",
      };

      await conventionRepository.update(
        new ConventionDtoBuilder(conventionWithBeneficiaryCurrentEmployer)
          .withBeneficiaryCurrentEmployer(newBeneficiaryCurrentEmployer)
          .build(),
      );

      await expectConventionHaveBeneficiaryCurrentEmployer(
        conventionRepository,
        conventionId,
        newBeneficiaryCurrentEmployer,
      );

      //SAVE CONVENTION WITHOUT BENEFICIARY CURRENT EMPLOYER
      await conventionRepository.update(
        conventionWithoutBeneficiaryCurrentEmployer,
      );

      await expectConventionHaveBeneficiaryCurrentEmployer(
        conventionRepository,
        conventionId,
        undefined,
      );
    });

    it("Update convention with validator", async () => {
      const conventionId: ConventionId = "aaaaac99-9c0b-1aaa-aa6d-6bb9bd38aaaa";
      const convention = conventionStylisteBuilder
        .withId(conventionId)
        .withStatus("ACCEPTED_BY_COUNSELLOR")
        .build();
      await conventionRepository.save(convention);

      const updatedConvention = conventionStylisteBuilder
        .withId(conventionId)
        .withStatus("ACCEPTED_BY_COUNSELLOR")
        .withValidator({ firstname: "John", lastname: "Doe" })
        .withCounsellor({ firstname: "Billy", lastname: "Idol" })
        .withBeneficiaryEmail("some.updated@email.com")
        .withStatusJustification("some justification")
        .withDateStart(new Date("2024-10-20").toISOString())
        .withDateEnd(new Date("2024-10-24").toISOString())
        .build();

      await conventionRepository.update(
        updatedConvention,
        anyConventionUpdatedAt,
      );

      expect(await conventionRepository.getById(conventionId)).toEqual(
        updatedConvention,
      );
    });

    it("Updates the establisment representative", async () => {
      const commonFields = {
        firstName: "Rep",
        lastName: "Rep",
        email: "rep@rep.com",
        phone: "+33584548754",
      };

      const tutor: EstablishmentTutor = {
        ...commonFields,
        role: "establishment-tutor",
        job: "Super tutor",
      };

      const establishmentRepresentative: EstablishmentRepresentative = {
        ...commonFields,
        role: "establishment-representative",
      };

      const signedDate = new Date().toISOString();

      const convention = new ConventionDtoBuilder()
        .withEstablishmentTutor(tutor)
        .withEstablishmentRepresentative(establishmentRepresentative)
        .withAgencyId(agency.id)
        .notSigned()
        .build();

      await conventionRepository.save(convention);

      const updatedConvention: ConventionDto = new ConventionDtoBuilder(
        convention,
      )
        .withEstablishmentRepresentative({
          ...establishmentRepresentative,
          signedAt: signedDate,
        })
        .build();

      await conventionRepository.update(updatedConvention);
      const updatedConventionStored = await conventionRepository.getById(
        updatedConvention.id,
      );
      expectToEqual(
        updatedConventionStored?.signatories.establishmentRepresentative,
        updatedConvention.signatories.establishmentRepresentative,
      );
      await expectTutorAndRepToHaveSameId(updatedConvention.id);

      const toDraftConvention: ConventionDto = new ConventionDtoBuilder(
        convention,
      )
        .withEstablishmentRepresentative(establishmentRepresentative)
        .build();

      await conventionRepository.update(toDraftConvention);
      const toDraftConventionStored = await conventionRepository.getById(
        toDraftConvention.id,
      );
      expectToEqual(
        toDraftConventionStored?.signatories.establishmentRepresentative,
        toDraftConvention.signatories.establishmentRepresentative,
      );
    });

    it("Update the tutor", async () => {
      const tutor: EstablishmentTutor = {
        firstName: "Joe",
        lastName: "Doe",
        job: "Tutor",
        email: "tutor123w@mail.com",
        phone: "0111223344",
        role: "establishment-tutor",
      };

      const conventionId = "40400404-0000-0000-0000-6bb9bd38bbbb";

      const convention = new ConventionDtoBuilder()
        .withId(conventionId)
        .withEstablishmentTutor(tutor)
        .withAgencyId(agency.id)
        .build();

      const updatedConvention = new ConventionDtoBuilder(convention)
        .withEstablishmentTutor({
          firstName: "updated-Joe",
          lastName: "updated-Doe",
          job: "updated-Job",
          email: "updated-tutor123w@mail.com",
          phone: "+33555600765",
          role: "establishment-tutor",
        })
        .build();
      await conventionRepository.save(convention);

      await conventionRepository.update(updatedConvention);
      const updatedConventionStored = await conventionRepository.getById(
        updatedConvention.id,
      );
      expectToEqual(
        updatedConventionStored?.establishmentTutor,
        updatedConvention.establishmentTutor,
      );
    });

    it("Updates an already saved immersion with a beneficiary representative", async () => {
      const idA: ConventionId = "aaaaac99-9c0b-1aaa-aa6d-6bb9bd38aaaa";
      const convention = conventionStylisteBuilder
        .withId(idA)
        .withBeneficiaryRepresentative(beneficiaryRepresentative)
        .build();
      await conventionRepository.save(convention, anyConventionUpdatedAt);

      const updatedConvention = conventionStylisteBuilder
        .withId(idA)
        .withStatus("ACCEPTED_BY_VALIDATOR")
        .withBeneficiaryEmail("some.updated@email.com")
        .withBeneficiaryRepresentative({
          ...beneficiaryRepresentative,
          email: "some@new-representative.com",
        })
        .signedByBeneficiary(new Date().toISOString())
        .signedByEstablishmentRepresentative(new Date().toISOString())
        .signedByBeneficiaryRepresentative(new Date().toISOString())
        .withDateStart(new Date("2024-10-20").toISOString())
        .withDateEnd(new Date("2024-10-24").toISOString())
        .build();

      await conventionRepository.update(
        updatedConvention,
        anyConventionUpdatedAt,
      );

      expect(await conventionRepository.getById(idA)).toEqual(
        updatedConvention,
      );
    });

    it("Updates an already saved immersion if the beneficiary representative is removed", async () => {
      const idA: ConventionId = "aaaaac99-9c0b-1aaa-aa6d-6bb9bd38aaaa";
      const convention = conventionStylisteBuilder
        .withId(idA)
        .withBeneficiaryRepresentative(beneficiaryRepresentative)
        .build();
      await conventionRepository.save(convention, anyConventionUpdatedAt);

      const updatedConvention = conventionStylisteBuilder
        .withId(idA)
        .withBeneficiaryRepresentative(undefined)
        .build();

      await conventionRepository.update(
        updatedConvention,
        anyConventionUpdatedAt,
      );

      expect(await conventionRepository.getById(idA)).toEqual(
        updatedConvention,
      );
    });

    it("Updates the agency referent firstname and lastname of an already saved immersion", async () => {
      const idA: ConventionId = "aaaaac99-9c0b-1aaa-aa6d-6bb9bd38aaaa";
      const convention = conventionStylisteBuilder
        .withId(idA)
        .withBeneficiaryRepresentative(beneficiaryRepresentative)
        .build();
      await conventionRepository.save(convention, anyConventionUpdatedAt);

      const updatedConvention = conventionStylisteBuilder
        .withId(idA)
        .withAgencyReferentFirstName("New")
        .withAgencyReferentLastName("REFERENT")
        .build();

      await conventionRepository.update(
        updatedConvention,
        anyConventionUpdatedAt,
      );

      expect(await conventionRepository.getById(idA)).toEqual(
        updatedConvention,
      );
    });

    it("Clears the agency referent firstname and lastname of an already saved immersion", async () => {
      const idA: ConventionId = "aaaaac99-9c0b-1aaa-aa6d-6bb9bd38aaaa";
      const convention = conventionStylisteBuilder
        .withId(idA)
        .withBeneficiaryRepresentative(beneficiaryRepresentative)
        .build();
      await conventionRepository.save(convention, anyConventionUpdatedAt);

      const updatedConvention = new ConventionDtoBuilder()
        .withImmersionAppellation(styliste)
        .withUpdatedAt(anyConventionUpdatedAt)
        .withAgencyId(agency.id)
        .withId(idA)
        .build();

      await conventionRepository.update(
        updatedConvention,
        anyConventionUpdatedAt,
      );

      expect(await conventionRepository.getById(idA)).toEqual(
        updatedConvention,
      );
    });

    it("Updates an already saved immersion without beneficiary representative with a beneficiary representative", async () => {
      const idA: ConventionId = "aaaaac99-9c0b-1aaa-aa6d-6bb9bd38aaaa";
      const convention = conventionStylisteBuilder.withId(idA).build();
      await conventionRepository.save(convention, anyConventionUpdatedAt);

      const updatedConvention = conventionStylisteBuilder
        .withId(idA)
        .withBeneficiaryRepresentative(beneficiaryRepresentative)
        .build();

      await conventionRepository.update(
        updatedConvention,
        anyConventionUpdatedAt,
      );

      expect(await conventionRepository.getById(idA)).toEqual(
        updatedConvention,
      );
    });

    it("Update convention with dateApproval and drops it when undefined", async () => {
      const conventionId: ConventionId = "aaaaac99-9c0b-1aaa-aa6d-6bb9bd38aaaa";
      const convention = conventionStylisteBuilder
        .withId(conventionId)
        .withStatus("IN_REVIEW")
        .build();
      await conventionRepository.save(convention, anyConventionUpdatedAt);

      const updatedConvention = conventionStylisteBuilder
        .withId(conventionId)
        .withStatus("ACCEPTED_BY_COUNSELLOR")
        .withDateStart(new Date("2024-10-20").toISOString())
        .withDateEnd(new Date("2024-10-24").toISOString())
        .withDateApproval(new Date("2024-10-15").toISOString())
        .build();

      await conventionRepository.update(
        updatedConvention,
        anyConventionUpdatedAt,
      );

      expect(await conventionRepository.getById(conventionId)).toEqual(
        updatedConvention,
      );

      const conventionBackToReadyToSign: ConventionDto = {
        ...updatedConvention,
        status: "READY_TO_SIGN",
        dateApproval: undefined,
      };

      await conventionRepository.update(
        conventionBackToReadyToSign,
        anyConventionUpdatedAt,
      );

      expectToEqual(
        await conventionRepository.getById(conventionId),
        conventionBackToReadyToSign,
      );
    });
  });

  describe("deprecateConventionsWithoutDefinitiveStatusEndedSince", () => {
    it("changes status of convention with date end before given date to deprecated with justification", async () => {
      const dateSince = new Date("2023-08-30");

      const conventionBuilderWithDateInRange = conventionStylisteBuilder
        .withDateStart(subDays(dateSince, 3).toISOString())
        .withDateEnd(subDays(dateSince, 1).toISOString())
        .withSchedule(reasonableSchedule);

      const convention1ToMarkAsDeprecated = conventionBuilderWithDateInRange
        .withId("11111111-1111-4111-1111-111111111111")
        .withStatus("PARTIALLY_SIGNED")
        .build();

      const convention2ToKeepAsIs = conventionStylisteBuilder
        .withId("22221111-1111-4111-1111-111111112222")
        .withDateStart(subDays(dateSince, 2).toISOString())
        .withDateEnd(addDays(dateSince, 1).toISOString())
        .withSchedule(reasonableSchedule)
        .withStatus("PARTIALLY_SIGNED")
        .build();

      const convention3ToKeepAsIs = conventionBuilderWithDateInRange
        .withId("33331111-1111-4111-1111-111111113333")
        .withStatus("ACCEPTED_BY_VALIDATOR")

        .build();

      const convention4ToKeepAsIs = conventionBuilderWithDateInRange
        .withId("44441111-1111-4111-1111-111111114444")
        .withStatus("CANCELLED")
        .build();

      const convention5ToKeepAsIs = conventionBuilderWithDateInRange
        .withId("55551111-1111-4111-1111-111111115555")
        .withStatus("REJECTED")
        .build();

      const convention6ToKeepAsIs = conventionBuilderWithDateInRange
        .withId("66661111-1111-4111-1111-111111116666")
        .withStatus("DEPRECATED")
        .build();

      const convention7ToMarkAsDeprecated = conventionBuilderWithDateInRange
        .withId("77771111-1111-4111-1111-111111117777")
        .withStatus("ACCEPTED_BY_COUNSELLOR")
        .build();

      const convention8ToMarkAsDeprecated = conventionBuilderWithDateInRange
        .withId("88881111-1111-4111-1111-111111118888")
        .withStatus("IN_REVIEW")
        .build();

      const convention9ToMarkAsDeprecated = conventionBuilderWithDateInRange
        .withId("99991111-1111-4111-1111-111111119999")
        .withStatus("READY_TO_SIGN")
        .build();

      await Promise.all([
        conventionRepository.save(
          convention1ToMarkAsDeprecated,
          anyConventionUpdatedAt,
        ),
        conventionRepository.save(
          convention2ToKeepAsIs,
          anyConventionUpdatedAt,
        ),
        conventionRepository.save(
          convention3ToKeepAsIs,
          anyConventionUpdatedAt,
        ),
        conventionRepository.save(
          convention4ToKeepAsIs,
          anyConventionUpdatedAt,
        ),
        conventionRepository.save(
          convention5ToKeepAsIs,
          anyConventionUpdatedAt,
        ),
        conventionRepository.save(
          convention6ToKeepAsIs,
          anyConventionUpdatedAt,
        ),
        conventionRepository.save(
          convention7ToMarkAsDeprecated,
          anyConventionUpdatedAt,
        ),
        conventionRepository.save(
          convention8ToMarkAsDeprecated,
          anyConventionUpdatedAt,
        ),
        conventionRepository.save(
          convention9ToMarkAsDeprecated,
          anyConventionUpdatedAt,
        ),
      ]);

      const numberOfUpdatedConventions =
        await conventionRepository.deprecateConventionsWithoutDefinitiveStatusEndedSince(
          dateSince,
        );

      expectToEqual(numberOfUpdatedConventions, 4);

      await expectConventionInRepoToBeDeprecated(convention1ToMarkAsDeprecated);
      await expectConventionInRepoToBeDeprecated(convention7ToMarkAsDeprecated);
      await expectConventionInRepoToBeDeprecated(convention8ToMarkAsDeprecated);
      await expectConventionInRepoToBeDeprecated(convention9ToMarkAsDeprecated);
      await expectConventionInRepoToEqual(convention2ToKeepAsIs);
      await expectConventionInRepoToEqual(convention3ToKeepAsIs);
      await expectConventionInRepoToEqual(convention4ToKeepAsIs);
      await expectConventionInRepoToEqual(convention5ToKeepAsIs);
      await expectConventionInRepoToEqual(convention6ToKeepAsIs);
    });
  });

  describe("getIdsByEstablishmentRepresentativeEmail", () => {
    it("Match convention with email", async () => {
      const email = "mail@mail.com";
      const convention = new ConventionDtoBuilder()
        .withEstablishmentRepresentativeEmail(email)
        .withAgencyId(agency.id)
        .withUpdatedAt(anyConventionUpdatedAt)
        .build();
      await conventionRepository.save(convention, anyConventionUpdatedAt);

      const result =
        await conventionRepository.getIdsByEstablishmentRepresentativeEmail(
          email,
        );

      expectToEqual(result, [convention.id]);
    });

    it("Without convention with email", async () => {
      const email = "mail@mail.com";
      const conventionWithoutEmail = new ConventionDtoBuilder()
        .withEstablishmentRepresentativeEmail("notEmail@emauil.ciom")
        .withAgencyId(agency.id)
        .withUpdatedAt(anyConventionUpdatedAt)
        .build();
      await conventionRepository.save(
        conventionWithoutEmail,
        anyConventionUpdatedAt,
      );

      const result =
        await conventionRepository.getIdsByEstablishmentRepresentativeEmail(
          email,
        );

      expectToEqual(result, []);
    });
  });

  describe("getIdsValidatedByEndDateAround", () => {
    it("retrieve validated convention ids when endDate match", async () => {
      const now = timeGateway.now();
      const convention = new ConventionDtoBuilder()
        .withStatus("ACCEPTED_BY_VALIDATOR")
        .withDateEnd(now.toISOString())
        .withAgencyId(agency.id)
        .withUpdatedAt(anyConventionUpdatedAt)
        .build();
      await conventionRepository.save(convention, anyConventionUpdatedAt);

      const result =
        await conventionRepository.getIdsValidatedByEndDateAround(now);

      expectToEqual(result, [convention.id]);
    });

    it("retrieve nothing when endDate does not match", async () => {
      const now = timeGateway.now();
      const convention = new ConventionDtoBuilder()
        .withDateEnd(now.toISOString())
        .withAgencyId(agency.id)
        .withUpdatedAt(anyConventionUpdatedAt)
        .build();
      await conventionRepository.save(convention, anyConventionUpdatedAt);

      const result = await conventionRepository.getIdsValidatedByEndDateAround(
        addDays(now, 2),
      );

      expectToEqual(result, []);
    });
  });

  describe("getIdsByEstablishmentTutorEmail", () => {
    it("retrieve convention id when tutor email match", async () => {
      const email = "mail@mail.com";
      const convention = new ConventionDtoBuilder()
        .withEstablishmentTutorEmail(email)
        .withAgencyId(agency.id)
        .withUpdatedAt(anyConventionUpdatedAt)
        .build();
      await conventionRepository.save(convention, anyConventionUpdatedAt);

      const result =
        await conventionRepository.getIdsByEstablishmentTutorEmail(email);

      expectToEqual(result, [convention.id]);
    });

    it("Doesn't retrieve convention when tutor email doesn't match", async () => {
      const email = "mail@mail.com";
      const conventionWithoutEmail = new ConventionDtoBuilder()
        .withEstablishmentTutorEmail("notEmail@emauil.ciom")
        .withAgencyId(agency.id)
        .withUpdatedAt(anyConventionUpdatedAt)
        .build();
      await conventionRepository.save(
        conventionWithoutEmail,
        anyConventionUpdatedAt,
      );

      const result =
        await conventionRepository.getIdsByEstablishmentTutorEmail(email);

      expectToEqual(result, []);
    });
  });

  const expectConventionHaveBeneficiaryCurrentEmployer = async (
    conventionRepository: PgConventionRepository,
    conventionId: ConventionId,
    expectedBeneficiaryCurrentEmployer: BeneficiaryCurrentEmployer | undefined,
  ) => {
    const convention = await conventionRepository.getById(conventionId);
    if (!convention) throw errors.generic.testError("No result");
    expectToEqual(
      convention.signatories.beneficiaryCurrentEmployer,
      expectedBeneficiaryCurrentEmployer,
    );
  };

  const tutorIdAndRepIdFromConventionId = (conventionId: ConventionId) =>
    db
      .selectFrom("conventions")
      .where("id", "=", conventionId)
      .select(["establishment_tutor_id", "establishment_representative_id"])
      .executeTakeFirst();

  const expectTutorAndRepToHaveSameId = async (conventionId: ConventionId) => {
    const result = await tutorIdAndRepIdFromConventionId(conventionId);
    if (!result) throw errors.generic.testError("No result");
    expectToEqual(
      result.establishment_representative_id,
      result.establishment_tutor_id,
    );
  };

  const expectTutorAndRepToHaveDifferentIds = async (
    conventionId: ConventionId,
  ) => {
    const result = await tutorIdAndRepIdFromConventionId(conventionId);
    if (!result) throw errors.generic.testError("No result");
    expect(
      result.establishment_representative_id !== result.establishment_tutor_id,
    ).toBe(true);
  };

  const expectConventionInRepoToEqual = async (convention: ConventionDto) => {
    expectToEqual(
      await conventionRepository.getById(convention.id),
      convention,
    );
  };

  const expectConventionInRepoToBeDeprecated = async (
    convention: ConventionDto,
  ) => {
    expectToEqual(await conventionRepository.getById(convention.id), {
      ...convention,
      status: "DEPRECATED",
      statusJustification: `Devenu obsolète car statut ${convention.status} alors que la date de fin est dépassée depuis longtemps`,
    });
  };
});
