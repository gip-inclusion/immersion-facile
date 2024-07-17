import { Pool, PoolClient } from "pg";
import { expectToEqual } from "shared";
import { makeKyselyDb } from "../../../config/pg/kysely/kyselyUtils";
import { getTestPgPool } from "../../../config/pg/pgUtils";
import { EstablishmentAggregateBuilder } from "../helpers/EstablishmentBuilders";
import { DeletedEstablishmentDto } from "../ports/DeletedEstablishmentRepository";
import { PgDeletedEstablishmentRepository } from "./PgDeletedEstablishmentRepository";

describe("PgDeletedEstablishmentRepository", () => {
  let pgDeletedEstablishmentRepository: PgDeletedEstablishmentRepository;
  let client: PoolClient;
  let pool: Pool;

  beforeAll(async () => {
    pool = getTestPgPool();
    client = await pool.connect();
  });

  beforeEach(async () => {
    await client.query("DELETE FROM establishments_deleted");
    pgDeletedEstablishmentRepository = new PgDeletedEstablishmentRepository(
      makeKyselyDb(pool),
    );
  });

  afterAll(async () => {
    client.release();
    await pool.end();
  });

  it("save", async () => {
    const establishment = new EstablishmentAggregateBuilder().build();
    const deletedEstablishment: DeletedEstablishmentDto = {
      siret: establishment.establishment.siret,
      createdAt: new Date(),
      deletedAt: new Date(),
    };

    expectToEqual(
      (await client.query(getAllDeletedEstablishmentQuery)).rows,
      [],
    );

    await pgDeletedEstablishmentRepository.save(deletedEstablishment);

    expectToEqual((await client.query(getAllDeletedEstablishmentQuery)).rows, [
      {
        siret: deletedEstablishment.siret,
        created_at: deletedEstablishment.createdAt,
        deleted_at: deletedEstablishment.deletedAt,
      },
    ]);

    expectToEqual(
      await pgDeletedEstablishmentRepository.areSiretsDeleted([]),
      {},
    );
    expectToEqual(
      await pgDeletedEstablishmentRepository.areSiretsDeleted([
        deletedEstablishment.siret,
        "not-deleted-siret",
      ]),
      {
        [deletedEstablishment.siret]: true,
        "not-deleted-siret": false,
      },
    );

    const deletedEstablishmentBis: DeletedEstablishmentDto = {
      siret: establishment.establishment.siret,
      createdAt: new Date(),
      deletedAt: new Date(),
    };

    await pgDeletedEstablishmentRepository.save(deletedEstablishmentBis);

    expectToEqual((await client.query(getAllDeletedEstablishmentQuery)).rows, [
      {
        siret: deletedEstablishment.siret,
        created_at: deletedEstablishment.createdAt,
        deleted_at: deletedEstablishment.deletedAt,
      },
      {
        siret: deletedEstablishmentBis.siret,
        created_at: deletedEstablishmentBis.createdAt,
        deleted_at: deletedEstablishmentBis.deletedAt,
      },
    ]);

    expectToEqual(
      await pgDeletedEstablishmentRepository.areSiretsDeleted([
        deletedEstablishment.siret,
      ]),
      {
        [deletedEstablishment.siret]: true,
      },
    );
  });
});

const getAllDeletedEstablishmentQuery = `
  SELECT *
  FROM establishments_deleted
`;
