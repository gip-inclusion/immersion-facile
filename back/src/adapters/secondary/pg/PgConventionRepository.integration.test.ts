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
  expectToEqual,
} from "shared";
import { getTestPgPool } from "../../../_testBuilders/getTestPgPool";
import { PgAgencyRepository } from "./PgAgencyRepository";
import {
  beneficiaryCurrentEmployerIdColumnName,
  PgConventionRepository,
} from "./PgConventionRepository";

const beneficiaryRepresentative: BeneficiaryRepresentative = {
  role: "beneficiary-representative",
  email: "legal@representative.com",
  firstName: "The",
  lastName: "Representative",
  phone: "1234567",
};

describe("PgConventionRepository", () => {
  let pool: Pool;
  let client: PoolClient;
  let conventionRepository: PgConventionRepository;

  beforeAll(async () => {
    pool = getTestPgPool();
    client = await pool.connect();
    const agencyRepository = new PgAgencyRepository(client);
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
    conventionRepository = new PgConventionRepository(client);
  });

  it("Adds a new convention", async () => {
    const convention = new ConventionDtoBuilder()
      .withId("aaaaac99-9c0b-bbbb-bb6d-6bb9bd38aaaa")
      .build();
    const { externalId, ...createConventionParams } = convention;

    const savedExternalId = await conventionRepository.save(
      createConventionParams,
    );

    expect(await conventionRepository.getById(convention.id)).toEqual({
      ...convention,
      externalId: savedExternalId,
    });
    expect(typeof savedExternalId).toBe("string");
  });

  it("Adds a new convention with field workConditions undefined and no signatories", async () => {
    const convention = new ConventionDtoBuilder()
      .withoutWorkCondition()
      .notSigned()
      .build();

    const externalId = await conventionRepository.save(convention);

    const fetchedConvention = await conventionRepository.getById(convention.id);
    expect(fetchedConvention).toEqual({
      ...convention,
      externalId,
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
      email: "Rep@rep.com",
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

    const updatedConvention: ConventionDto = {
      ...convention,
      signatories: {
        ...convention.signatories,
        establishmentRepresentative: {
          ...establishmentRepresentative,
          signedAt: signedDate,
        },
      },
    };

    await conventionRepository.update(updatedConvention);
    const updatedConventionStored = await conventionRepository.getById(
      updatedConvention.id,
    );
    expectToEqual(
      updatedConventionStored!.signatories.establishmentRepresentative,
      updatedConvention.signatories.establishmentRepresentative,
    );
    await expectTutorAndRepToHaveSameId(updatedConvention.id);
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
    };

    const conventionId = "40400404-0000-0000-0000-6bb9bd38aaaa";

    const conventionWithoutBeneficiaryCurrentEmployer =
      new ConventionDtoBuilder().withId(conventionId).build();

    const conventionWithBeneficiaryCurrentEmployer = new ConventionDtoBuilder(
      conventionWithoutBeneficiaryCurrentEmployer,
    )
      .withBeneficiaryCurentEmployer(beneficiaryCurrentEmployer)
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
    };
    await conventionRepository.update(
      new ConventionDtoBuilder(conventionWithBeneficiaryCurrentEmployer)
        .withBeneficiaryCurentEmployer(newBeneficiaryCurrentEmployer)
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

  it("Retrieves federated identity if exists", async () => {
    const peConnectId = "bbbbac99-9c0b-bbbb-bb6d-6bb9bd38bbbb";
    const convention = new ConventionDtoBuilder()
      .withFederatedIdentity(`peConnect:${peConnectId}`)
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
    const idA: ConventionId = "aaaaac99-9c0b-aaaa-aa6d-6bb9bd38aaaa";
    const convention = new ConventionDtoBuilder().withId(idA).build();
    const externalId = await conventionRepository.save(convention);

    const updatedConvention = new ConventionDtoBuilder()
      .withId(idA)
      .withExternalId(externalId)
      .withStatus("ACCEPTED_BY_VALIDATOR")
      .withBeneficiaryEmail("someUpdated@email.com")
      .withDateEnd(new Date("2021-01-20").toISOString())
      .build();

    await conventionRepository.update(updatedConvention);

    expect(await conventionRepository.getById(idA)).toEqual(updatedConvention);
  });

  it("Adds a new convention with a beneficiary representative", async () => {
    const convention = new ConventionDtoBuilder()
      .withId("aaaaac99-9c0b-bbbb-bb6d-6bb9bd38aaaa")
      .withBeneficiaryRepresentative(beneficiaryRepresentative)
      .build();

    const { externalId, ...createConventionParams } = convention;

    const savedExternalId = await conventionRepository.save(
      createConventionParams,
    );
    expect(await conventionRepository.getById(convention.id)).toEqual({
      ...convention,
      externalId: savedExternalId,
    });
    expect(typeof savedExternalId).toBe("string");
  });

  it("Updates an already saved immersion with a beneficiary representative", async () => {
    const idA: ConventionId = "aaaaac99-9c0b-aaaa-aa6d-6bb9bd38aaaa";
    const convention = new ConventionDtoBuilder()
      .withId(idA)
      .withBeneficiaryRepresentative(beneficiaryRepresentative)
      .build();
    const externalId = await conventionRepository.save(convention);

    const updatedConvention = new ConventionDtoBuilder()
      .withId(idA)
      .withExternalId(externalId)
      .withStatus("ACCEPTED_BY_VALIDATOR")
      .withBeneficiaryEmail("someUpdated@email.com")
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
    const idA: ConventionId = "aaaaac99-9c0b-aaaa-aa6d-6bb9bd38aaaa";
    const convention = new ConventionDtoBuilder()
      .withId(idA)
      .withBeneficiaryRepresentative(beneficiaryRepresentative)
      .build();
    const externalId = await conventionRepository.save(convention);

    const updatedConvention = new ConventionDtoBuilder()
      .withId(idA)
      .withExternalId(externalId)
      .withBeneficiaryRepresentative(undefined)
      .build();

    await conventionRepository.update(updatedConvention);

    expect(await conventionRepository.getById(idA)).toEqual(updatedConvention);
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
      LEFT JOIN conventions ON actors.id = conventions.${beneficiaryCurrentEmployerIdColumnName} 
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
});
