import { Pool, PoolClient } from "pg";
import { PgImmersionOfferRepository } from "../../adapters/secondary/pg/PgImmersionOfferRepository";
import { EstablishmentEntity } from "../../domain/immersionOffer/entities/EstablishmentEntity";
import {
  ImmersionEstablishmentContact,
  ImmersionOfferEntity,
} from "../../domain/immersionOffer/entities/ImmersionOfferEntity";
import { getTestPgPool } from "../../_testBuilders/getTestPgPool";

describe("Postgres implementation of immersion offer repository", () => {
  let pool: Pool;
  let client: PoolClient;
  let pgImmersionOfferRepository: PgImmersionOfferRepository;

  beforeAll(async () => {
    pool = getTestPgPool();
    client = await pool.connect();
  });

  beforeEach(async () => {
    await client.query("TRUNCATE searches_made CASCADE");
    await client.query("TRUNCATE immersion_contacts CASCADE");
    await client.query("TRUNCATE establishments CASCADE");
    await client.query("TRUNCATE immersion_offers CASCADE");
    pgImmersionOfferRepository = new PgImmersionOfferRepository(client);
  });

  afterAll(async () => {
    client.release();
    await pool.end();
  });

  test("Insert search", async () => {
    await populateWithImmersionSearches(pgImmersionOfferRepository);

    expect(
      (
        await pgImmersionOfferRepository.getSearchInDatabase({
          rome: "M1607",
          distance_km: 30,
          lat: 49.119146,
          lon: 6.17602,
        })
      )[0].rome,
    ).toBe("M1607");

    //We empty the searches for the next tests
    await pgImmersionOfferRepository.markPendingResearchesAsProcessedAndRetrieveThem();
  });

  test("Grouping searches close geographically", async () => {
    await populateWithImmersionSearches(pgImmersionOfferRepository);

    //We expect that two of the 6 searches have been grouped by
    expect(
      await pgImmersionOfferRepository.markPendingResearchesAsProcessedAndRetrieveThem(),
    ).toHaveLength(5);

    //We expect then that all searches have been retrieved
    expect(
      await pgImmersionOfferRepository.markPendingResearchesAsProcessedAndRetrieveThem(),
    ).toHaveLength(0);

    //We expect that all searches are not to be searched anymore
    const allSearches = (await pgImmersionOfferRepository.getAllSearches())
      .rows;
    allSearches.map((row) => {
      expect(row.needstobesearched).toBe(false);
    });
  });

  test("Insert immersions and retrieves them back", async () => {
    await pgImmersionOfferRepository.insertEstablishments([
      new EstablishmentEntity({
        id: "13df03a5-a2a5-430a-b558-ed3e2f035443",
        address: "fake address",
        name: "Fake Establishment from la plate forme de l'inclusion",
        voluntaryToImmersion: false,
        score: 5,
        romes: ["M1907"],
        siret: "78000403200029",
        dataSource: "api_labonneboite",
        numberEmployeesRange: 1,
        position: { lat: 10.1, lon: 10.1 },
        naf: "8539A",
      }),
    ]);
    await pgImmersionOfferRepository.insertEstablishments([
      new EstablishmentEntity({
        id: "13df03a5-a2a5-430a-b558-ed3e2f035443",
        address: "fake address",
        name: "Fake Establishment from la plate forme de l'inclusion",
        voluntaryToImmersion: false,
        score: 5,
        romes: ["M1907"],
        siret: "78000403200040",
        dataSource: "api_labonneboite",
        numberEmployeesRange: 1,
        position: { lat: 10.1, lon: 10.1 },
        naf: "8539A",
      }),
    ]);
    await pgImmersionOfferRepository.insertImmersions([
      new ImmersionOfferEntity({
        id: "13df03a5-a2a5-430a-b558-ed3e2f03536d",
        rome: "M1907",
        naf: "8539A",
        siret: "78000403200029",
        name: "Company from la bonne boite for search",
        voluntaryToImmersion: false,
        data_source: "api_labonneboite",
        contactInEstablishment: undefined,
        score: 4.5,
        position: { lat: 35, lon: 50 },
        address: "55 rue de Faubourg Sante Honoré",
      }),
    ]);

    await pgImmersionOfferRepository.insertImmersions([
      new ImmersionOfferEntity({
        id: "13df03a5-a2a5-430a-b558-ed3e2f03556d",
        rome: "M1907",
        naf: "8539A",
        siret: "78000403200040",
        name: "Company from api sirene for search",
        voluntaryToImmersion: false,
        data_source: "api_sirene",
        contactInEstablishment: undefined,
        score: 4.5,
        position: { lat: 35, lon: 50 },
        address: "55 rue de Faubourg Sante Honoré",
      }),
    ]);

    const searchResult = await pgImmersionOfferRepository.getFromSearch({
      rome: "M1907",
      distance_km: 300,
      lat: 34.95,
      lon: 50.1,
      nafDivision: "85",
    });
    expect(searchResult).toHaveLength(2);
    expect(searchResult[0].getName()).toBe(
      "Company from la bonne boite for search",
    );

    const searchResultWithSiret =
      await pgImmersionOfferRepository.getFromSearch({
        rome: "M1907",
        distance_km: 30,
        lat: 34.95,
        lon: 50.1,
        nafDivision: "85",
        siret: "78000403200040",
      });
    expect(searchResultWithSiret).toHaveLength(1);
    expect(searchResultWithSiret[0].getProps().siret).toBe("78000403200040");
  });

  test("Insert immersion does not crash if empty array is provided", async () => {
    await pgImmersionOfferRepository.insertImmersions([]);
  });

  test("Insert establishments & immersions and retrieves them back", async () => {
    await pgImmersionOfferRepository.insertEstablishments([
      new EstablishmentEntity({
        id: "13df03a5-a2a5-430a-b558-ed3e2f035443",
        address: "fake address",
        name: "Fake Establishment from la plate forme de l'inclusion",
        score: 5,
        voluntaryToImmersion: false,
        romes: ["M1607"],
        siret: "78000403200019",
        dataSource: "api_labonneboite",
        numberEmployeesRange: 1,
        position: { lat: 10.1, lon: 10.1 },
        naf: "8539A",
      }),
    ]);
    await pgImmersionOfferRepository.insertEstablishments([
      new EstablishmentEntity({
        id: "13df03a5-a2a5-430a-b558-ed3e2f035443",
        address: "fake address",
        name: "Fake Establishment from form",
        score: 5,
        voluntaryToImmersion: false,
        romes: ["M1607"],
        siret: "78000403200019",
        dataSource: "form",
        numberEmployeesRange: 1,
        position: { lat: 10.1, lon: 10.2 },
        naf: "8539A",
      }),
    ]);
    await pgImmersionOfferRepository.insertEstablishments([
      new EstablishmentEntity({
        id: "13df03a5-a2a5-430a-b558-ed3e2f035443",
        address: "fake address",
        name: "Fake Establishment from la bonne boite",
        voluntaryToImmersion: false,
        score: 5,
        romes: ["M1607"],
        siret: "78000403200019",
        dataSource: "api_labonneboite",
        numberEmployeesRange: 1,
        position: { lat: 10.0, lon: 10.3 },
        naf: "8539A",
      }),
    ]);

    const establishments = await getEstablishmentsFromSiret("78000403200019");
    expect(establishments).toHaveLength(1);
    expect(establishments[0].name).toBe("Fake Establishment from form");

    const contactInEstablishment: ImmersionEstablishmentContact = {
      id: "93144fe8-56a7-4807-8990-726badc6332b",
      name: "Doe",
      firstname: "John",
      email: "joe@mail.com",
      role: "super job",
      siretEstablishment: "78000403200019",
      phone: "0640295453",
    };

    await pgImmersionOfferRepository.insertEstablishmentContact(
      contactInEstablishment,
    );

    await pgImmersionOfferRepository.insertImmersions([
      new ImmersionOfferEntity({
        id: "13df03a5-a2a5-430a-b558-ed3e2f03536d",
        rome: "M1607",
        naf: "8539A",
        siret: "78000403200019",
        name: "Company from form",
        voluntaryToImmersion: false,
        data_source: "form",
        contactInEstablishment,
        score: 4.5,
        position: { lat: 48.8666, lon: 2.3333 },
        address: "55 rue de Faubourg Sante Honoré",
      }),
      new ImmersionOfferEntity({
        id: "13df03a5-a2a5-430a-b558-ed3e2f03536d",
        rome: "M1607",
        naf: "8539A",
        siret: "78000403200019",
        name: "Company from la bonne boite",
        voluntaryToImmersion: false,
        data_source: "api_labonneboite",
        contactInEstablishment: undefined,
        score: 4.5,
        position: { lat: 46.8666, lon: 3.3333 },
        address: "55 rue de Faubourg Sante Honoré",
      }),
    ]);
    await pgImmersionOfferRepository.insertImmersions([
      new ImmersionOfferEntity({
        id: "13df03a5-a2a5-430a-b558-ed3e2f03536d",
        rome: "M1607",
        naf: "8539A",
        siret: "78000403200019",
        name: "Company from la bonne boite",
        voluntaryToImmersion: false,
        data_source: "api_labonneboite",
        contactInEstablishment: undefined,
        score: 4.5,
        position: { lat: 43.8666, lon: 8.3333 },
        address: "55 rue de Faubourg Sante Honoré",
      }),
    ]);

    const immersionOffer =
      await pgImmersionOfferRepository.getImmersionFromUuid(
        "13df03a5-a2a5-430a-b558-ed3e2f03536d",
      );
    expect(immersionOffer).toBeDefined;
    if (immersionOffer) {
      expect(immersionOffer.getName()).toBe("Company from form");
    }
  });

  test("Insert establishment contact", async () => {
    await pgImmersionOfferRepository.insertEstablishments([
      new EstablishmentEntity({
        id: "13df03a5-a2a5-430a-b558-ed3e2f035443",
        address: "fake address",
        name: "Fake Establishment from form",
        score: 5,
        voluntaryToImmersion: false,
        romes: ["M1607"],
        siret: "11112222333344",
        dataSource: "form",
        numberEmployeesRange: 1,
        position: { lat: 10.1, lon: 10.2 },
        naf: "8539A",
      }),
    ]);

    const establishmentContact: ImmersionEstablishmentContact = {
      id: "84007f00-f1fb-4458-a41f-492143ffc8df",
      email: "some@mail.com",
      firstname: "Bob",
      name: "MyName",
      role: "Chauffeur",
      siretEstablishment: "11112222333344",
      phone: "0640295453",
    };

    await pgImmersionOfferRepository.insertEstablishmentContact(
      establishmentContact,
    );

    const { rows } = await client.query("SELECT * FROM immersion_contacts");
    expect(rows).toHaveLength(1);
    expect(rows).toEqual([
      {
        uuid: "84007f00-f1fb-4458-a41f-492143ffc8df",
        name: "MyName",
        firstname: "Bob",
        email: "some@mail.com",
        role: "Chauffeur",
        siret_establishment: "11112222333344",
        phone: "0640295453",
      },
    ]);
  });

  const getEstablishmentsFromSiret = (siret: string) =>
    client
      .query("SELECT * FROM establishments WHERE siret=$1", [siret])
      .then((res) => res.rows);
});

const populateWithImmersionSearches = async (
  pgImmersionOfferRepository: PgImmersionOfferRepository,
) => {
  await pgImmersionOfferRepository.insertSearch({
    rome: "M1607",
    distance_km: 30,
    lat: 49.119146,
    lon: 6.17602,
  });
  await pgImmersionOfferRepository.insertSearch({
    rome: "M1607",
    distance_km: 30,
    lat: 48.119146,
    lon: 6.17602,
  });
  await pgImmersionOfferRepository.insertSearch({
    rome: "M1607",
    distance_km: 30,
    lat: 48.119146,
    lon: 5.17602,
  });
  await pgImmersionOfferRepository.insertSearch({
    rome: "M1607",
    distance_km: 30,
    lat: 48.119146,
    lon: 4.17602,
  });
  await pgImmersionOfferRepository.insertSearch({
    rome: "M1607",
    distance_km: 30,
    lat: 48.129146,
    lon: 4.17602,
  });
  await pgImmersionOfferRepository.insertSearch({
    rome: "M1608",
    distance_km: 30,
    lat: 48.129146,
    lon: 4.17602,
  });
};
