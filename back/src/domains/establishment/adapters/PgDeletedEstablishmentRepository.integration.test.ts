import type { Pool } from "pg";
import { expectToEqual } from "shared";
import {
  type KyselyDb,
  makeKyselyDb,
} from "../../../config/pg/kysely/kyselyUtils";
import { getTestPgPool } from "../../../config/pg/pgUtils";
import { EstablishmentAggregateBuilder } from "../helpers/EstablishmentBuilders";
import type { DeletedEstablishmentDto } from "../ports/DeletedEstablishmentRepository";
import { PgDeletedEstablishmentRepository } from "./PgDeletedEstablishmentRepository";

describe("PgDeletedEstablishmentRepository", () => {
  let pgDeletedEstablishmentRepository: PgDeletedEstablishmentRepository;
  let pool: Pool;
  let db: KyselyDb;

  beforeAll(async () => {
    pool = getTestPgPool();
    db = makeKyselyDb(pool);
    pgDeletedEstablishmentRepository = new PgDeletedEstablishmentRepository(db);
  });

  beforeEach(async () => {
    await db.deleteFrom("establishments_deleted").execute();
  });

  afterAll(async () => {
    await pool.end();
  });

  it("save", async () => {
    const establishment = new EstablishmentAggregateBuilder()
      .withUserRights([
        {
          role: "establishment-admin",
          job: "osef",
          phone: "0600000000",
          userId: "osef",
        },
      ])
      .build();
    const deletedEstablishment: DeletedEstablishmentDto = {
      siret: establishment.establishment.siret,
      createdAt: new Date(),
      deletedAt: new Date(),
    };

    expectToEqual(await getAllDeletedEstablishmentQuery(db), []);

    await pgDeletedEstablishmentRepository.save(deletedEstablishment);

    expectToEqual(await getAllDeletedEstablishmentQuery(db), [
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

    expectToEqual(await getAllDeletedEstablishmentQuery(db), [
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

const getAllDeletedEstablishmentQuery = (db: KyselyDb) =>
  db.selectFrom("establishments_deleted").selectAll().execute();
