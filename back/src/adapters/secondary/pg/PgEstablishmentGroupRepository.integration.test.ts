import { Pool, PoolClient } from "pg";
import {
  AppellationDto_To_Rename,
  expectToEqual,
  SearchImmersionResultDto,
} from "shared";
import { EstablishmentAggregateBuilder } from "../../../_testBuilders/EstablishmentAggregateBuilder";
import { getTestPgPool } from "../../../_testBuilders/getTestPgPool";
import { ImmersionOfferEntityV2Builder } from "../../../_testBuilders/ImmersionOfferEntityV2Builder";
import { EstablishmentEntity } from "../../../domain/immersionOffer/entities/EstablishmentEntity";
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
    await client.query("DELETE FROM immersion_contacts");
    await client.query("DELETE FROM discussions");
    await client.query("DELETE FROM establishments");
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
    const offerBoulanger = new ImmersionOfferEntityV2Builder()
      .withRomeCode("D1102")
      .withAppellationCode("11574")
      .build();

    const offerAideBoulanger = new ImmersionOfferEntityV2Builder()
      .withRomeCode("D1102")
      .withAppellationCode("10868")
      .build();

    const offerBoucher = new ImmersionOfferEntityV2Builder()
      .withRomeCode("D1101")
      .withAppellationCode("11564")
      .build();

    const offerVendeurEnAlimentationGenerale =
      new ImmersionOfferEntityV2Builder()
        .withRomeCode("D1106")
        .withAppellationCode("20540")
        .build();

    const establishmentAggregate1 = new EstablishmentAggregateBuilder()
      .withEstablishmentSiret(group.sirets[0])
      .withContactId("11111111-1111-4444-1111-111111111111")
      .withImmersionOffers([offerBoulanger, offerAideBoulanger, offerBoucher])
      .build();

    const establishmentAggregate2 = new EstablishmentAggregateBuilder()
      .withEstablishmentSiret(group.sirets[1])
      .withContactId("22222222-2222-4444-2222-222222222222")
      .withImmersionOffers([offerVendeurEnAlimentationGenerale])
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

    const createSearchResult = ({
      establishment,
      rome,
      romeLabel,
      appellations,
    }: {
      establishment: EstablishmentEntity;
      appellations: AppellationDto_To_Rename[];
      rome: string;
      romeLabel: string;
    }): SearchImmersionResultDto => ({
      appellations,
      romeLabel,
      rome,
      additionalInformation: establishment.additionalInformation,
      address: establishment.address,
      contactMode: "EMAIL",
      customizedName: establishment.customizedName,
      distance_m: 0,
      fitForDisabledWorkers: establishment.fitForDisabledWorkers,
      naf: establishment.nafDto.code,
      nafLabel: "Activités des agences de travail temporaire", // matches default naf code : 7820Z
      name: establishment.name,
      numberOfEmployeeRange: establishment.numberEmployeesRange,
      position: establishment.position,
      siret: establishment.siret,
      voluntaryToImmersion: establishment.voluntaryToImmersion,
      website: establishment.website,
    });

    expectToEqual(searchImmersionResults, [
      createSearchResult({
        establishment: establishment1,
        rome: "D1101",
        romeLabel: "Boucherie",
        appellations: [
          { appellationLabel: "Boucher / Bouchère", appellationCode: "11564" },
        ],
      }),
      createSearchResult({
        establishment: establishment1,
        rome: "D1102",
        romeLabel: "Boulangerie - viennoiserie",
        appellations: [
          {
            appellationLabel: "Boulanger-pâtissier / Boulangère-pâtissière",
            appellationCode: "11574",
          },
          {
            appellationLabel: "Aide-boulanger / Aide-boulangère",
            appellationCode: "10868",
          },
        ],
      }),
      createSearchResult({
        establishment: establishment2,
        rome: "D1106",
        romeLabel: "Vente en alimentation",
        appellations: [
          {
            appellationLabel: "Vendeur / Vendeuse en alimentation générale",
            appellationCode: "20540",
          },
        ],
      }),
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
