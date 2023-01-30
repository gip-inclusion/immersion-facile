import { Pool, PoolClient } from "pg";
import { getTestPgPool } from "../../../_testBuilders/getTestPgPool";
import { EstablishmentGroupEntity } from "../../../domain/immersionOffer/entities/EstablishmentGroupEntity";
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
    await pgEstablishmentGroupRepository.save({
      name: "L'amie caline",
      sirets: [],
    });
    await pgEstablishmentGroupRepository.save(group);
    const groups = await getAllGroups();
    expect(groups).toMatchObject([
      { name: "L'amie caline" },
      { name: "Carrefour" },
    ]);

    const groupSirets = await getAllGroupsSirets();
    expect(groupSirets).toMatchObject([
      { group_name: "Carrefour", siret: "11112222111122" },
      { group_name: "Carrefour", siret: "33334444333344" },
    ]);
  });

  it("updates the group when one with the same name already exists", async () => {
    await pgEstablishmentGroupRepository.save(group);
    const updatedGroup: EstablishmentGroupEntity = {
      name: group.name,
      sirets: ["55556666555566", "77778888777788"],
    };

    await pgEstablishmentGroupRepository.save(updatedGroup);

    const groups = await getAllGroups();
    const groupSirets = await getAllGroupsSirets();
    expect(groups).toMatchObject([{ name: "Carrefour" }]);
    expect(groupSirets).toMatchObject([
      { group_name: "Carrefour", siret: updatedGroup.sirets[0] },
      { group_name: "Carrefour", siret: updatedGroup.sirets[1] },
    ]);
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
