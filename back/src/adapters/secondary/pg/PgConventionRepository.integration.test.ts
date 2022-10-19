import { Pool, PoolClient } from "pg";
import {
  AgencyDtoBuilder,
  BeneficiaryRepresentative,
  ConventionDtoBuilder,
  ConventionId,
  EstablishmentTutor,
} from "shared";
import { getTestPgPool } from "../../../_testBuilders/getTestPgPool";
import { PgAgencyRepository } from "./PgAgencyRepository";
import { PgConventionRepository } from "./PgConventionRepository";

const beneficiaryRepresentative: BeneficiaryRepresentative = {
  role: "legal-representative",
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

  it("Update convention with different tutor and establishment rep", async () => {
    const tutorIdAndRepIdFromConventionId = (conventionId: string) =>
      client.query<{
        establishment_tutor_id: number;
        establishment_representative_id: number;
      }>(
        `SELECT establishment_tutor_id,establishment_representative_id  FROM conventions WHERE id = '${conventionId}'`,
      );
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
    const result1 = await tutorIdAndRepIdFromConventionId(conventionId);
    expect(
      result1.rows[0].establishment_representative_id ===
        result1.rows[0].establishment_tutor_id,
    ).toBeTruthy();

    //UPDATE CONVENTION WITH DIFFERENT TUTOR & REP"
    await conventionRepository.update(conventionWithDiffTutorAndRep);
    const result2 = await tutorIdAndRepIdFromConventionId(conventionId);
    expect(
      result2.rows[0].establishment_representative_id ===
        result2.rows[0].establishment_tutor_id,
    ).toBeFalsy();

    //UPDATE CONVENTION WITH SAME TUTOR & REP
    await conventionRepository.update(conventionWithSameTutorAndRep);
    const result3 = await tutorIdAndRepIdFromConventionId(conventionId);
    expect(
      result3.rows[0].establishment_representative_id ===
        result3.rows[0].establishment_tutor_id,
    ).toBeTruthy();
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
});
