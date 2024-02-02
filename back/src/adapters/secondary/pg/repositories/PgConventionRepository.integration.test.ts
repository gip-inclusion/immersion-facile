import { addDays, subDays } from "date-fns";
import { Pool, PoolClient } from "pg";
import {
  AgencyDtoBuilder,
  BeneficiaryCurrentEmployer,
  BeneficiaryRepresentative,
  ConventionDto,
  ConventionDtoBuilder,
  ConventionId,
  EstablishmentRepresentative,
  EstablishmentTutor,
  expectPromiseToFailWithError,
  expectToEqual,
  reasonableSchedule,
} from "shared";
import { ConflictError } from "../../../primary/helpers/httpErrors";
import { KyselyDb, makeKyselyDb } from "../kysely/kyselyUtils";
import { getTestPgPool } from "../pgUtils";
import { PgAgencyRepository } from "./PgAgencyRepository";
import { PgConventionRepository } from "./PgConventionRepository";

const beneficiaryRepresentative: BeneficiaryRepresentative = {
  role: "beneficiary-representative",
  email: "legal@representative.com",
  firstName: "The",
  lastName: "Representative",
  phone: "1234567",
};

const userPeExternalId = "749dd14f-c82a-48b1-b1bb-fffc5467e4d4";

describe("PgConventionRepository", () => {
  let pool: Pool;
  let client: PoolClient;
  let conventionRepository: PgConventionRepository;
  let transaction: KyselyDb;

  beforeAll(async () => {
    pool = getTestPgPool();
    client = await pool.connect();
    transaction = makeKyselyDb(pool);
    const agencyRepository = new PgAgencyRepository(transaction);
    await agencyRepository.insert(AgencyDtoBuilder.create().build());
  });

  afterAll(async () => {
    client.release();
    await pool.end();
  });

  beforeEach(async () => {
    await client.query("DELETE FROM partners_pe_connect");
    await client.query("DELETE FROM conventions");
    await client.query("DELETE FROM actors");
    await client.query(
      "TRUNCATE TABLE convention_external_ids RESTART IDENTITY;",
    );
    conventionRepository = new PgConventionRepository(transaction);
  });

  it("Adds a new convention", async () => {
    const convention = new ConventionDtoBuilder()
      .withId("aaaaac99-9c0b-1bbb-bb6d-6bb9bd38aaaa")
      .build();

    expect(await conventionRepository.getById(convention.id)).toBeUndefined();

    const savedExternalId = await conventionRepository.save(convention);

    expect(await conventionRepository.getById(convention.id)).toEqual(
      convention,
    );
    expect(savedExternalId).toBeUndefined();
  });

  it("fails to add a convention if it already exits", async () => {
    const convention = new ConventionDtoBuilder()
      .withInternshipKind("immersion")
      .withId("aaaaac99-9c0b-1bbb-bb6d-6bb9bd38aaaa")
      .withDateStart(new Date("2023-01-02").toISOString())
      .withDateEnd(new Date("2023-01-06").toISOString())
      .withSchedule(reasonableSchedule)
      .build();

    await conventionRepository.save(convention);

    await expectPromiseToFailWithError(
      conventionRepository.save(convention),
      new ConflictError(`Convention with id ${convention.id} already exists`),
    );
  });

  it("Adds/Update a new CCI convention", async () => {
    const convention = new ConventionDtoBuilder()
      .withInternshipKind("mini-stage-cci")
      .withId("aaaaac99-9c0b-1bbb-bb6d-6bb9bd38aaaa")
      .withDateStart(new Date("2023-01-02").toISOString())
      .withDateEnd(new Date("2023-01-06").toISOString())
      .withSchedule(reasonableSchedule)
      .build();

    await conventionRepository.save(convention);

    expect(await conventionRepository.getById(convention.id)).toEqual(
      convention,
    );

    const updatedConvention = new ConventionDtoBuilder(convention)
      .withBeneficiaryFirstName("Marvin")
      .build();

    await conventionRepository.update(updatedConvention);
    expect(await conventionRepository.getById(updatedConvention.id)).toEqual(
      updatedConvention,
    );
  });

  it("Adds a new convention with field workConditions undefined and no signatories", async () => {
    const convention = new ConventionDtoBuilder()
      .withoutWorkCondition()
      .notSigned()
      .build();

    await conventionRepository.save(convention);

    const fetchedConvention = await conventionRepository.getById(convention.id);
    expect(fetchedConvention).toEqual(convention);
  });

  it("Adds a convention renewed from another one", async () => {
    const existingConvention = new ConventionDtoBuilder()
      .withStatus("ACCEPTED_BY_VALIDATOR")
      .withId("11111111-1111-4111-1111-111111111111")
      .build();

    await conventionRepository.save(existingConvention);

    const renewedConvention = new ConventionDtoBuilder()
      .withId("22222222-2222-4222-2222-222222222222")
      .withStatus("READY_TO_SIGN")
      .withRenewed({
        from: existingConvention.id,
        justification: "some justification",
      })
      .build();

    await conventionRepository.save(renewedConvention);

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
        phone: "0836656565",
        ...extraFields,
      })
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
        phone: "0836656565",
        ...extraFields,
      })
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
        phone: "0836656565",
        ...extraFields,
      })
      .withFederatedIdentity({
        provider: "peConnect",
        token: userPeExternalId,
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

    await client.query(
      `INSERT INTO partners_pe_connect(user_pe_external_id, convention_id, firstname, lastname, email, type)
      VALUES('${userPeExternalId}', '${convention.id}', 'John', 'Doe', 'john@mail.com', 'PLACEMENT')`,
    );

    await conventionRepository.save(convention);

    const conventionRetreived = await conventionRepository.getById(
      convention.id,
    );

    expect(
      conventionRetreived?.signatories.beneficiary.federatedIdentity,
    ).toStrictEqual({
      provider: "peConnect",
      token: userPeExternalId,
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
        phone: "0836656565",
        ...extraFields,
      })
      .withFederatedIdentity({
        provider: "peConnect",
        token: userPeExternalId,
      })
      .build();

    await client.query(
      `INSERT INTO partners_pe_connect(user_pe_external_id, convention_id, firstname, lastname, email, type)
      VALUES('${userPeExternalId}', '${convention.id}', NULL, NULL, NULL, NULL)`,
    );

    await conventionRepository.save(convention);

    const conventionRetreived = await conventionRepository.getById(
      convention.id,
    );

    expect(
      conventionRetreived?.signatories.beneficiary.federatedIdentity,
    ).toStrictEqual({
      provider: "peConnect",
      token: userPeExternalId,
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
      .build();
    const { rows } = await client.query(
      `SELECT * FROM actors WHERE email = '${email}'`,
    );
    expect(rows).toHaveLength(0);

    await conventionRepository.save(convention);

    const { rows: actors } = await client.query(
      `SELECT * FROM actors WHERE email = '${email}'`,
    );
    expect(actors).toHaveLength(1);
  });

  it("Updates the establisment representative", async () => {
    const commonFields = {
      firstName: "Rep",
      lastName: "Rep",
      email: "rep@rep.com",
      phone: "0584548754",
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
      phone: "8888888888",
      role: "beneficiary-current-employer",
      businessName: "Entreprise .Inc",
      businessSiret: "01234567891234",
      job: "Boss",
      businessAddress: "Rue des Bouchers 67065 Strasbourg",
    };

    const conventionId = "40400404-0000-0000-0000-6bb9bd38aaaa";

    const conventionWithoutBeneficiaryCurrentEmployer =
      new ConventionDtoBuilder().withId(conventionId).build();

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
      conventionId,
      undefined,
    );

    //SAVE CONVENTION WITH BENEFICIARY CURRENT EMPLOYER
    await conventionRepository.update(conventionWithBeneficiaryCurrentEmployer);
    await expectConventionHaveBeneficiaryCurrentEmployer(
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
      phone: "0011223344",
      role: "beneficiary-current-employer",
      businessAddress: "Rue des Bouchers 67065 Strasbourg",
    };
    await conventionRepository.update(
      new ConventionDtoBuilder(conventionWithBeneficiaryCurrentEmployer)
        .withBeneficiaryCurrentEmployer(newBeneficiaryCurrentEmployer)
        .build(),
    );
    await expectConventionHaveBeneficiaryCurrentEmployer(
      conventionId,
      newBeneficiaryCurrentEmployer,
    );

    //SAVE CONVENTION WITHOUT BENEFICIARY CURRENT EMPLOYER
    await conventionRepository.update(
      conventionWithoutBeneficiaryCurrentEmployer,
    );
    await expectConventionHaveBeneficiaryCurrentEmployer(
      conventionId,
      undefined,
    );
  });

  it("Update convention with validator", async () => {
    const conventionId: ConventionId = "aaaaac99-9c0b-1aaa-aa6d-6bb9bd38aaaa";
    const convention = new ConventionDtoBuilder()
      .withId(conventionId)
      .withStatus("ACCEPTED_BY_COUNSELLOR")
      .build();
    await conventionRepository.save(convention);

    const updatedConvention = new ConventionDtoBuilder()
      .withId(conventionId)
      .withStatus("ACCEPTED_BY_COUNSELLOR")
      .withValidator({ firstname: "John", lastname: "Doe" })
      .withBeneficiaryEmail("some.updated@email.com")
      .withStatusJustification("some justification")
      .withDateEnd(new Date("2021-01-20").toISOString())
      .build();

    await conventionRepository.update(updatedConvention);

    expect(await conventionRepository.getById(conventionId)).toEqual(
      updatedConvention,
    );
  });

  it("update convention with dateApproval", async () => {
    const conventionId: ConventionId = "aaaaac99-9c0b-1aaa-aa6d-6bb9bd38aaaa";
    const convention = new ConventionDtoBuilder()
      .withId(conventionId)
      .withStatus("IN_REVIEW")
      .build();
    await conventionRepository.save(convention);

    const updatedConvention = new ConventionDtoBuilder()
      .withId(conventionId)
      .withStatus("ACCEPTED_BY_COUNSELLOR")
      .withDateApproval(new Date("2021-01-05").toISOString())
      .withDateEnd(new Date("2021-01-20").toISOString())
      .build();

    await conventionRepository.update(updatedConvention);

    expect(await conventionRepository.getById(conventionId)).toEqual(
      updatedConvention,
    );
  });

  it("Retrieves federated identity if exists", async () => {
    const peConnectId = "bbbbac99-9c0b-bbbb-bb6d-6bb9bd38bbbb";
    const convention = new ConventionDtoBuilder()
      .withFederatedIdentity({
        provider: "peConnect",
        token: peConnectId,
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

    await client.query(
      `INSERT INTO partners_pe_connect(user_pe_external_id, convention_id, firstname, lastname, email, type)
    VALUES('${peConnectId}', '${convention.id}', 'John', 'Doe', 'john@mail.com', 'PLACEMENT')`,
    );

    const externalId = await conventionRepository.save(convention);

    expect(await conventionRepository.getById(convention.id)).toEqual({
      ...convention,
      externalId,
    });
  });

  it("Updates an already saved immersion", async () => {
    const idA: ConventionId = "aaaaac99-9c0b-1aaa-aa6d-6bb9bd38aaaa";
    const convention = new ConventionDtoBuilder()
      .withId(idA)
      .withStatus("ACCEPTED_BY_VALIDATOR")
      .build();
    await conventionRepository.save(convention);

    const updatedConvention = new ConventionDtoBuilder()
      .withId(idA)
      .withStatus("CANCELLED")
      .withBeneficiaryEmail("some.updated@email.com")
      .withStatusJustification("some justification")
      .withDateEnd(new Date("2021-01-20").toISOString())
      .build();

    await conventionRepository.update(updatedConvention);

    expect(await conventionRepository.getById(idA)).toEqual(updatedConvention);
  });

  it("Adds a new convention with a beneficiary representative", async () => {
    const convention = new ConventionDtoBuilder()
      .withId("aaaaac99-9c0b-1bbb-bb6d-6bb9bd38aaaa")
      .withBeneficiaryRepresentative(beneficiaryRepresentative)
      .build();

    await conventionRepository.save(convention);

    expect(await conventionRepository.getById(convention.id)).toEqual(
      convention,
    );
  });

  it("Updates an already saved immersion with a beneficiary representative", async () => {
    const idA: ConventionId = "aaaaac99-9c0b-1aaa-aa6d-6bb9bd38aaaa";
    const convention = new ConventionDtoBuilder()
      .withId(idA)
      .withBeneficiaryRepresentative(beneficiaryRepresentative)
      .build();
    await conventionRepository.save(convention);

    const updatedConvention = new ConventionDtoBuilder()
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
      .withDateEnd(new Date("2021-01-20").toISOString())
      .build();

    await conventionRepository.update(updatedConvention);

    expect(await conventionRepository.getById(idA)).toEqual(updatedConvention);
  });

  it("Updates an already saved immersion if the beneficiary representative is removed", async () => {
    const idA: ConventionId = "aaaaac99-9c0b-1aaa-aa6d-6bb9bd38aaaa";
    const convention = new ConventionDtoBuilder()
      .withId(idA)
      .withBeneficiaryRepresentative(beneficiaryRepresentative)
      .build();
    await conventionRepository.save(convention);

    const updatedConvention = new ConventionDtoBuilder()
      .withId(idA)
      .withBeneficiaryRepresentative(undefined)
      .build();

    await conventionRepository.update(updatedConvention);

    expect(await conventionRepository.getById(idA)).toEqual(updatedConvention);
  });

  it("Updates an already saved immersion without beneficiary representative with a beneficiary representative", async () => {
    const idA: ConventionId = "aaaaac99-9c0b-1aaa-aa6d-6bb9bd38aaaa";
    const convention = new ConventionDtoBuilder().withId(idA).build();
    await conventionRepository.save(convention);

    const updatedConvention = new ConventionDtoBuilder()
      .withId(idA)
      .withBeneficiaryRepresentative(beneficiaryRepresentative)
      .build();

    await conventionRepository.update(updatedConvention);

    expect(await conventionRepository.getById(idA)).toEqual(updatedConvention);
  });

  describe("deprecateConventionsWithoutDefinitiveStatusEndedSince", () => {
    it("changes status of convention with date end before given date to deprecated with justification", async () => {
      const dateSince = new Date("2023-08-30");

      const conventionBuilderWithDateInRange = new ConventionDtoBuilder()
        .withDateStart(subDays(dateSince, 3).toISOString())
        .withDateEnd(subDays(dateSince, 1).toISOString())
        .withSchedule(reasonableSchedule);

      const convention1ToMarkAsDeprecated = conventionBuilderWithDateInRange
        .withId("11111111-1111-4111-1111-111111111111")
        .withStatus("PARTIALLY_SIGNED")
        .build();

      const convention2ToKeepAsIs = new ConventionDtoBuilder()
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

      const convention10ToMarkAsDeprecated = conventionBuilderWithDateInRange
        .withId("10101111-1111-4111-1111-111111111010")
        .withStatus("DRAFT")
        .build();

      await Promise.all([
        conventionRepository.save(convention1ToMarkAsDeprecated),
        conventionRepository.save(convention2ToKeepAsIs),
        conventionRepository.save(convention3ToKeepAsIs),
        conventionRepository.save(convention4ToKeepAsIs),
        conventionRepository.save(convention5ToKeepAsIs),
        conventionRepository.save(convention6ToKeepAsIs),
        conventionRepository.save(convention7ToMarkAsDeprecated),
        conventionRepository.save(convention8ToMarkAsDeprecated),
        conventionRepository.save(convention9ToMarkAsDeprecated),
        conventionRepository.save(convention10ToMarkAsDeprecated),
      ]);

      const numberOfUpdatedConventions =
        await conventionRepository.deprecateConventionsWithoutDefinitiveStatusEndedSince(
          dateSince,
        );

      expectToEqual(numberOfUpdatedConventions, 5);

      await expectConventionInRepoToBeDeprecated(convention1ToMarkAsDeprecated);
      await expectConventionInRepoToBeDeprecated(convention7ToMarkAsDeprecated);
      await expectConventionInRepoToBeDeprecated(convention8ToMarkAsDeprecated);
      await expectConventionInRepoToBeDeprecated(convention9ToMarkAsDeprecated);
      await expectConventionInRepoToBeDeprecated(
        convention10ToMarkAsDeprecated,
      );

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
        .build();
      await conventionRepository.save(convention);

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
        .build();
      await conventionRepository.save(conventionWithoutEmail);

      const result =
        await conventionRepository.getIdsByEstablishmentRepresentativeEmail(
          email,
        );

      expectToEqual(result, []);
    });
  });

  describe("getIdsByEstablishmentTutorEmail", () => {
    it("retrieve convention id when tutor email match", async () => {
      const email = "mail@mail.com";
      const convention = new ConventionDtoBuilder()
        .withEstablishmentTutorEmail(email)
        .build();
      await conventionRepository.save(convention);

      const result =
        await conventionRepository.getIdsByEstablishmentTutorEmail(email);

      expectToEqual(result, [convention.id]);
    });

    it("Doesn't retrieve convention when tutor email doesn't match", async () => {
      const email = "mail@mail.com";
      const conventionWithoutEmail = new ConventionDtoBuilder()
        .withEstablishmentTutorEmail("notEmail@emauil.ciom")
        .build();
      await conventionRepository.save(conventionWithoutEmail);

      const result =
        await conventionRepository.getIdsByEstablishmentTutorEmail(email);

      expectToEqual(result, []);
    });
  });

  const tutorIdAndRepIdFromConventionId = (conventionId: ConventionId) =>
    client.query<{
      establishment_tutor_id: number;
      establishment_representative_id: number;
    }>(
      `SELECT establishment_tutor_id,establishment_representative_id  FROM conventions WHERE id = '${conventionId}'`,
    );

  const expectTutorAndRepToHaveSameId = async (conventionId: ConventionId) => {
    const { rows } = await tutorIdAndRepIdFromConventionId(conventionId);
    const { establishment_tutor_id, establishment_representative_id } = rows[0];
    expect(establishment_representative_id).toBe(establishment_tutor_id);
  };

  const expectConventionHaveBeneficiaryCurrentEmployer = async (
    conventionId: ConventionId,
    expectedBeneficiaryCurrentEmployer: BeneficiaryCurrentEmployer | undefined,
  ) => {
    const { rows } = await client.query<{
      extra_fields: {
        job: string | null;
        businessSiret: string | null;
        businessName: string | null;
        businessAddress: string | null;
      };
      phone: string | null;
      first_name: string | null;
      last_name: string | null;
      id: number;
      signed_at: string | null;
      role: string;
      email: string | null;
    }>(
      `
      SELECT actors.*
      FROM actors 
      LEFT JOIN conventions ON actors.id = conventions.beneficiary_current_employer_id 
      WHERE conventions.id = '${conventionId}'
      `,
    );
    const result = rows.at(0);
    const beneficiaryCurrentEmployer: BeneficiaryCurrentEmployer | undefined =
      result
        ? {
            firstName: result.first_name !== null ? result.first_name : "",
            lastName: result.last_name !== null ? result.last_name : "",
            role: "beneficiary-current-employer",
            email: result.email !== null ? result.email : "",
            phone: result.phone !== null ? result.phone : "",
            businessName:
              result.extra_fields.businessName !== null
                ? result.extra_fields.businessName
                : "",
            businessAddress:
              result.extra_fields.businessAddress !== null
                ? result.extra_fields.businessAddress
                : "",
            businessSiret:
              result.extra_fields.businessSiret !== null
                ? result.extra_fields.businessSiret
                : "",
            job:
              result.extra_fields.job !== null ? result.extra_fields.job : "",
            signedAt: result.signed_at !== null ? result.signed_at : undefined,
          }
        : undefined;
    expectToEqual(
      beneficiaryCurrentEmployer,
      expectedBeneficiaryCurrentEmployer,
    );
  };

  const expectTutorAndRepToHaveDifferentIds = async (
    conventionId: ConventionId,
  ) => {
    const { rows } = await tutorIdAndRepIdFromConventionId(conventionId);
    const { establishment_tutor_id, establishment_representative_id } = rows[0];
    expect(establishment_representative_id !== establishment_tutor_id).toBe(
      true,
    );
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
