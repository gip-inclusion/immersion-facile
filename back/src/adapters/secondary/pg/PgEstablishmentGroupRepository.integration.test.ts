import { Pool, PoolClient } from "pg";
import { expectToEqual, SearchImmersionResultDto } from "shared";
import { EstablishmentAggregateBuilder } from "../../../_testBuilders/EstablishmentAggregateBuilder";
import { getTestPgPool } from "../../../_testBuilders/getTestPgPool";
import { EstablishmentGroupEntity } from "../../../domain/immersionOffer/entities/EstablishmentGroupEntity";
import { PgEstablishmentAggregateRepository } from "./PgEstablishmentAggregateRepository";
import { PgEstablishmentGroupRepository } from "./PgEstablishmentGroupRepository";

const group: EstablishmentGroupEntity = {
  slug: "carrefour",
  name: "Carrefour",
  sirets: ["11112222111122", "33334444333344"],
};

describe("PgEstablishmentGroupRepository", () => {
  let pool: Pool;
  let client: PoolClient;
  let pgEstablishmentGroupRepository: PgEstablishmentGroupRepository;
  let pgEstablishmentAggregateRepository: PgEstablishmentAggregateRepository;

  beforeAll(async () => {
    pool = getTestPgPool();
    client = await pool.connect();
  });

  beforeEach(async () => {
    pgEstablishmentGroupRepository = new PgEstablishmentGroupRepository(client);
    pgEstablishmentAggregateRepository = new PgEstablishmentAggregateRepository(
      client,
    );
    await client.query("DELETE FROM establishment_groups__sirets");
    await client.query("DELETE FROM establishment_groups");
  });

  afterAll(async () => {
    client.release();
    await pool.end();
  });

  it("creates an EstablishmentGroup and the links with sirets", async () => {
    await pgEstablishmentGroupRepository.save({
      slug: "l-amie-caline",
      name: "L'amie caline",
      sirets: [],
    });
    await pgEstablishmentGroupRepository.save(group);
    const groups = await getAllGroups();
    expect(groups).toMatchObject([
      { name: "L'amie caline", slug: "l-amie-caline" },
      { name: "Carrefour", slug: "carrefour" },
    ]);

    const groupSirets = await getAllGroupsSirets();
    expect(groupSirets).toMatchObject([
      { group_slug: "carrefour", siret: "11112222111122" },
      { group_slug: "carrefour", siret: "33334444333344" },
    ]);
  });

  it("updates the group when one with the same slug already exists", async () => {
    await pgEstablishmentGroupRepository.save(group);
    const updatedGroup: EstablishmentGroupEntity = {
      slug: group.slug,
      name: group.name,
      sirets: ["55556666555566", "77778888777788"],
    };

    await pgEstablishmentGroupRepository.save(updatedGroup);

    const groups = await getAllGroups();
    const groupSirets = await getAllGroupsSirets();
    expect(groups).toMatchObject([{ name: "Carrefour", slug: "carrefour" }]);
    expect(groupSirets).toMatchObject([
      { group_slug: "carrefour", siret: updatedGroup.sirets[0] },
      { group_slug: "carrefour", siret: updatedGroup.sirets[1] },
    ]);
  });

  it("finds search immersion results by slug", async () => {
    const establishmentAggregate1 = new EstablishmentAggregateBuilder()
      .withEstablishmentSiret(group.sirets[0])
      .build();
    const establishmentAggregate2 = new EstablishmentAggregateBuilder()
      .withEstablishmentSiret(group.sirets[1])
      .build();
    await pgEstablishmentGroupRepository.save(group);
    await pgEstablishmentAggregateRepository.insertEstablishmentAggregates([
      establishmentAggregate1,
      establishmentAggregate2,
    ]);

    const { establishment: establishment1 } = establishmentAggregate1;
    const { establishment: establishment2 } = establishmentAggregate2;

    const searchImmersionResults =
      await pgEstablishmentGroupRepository.findSearchImmersionResultsBySlug(
        group.slug,
      );

    const searchResult1: SearchImmersionResultDto = {
      additionalInformation: "",
      address: establishment1.address,
      appellationLabels: ["Lalal"],
      contactDetails: undefined,
      contactMode: undefined,
      customizedName: "Le nom custom",
      distance_m: 0,
      fitForDisabledWorkers: false,
      naf: "8622B",
      nafLabel: "Activité des médecins spécialistes",
      name: "Le nom",
      numberOfEmployeeRange: "1-2",
      position: establishment1.position,
      rome: "M1808",
      romeLabel: "Médecin généraliste",
      siret: establishment1.siret,
      voluntaryToImmersion: true,
      website: "",
    };

    expectToEqual(searchImmersionResults, [searchResult1]);
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
