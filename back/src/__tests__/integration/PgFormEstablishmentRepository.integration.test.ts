import { Pool, PoolClient } from "pg";
import { FormEstablishmentDtoBuilder } from "../../_testBuilders/FormEstablishmentDtoBuilder";
import { PgFormEstablishmentRepository } from "../../adapters/secondary/pg/FormEstablishmentRepository";
import { FormEstablishmentId } from "../../shared/FormEstablishmentDto";
import { getTestPgPool } from "../../_testBuilders/getTestPgPool";

describe("PgFormEstablishmentRepository", () => {
  let pool: Pool;
  let client: PoolClient;
  let formEstablishmentRepository: PgFormEstablishmentRepository;

  beforeAll(async () => {
    pool = getTestPgPool();
    client = await pool.connect();
  });

  beforeEach(async () => {
    await client.query("TRUNCATE form_establishments");
    formEstablishmentRepository = new PgFormEstablishmentRepository(client);
  });

  afterAll(() => {
    client.release();
  });

  it("Adds a new FormEstablishment", async () => {
    const formEstablishment = FormEstablishmentDtoBuilder.valid()
      .withId("aaaaac99-9c0b-bbbb-bb6d-6bb9bd38aaaa")
      .build();

    await formEstablishmentRepository.save(formEstablishment);

    const result = await client.query("SELECT * FROM form_establishments");

    expect(formEstablishmentRepository.pgToEntity(result.rows[0])).toEqual(
      formEstablishment,
    );
  });

  it("Gets saved Form Establishment", async () => {
    const idA: FormEstablishmentId = "aaaaac99-9c0b-aaaa-aa6d-6bb9bd38aaaa";
    const formEstablishmentA = FormEstablishmentDtoBuilder.valid()
      .withId(idA)
      .build();

    const idB: FormEstablishmentId = "bbbbbc99-9c0b-bbbb-bb6d-6bb9bd38bbbb";
    const formEstablishmentB = FormEstablishmentDtoBuilder.valid()
      .withId(idB)
      .build();

    await formEstablishmentRepository.save(formEstablishmentA);
    await formEstablishmentRepository.save(formEstablishmentB);

    const resultA = await formEstablishmentRepository.getById(idA);
    expect(resultA).toEqual(formEstablishmentA);

    const resultAll = await formEstablishmentRepository.getAll();
    expect(resultAll).toEqual([formEstablishmentA, formEstablishmentB]);
  });
});
