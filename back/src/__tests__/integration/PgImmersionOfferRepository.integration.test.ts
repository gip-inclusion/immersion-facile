import { Pool, PoolClient } from "pg";
import { EstablishmentEntityBuilder } from "../../_testBuilders/EstablishmentEntityBuilder";
import { PgImmersionOfferRepository } from "../../adapters/secondary/pg/PgImmersionOfferRepository";
import { EstablishmentEntity } from "../../domain/immersionOffer/entities/EstablishmentEntity";
import {
  ImmersionEstablishmentContact,
  ImmersionOfferEntity,
} from "../../domain/immersionOffer/entities/ImmersionOfferEntity";
import { getTestPgPool } from "../../_testBuilders/getTestPgPool";
import {
  SearchContact,
  SearchImmersionResultDto,
} from "../../shared/SearchImmersionDto";

describe("Postgres implementation of immersion offer repository", () => {
  let pool: Pool;
  let client: PoolClient;
  let pgImmersionOfferRepository: PgImmersionOfferRepository;

  beforeAll(async () => {
    pool = getTestPgPool();
    client = await pool.connect();
  });

  beforeEach(async () => {
    await client.query("TRUNCATE immersion_contacts CASCADE");
    await client.query("TRUNCATE establishments CASCADE");
    await client.query("TRUNCATE immersion_offers CASCADE");
    pgImmersionOfferRepository = new PgImmersionOfferRepository(client);
  });

  afterAll(async () => {
    client.release();
    await pool.end();
  });

  test("Insert immersions and retrieves them back", async () => {
    await pgImmersionOfferRepository.insertEstablishments([
      new EstablishmentEntity({
        id: "13df03a5-a2a5-430a-b558-111111111111",
        address: "fake address establishment 1",
        name: "Fake Establishment from la plate forme de l'inclusion",
        voluntaryToImmersion: false,
        score: 5,
        romes: ["M1907"],
        siret: "78000403200029",
        dataSource: "api_laplateformedelinclusion",
        numberEmployeesRange: 1,
        position: { lat: 10, lon: 15 },
        naf: "8539A",
        contactMode: "EMAIL",
      }),
    ]);
    await pgImmersionOfferRepository.insertEstablishments([
      new EstablishmentEntity({
        id: "13df03a5-a2a5-430a-b558-222222222222",
        address: "fake address establishment 2",
        name: "Fake Establishment from la plate forme de l'inclusion",
        voluntaryToImmersion: false,
        score: 5,
        romes: ["M1907"],
        siret: "78000403200040",
        dataSource: "api_laplateformedelinclusion",
        numberEmployeesRange: 1,
        position: { lat: 11, lon: 16 },
        naf: "8539A",
        contactMode: "PHONE",
      }),
    ]);

    const contactInEstablishment: ImmersionEstablishmentContact = {
      id: "93144fe8-56a7-4807-8990-726badc6332b",
      name: "Doe",
      firstname: "John",
      email: "joe@mail.com",
      role: "super job",
      siretEstablishment: "78000403200040",
      phone: "0640404040",
    };

    await pgImmersionOfferRepository.insertEstablishmentContact(
      contactInEstablishment,
    );

    await pgImmersionOfferRepository.insertImmersions([
      new ImmersionOfferEntity({
        id: "13df03a5-a2a5-430a-b558-111111111122",
        rome: "M1907",
        naf: "8539A",
        siret: "78000403200029",
        name: "Company from la bonne boite for search",
        voluntaryToImmersion: false,
        data_source: "api_labonneboite",
        contactInEstablishment: undefined,
        score: 4.5,
        position: { lat: 49, lon: 6 },
      }),
    ]);

    await pgImmersionOfferRepository.insertImmersions([
      new ImmersionOfferEntity({
        id: "13df03a5-a2a5-430a-b558-333333333344",
        rome: "M1907",
        naf: "8539A",
        siret: "78000403200040",
        name: "Company from api sirene for search",
        voluntaryToImmersion: false,
        data_source: "api_sirene",
        contactInEstablishment,
        score: 4.5,
        position: { lat: 49.05, lon: 6.05 },
      }),
    ]);

    const searchResult = await pgImmersionOfferRepository.getFromSearch({
      rome: "M1907",
      distance_km: 30,
      lat: 49.1,
      lon: 6.1,
      nafDivision: "85",
    });
    expect(searchResult).toHaveLength(2);
    const expectedResult1: SearchImmersionResultDto = {
      id: "13df03a5-a2a5-430a-b558-333333333344",
      address: "fake address establishment 2",
      name: "Company from api sirene for search",
      naf: "8539A",
      contactMode: "PHONE",
      location: { lat: 49.05, lon: 6.05 },
      voluntaryToImmersion: false,
      rome: "M1907",
      siret: "78000403200040",
      distance_m: 6653,
      city: "xxxx",
      nafLabel: "xxxx",
      romeLabel: "xxxx",
    };
    const expectedResult2: SearchImmersionResultDto = {
      id: "13df03a5-a2a5-430a-b558-111111111122",
      address: "fake address establishment 1",
      name: "Company from la bonne boite for search",
      voluntaryToImmersion: false,
      rome: "M1907",
      siret: "78000403200029",
      location: { lat: 49, lon: 6 },
      distance_m: 13308,
      naf: "8539A",
      contactMode: "EMAIL",
      city: "xxxx",
      nafLabel: "xxxx",
      romeLabel: "xxxx",
    };

    expect(
      searchResult.sort((a, b) => a.distance_m! - b.distance_m!),
    ).toMatchObject([expectedResult1, expectedResult2]);

    const searchResuts = await pgImmersionOfferRepository.getFromSearch({
      rome: "M1907",
      distance_km: 30,
      lat: 49.1,
      lon: 6.1,
      nafDivision: "85",
      siret: "78000403200040",
    });
    expect(searchResuts).toHaveLength(1);
    expect(searchResuts[0].siret).toBe("78000403200040");
    expect(searchResuts[0].contactDetails).toBeUndefined();

    const searchResultsWithDetails =
      await pgImmersionOfferRepository.getFromSearch(
        {
          rome: "M1907",
          distance_km: 30,
          lat: 49.1,
          lon: 6.1,
          nafDivision: "85",
          siret: "78000403200040",
        },
        true,
      );
    expect(searchResultsWithDetails).toHaveLength(1);
    expect(searchResultsWithDetails[0].siret).toBe("78000403200040");

    const expectedContactDetails: SearchContact = {
      id: "93144fe8-56a7-4807-8990-726badc6332b",
      lastName: "Doe",
      firstName: "John",
      email: "joe@mail.com",
      role: "super job",
      phone: "0640404040",
    };
    expect(searchResultsWithDetails[0].contactDetails).toEqual(
      expectedContactDetails,
    );
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
      }),
    ]);
  });

  test("getImmersionFromUuid", async () => {
    const immersionOfferId = "11111111-1111-1111-1111-111111111111";
    const siret = "11112222333344";
    const establishment = new EstablishmentEntityBuilder()
      .withSiret(siret)
      .build();

    await pgImmersionOfferRepository.insertEstablishments([establishment]);

    const contactInEstablishment: ImmersionEstablishmentContact = {
      id: "11111111-0000-0000-0000-111111111111",
      name: "Doe",
      firstname: "John",
      email: "joe@mail.com",
      role: "super job",
      siretEstablishment: siret,
      phone: "0640295453",
    };
    await pgImmersionOfferRepository.insertEstablishmentContact(
      contactInEstablishment,
    );

    await pgImmersionOfferRepository.insertImmersions([
      new ImmersionOfferEntity({
        id: immersionOfferId,
        rome: "M1607",
        naf: "8539A",
        siret: siret,
        name: "Company from la bonne boite",
        voluntaryToImmersion: false,
        data_source: "api_labonneboite",
        contactInEstablishment,
        score: 4.5,
        position: { lat: 43.8666, lon: 8.3333 },
      }),
    ]);

    const immersionSearchResult =
      await pgImmersionOfferRepository.getImmersionFromUuid(immersionOfferId);
    expect(immersionSearchResult).toBeDefined();
    expect(immersionSearchResult!.name).toBe("Company from la bonne boite");
    expect(immersionSearchResult!.contactDetails).toBeUndefined();

    const immersionSearchResultWithDetails =
      await pgImmersionOfferRepository.getImmersionFromUuid(
        immersionOfferId,
        true,
      );
    expect(immersionSearchResultWithDetails).toBeDefined();
    const expectedSearchContact: SearchContact = {
      id: contactInEstablishment.id,
      firstName: contactInEstablishment.firstname,
      lastName: contactInEstablishment.name,
      email: contactInEstablishment.email,
      phone: contactInEstablishment.phone,
      role: contactInEstablishment.role,
    };
    expect(immersionSearchResultWithDetails!.contactDetails).toEqual(
      expectedSearchContact,
    );
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
