import { Pool, PoolClient } from "pg";
import { FormEstablishmentDtoBuilder } from "../../_testBuilders/FormEstablishmentDtoBuilder";
import { PgFormEstablishmentRepository } from "../../adapters/secondary/pg/PgFormEstablishmentRepository";
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

  afterAll(async () => {
    client.release();
    await pool.end();
  });

  it("Adds a new FormEstablishment", async () => {
    const formEstablishment = FormEstablishmentDtoBuilder.valid()
      .withSiret("88888888888888")
      .build();

    await formEstablishmentRepository.save(formEstablishment);

    const result = await client.query("SELECT * FROM form_establishments");

    expect(formEstablishmentRepository.pgToEntity(result.rows[0])).toEqual(
      formEstablishment,
    );
  });

  it("Gets saved Form Establishment", async () => {
    const siretA = "11111111111111";
    const formEstablishmentA = FormEstablishmentDtoBuilder.valid()
      .withSiret(siretA)
      .build();

    const siretB = "22222222222222";
    const formEstablishmentB = FormEstablishmentDtoBuilder.valid()
      .withSiret(siretB)
      .build();

    await formEstablishmentRepository.save(formEstablishmentA);
    await formEstablishmentRepository.save(formEstablishmentB);

    const resultA = await formEstablishmentRepository.getBySiret(siretA);
    expect(resultA).toEqual(formEstablishmentA);

    const resultAll = await formEstablishmentRepository.getAll();
    expect(resultAll).toEqual([formEstablishmentA, formEstablishmentB]);
  });
});
