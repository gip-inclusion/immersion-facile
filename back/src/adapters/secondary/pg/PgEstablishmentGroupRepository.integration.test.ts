import { Pool, PoolClient } from "pg";
import { expectPromiseToFailWithError } from "shared";
import { getTestPgPool } from "../../../_testBuilders/getTestPgPool";
import { EstablishmentGroupEntity } from "../../../domain/immersionOffer/entities/EstablishmentGroupEntity";
import { ConflictError } from "../../primary/helpers/httpErrors";
import { PgEstablishmentGroupRepository } from "./PgEstablishmentGroupRepository";

const group: EstablishmentGroupEntity = {
  name: "Carrefour",
  sirets: ["11112222111122", "33334444333344"],
};

describe("PgEstablishmentGroupRepository", () => {
  let pool: Pool;
  let client: PoolClient;
  let pgEstablishmentGroupRepository: PgEstablishmentGroupRepository;

  beforeAll(async () => {
    pool = getTestPgPool();
    client = await pool.connect();
  });

  beforeEach(async () => {
    pgEstablishmentGroupRepository = new PgEstablishmentGroupRepository(client);
    await client.query("DELETE FROM establishment_groups__sirets");
    await client.query("DELETE FROM establishment_groups");
  });

  afterAll(async () => {
    client.release();
    await pool.end();
  });

  it("creates an EstablishmentGroup and the links with sirets", async () => {
    await pgEstablishmentGroupRepository.create(group);
    const groups = await getAllGroups();
    expect(groups).toMatchObject([{ name: "Carrefour" }]);

    const groupSirets = await getAllGroupsSirets();
    expect(groupSirets).toMatchObject([
      { group_name: "Carrefour", siret: "11112222111122" },
      { group_name: "Carrefour", siret: "33334444333344" },
    ]);
  });

  it("fails with conflict error when a group with the same name already exists", async () => {
    await pgEstablishmentGroupRepository.create(group);
    await expectPromiseToFailWithError(
      pgEstablishmentGroupRepository.create(group),
      new ConflictError(
        "Establishment Group with name 'Carrefour' already exists",
      ),
    );
  });

  const getAllGroups = async () => {
    const { rows } = await client.query(`SELECT * FROM establishment_groups`);
    return rows;
  };

  const getAllGroupsSirets = async () => {
    const { rows } = await client.query(
      `SELECT * FROM establishment_groups__sirets`,
    );
    return rows;
  };
});
