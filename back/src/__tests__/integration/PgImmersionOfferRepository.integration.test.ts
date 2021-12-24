import { Pool, PoolClient } from "pg";
import { PgImmersionOfferRepository } from "../../adapters/secondary/pg/PgImmersionOfferRepository";
import {
  SearchContact,
  SearchImmersionResultDto,
} from "../../shared/SearchImmersionDto";
import { ContactEntityV2Builder } from "../../_testBuilders/ContactEntityV2Builder";
import { EstablishmentAggregateBuilder } from "../../_testBuilders/EstablishmentAggregateBuilder";
import { EstablishmentEntityV2Builder } from "../../_testBuilders/EstablishmentEntityV2Builder";
import { getTestPgPool } from "../../_testBuilders/getTestPgPool";
import { ImmersionOfferEntityV2Builder } from "../../_testBuilders/ImmersionOfferEntityV2Builder";

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

  describe("insertEstablishmentAggregates", () => {
    test("Insert immersions and retrieves them back", async () => {
      await pgImmersionOfferRepository.insertEstablishmentAggregates([
        new EstablishmentAggregateBuilder()
          .withEstablishment({
            address: "fake address establishment 1 12345 some city",
            name: "Company from la bonne boite for search",
            voluntaryToImmersion: false,
            siret: "78000403200029",
            dataSource: "api_labonneboite",
            numberEmployeesRange: 1,
            position: { lat: 49, lon: 6 },
            naf: "8520A",
            contactMethod: "EMAIL",
          })
          .withImmersionOffers([
            {
              id: "13df03a5-a2a5-430a-b558-111111111122",
              rome: "M1808",
              score: 4.5,
            },
          ])
          .build(),
        new EstablishmentAggregateBuilder()
          .withEstablishment({
            address: "fake address establishment 2 12345 some city",
            name: "Company from api sirene for search",
            voluntaryToImmersion: false,
            siret: "78000403200040",
            dataSource: "api_sirene",
            numberEmployeesRange: 1,
            position: { lat: 49.05, lon: 6.05 },
            naf: "8520A",
            contactMethod: "PHONE",
          })
          .withContacts([
            {
              id: "93144fe8-56a7-4807-8990-726badc6332b",
              lastName: "Doe",
              firstName: "John",
              email: "joe@mail.com",
              job: "super job",
              phone: "0640404040",
            },
          ])
          .withImmersionOffers([
            {
              id: "13df03a5-a2a5-430a-b558-333333333344",
              rome: "M1808",
              score: 4.5,
            },
          ])
          .build(),
      ]);

      const searchResult = await pgImmersionOfferRepository.getFromSearch({
        rome: "M1808",
        distance_km: 30,
        lat: 49.1,
        lon: 6.1,
        nafDivision: "85",
      });
      expect(searchResult).toHaveLength(2);
      const expectedResult1: SearchImmersionResultDto = {
        id: "13df03a5-a2a5-430a-b558-333333333344",
        address: "fake address establishment 2 12345 some city",
        city: "some city",
        name: "Company from api sirene for search",
        naf: "8520A",
        nafLabel: "Enseignement primaire",
        contactMode: "PHONE",
        location: { lat: 49.05, lon: 6.05 },
        voluntaryToImmersion: false,
        rome: "M1808",
        romeLabel: "Information géographique",
        siret: "78000403200040",
        distance_m: 6653,
      };
      const expectedResult2: SearchImmersionResultDto = {
        id: "13df03a5-a2a5-430a-b558-111111111122",
        address: "fake address establishment 1 12345 some city",
        city: "some city",
        name: "Company from la bonne boite for search",
        voluntaryToImmersion: false,
        rome: "M1808",
        romeLabel: "Information géographique",
        siret: "78000403200029",
        location: { lat: 49, lon: 6 },
        distance_m: 13308,
        naf: "8520A",
        nafLabel: "Enseignement primaire",
        contactMode: "EMAIL",
      };

      expect(searchResult).toMatchObject([expectedResult1, expectedResult2]);

      const searchResuts = await pgImmersionOfferRepository.getFromSearch({
        rome: "M1808",
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
            rome: "M1808",
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
      await pgImmersionOfferRepository.insertEstablishmentAggregates([]);
    });

    test("Favours establishment information from form over La Bonne Boite", async () => {
      const siret = "99999999999999";

      const outOfDateEstablishmentFromLaBonneBoite =
        new EstablishmentEntityV2Builder()
          .withSiret(siret)
          .withAddress("old address")
          .withDataSource("api_labonneboite")
          .build();
      const upToDateEstablishmentFromForm = new EstablishmentEntityV2Builder(
        outOfDateEstablishmentFromLaBonneBoite,
      )
        .withAddress("new address")
        .withDataSource("form")
        .build();

      // 1. Insert establishment with outdated info from La Bonne Boite.
      await pgImmersionOfferRepository.insertEstablishmentAggregates([
        new EstablishmentAggregateBuilder()
          .withEstablishment(outOfDateEstablishmentFromLaBonneBoite)
          .build(),
      ]);

      // 2. Update the establishment with newer data from the form.
      await pgImmersionOfferRepository.insertEstablishmentAggregates([
        new EstablishmentAggregateBuilder()
          .withEstablishment(upToDateEstablishmentFromForm)
          .build(),
      ]);

      // The data has been updated.
      let establishments = await getEstablishmentsBySiret(siret);
      expect(establishments).toHaveLength(1);
      expect(establishments[0].address).toEqual("new address");

      // 3. Attempt to revert to the outdated info.
      await pgImmersionOfferRepository.insertEstablishmentAggregates([
        new EstablishmentAggregateBuilder()
          .withEstablishment(outOfDateEstablishmentFromLaBonneBoite)
          .build(),
      ]);

      // The data has not been reverted.
      establishments = await getEstablishmentsBySiret(siret);
      expect(establishments).toHaveLength(1);
      expect(establishments[0].address).toEqual("new address");
    });
  });

  describe("getEstablishmentByImmersionOfferId", () => {
    test("fetches existing establishment", async () => {
      const immersionOfferId = "fdc2c62d-103d-4474-a546-8bf3fbebe83f";
      const storedEstablishment = new EstablishmentEntityV2Builder()
        .withNaf("8520A")
        .build();
      await pgImmersionOfferRepository.insertEstablishmentAggregates([
        new EstablishmentAggregateBuilder()
          .withEstablishment(storedEstablishment)
          .withImmersionOffers([
            new ImmersionOfferEntityV2Builder()
              .withId(immersionOfferId)
              .build(),
          ])
          .build(),
      ]);
      const establishment =
        await pgImmersionOfferRepository.getAnnotatedEstablishmentByImmersionOfferId(
          immersionOfferId,
        );
      expect(establishment).toEqual({
        ...storedEstablishment,
        nafLabel: "Enseignement primaire",
      });
    });

    test("returns undefined for missing establishment", async () => {
      const missingOfferId = "82e37a80-eb0b-4de6-a531-68d30af7887a";
      expect(
        await pgImmersionOfferRepository.getAnnotatedEstablishmentByImmersionOfferId(
          missingOfferId,
        ),
      ).toBeUndefined();
    });
  });

  describe("getContactByImmersionOfferId", () => {
    test("fetches existing contact", async () => {
      const immersionOfferId = "fdc2c62d-103d-4474-a546-8bf3fbebe83f";
      const storedContact = new ContactEntityV2Builder().build();
      await pgImmersionOfferRepository.insertEstablishmentAggregates([
        new EstablishmentAggregateBuilder()
          .withEstablishment(new EstablishmentEntityV2Builder().build())
          .withContacts([storedContact])
          .withImmersionOffers([
            new ImmersionOfferEntityV2Builder()
              .withId(immersionOfferId)
              .build(),
          ])
          .build(),
      ]);
      const contact =
        await pgImmersionOfferRepository.getContactByImmersionOfferId(
          immersionOfferId,
        );
      expect(contact).toEqual(storedContact);
    });

    test("returns undefined for offer without contact", async () => {
      const immersionOfferId = "fdc2c62d-103d-4474-a546-8bf3fbebe83f";
      await pgImmersionOfferRepository.insertEstablishmentAggregates([
        new EstablishmentAggregateBuilder()
          .withEstablishment(new EstablishmentEntityV2Builder().build())
          .withContacts([]) // no contact
          .withImmersionOffers([
            new ImmersionOfferEntityV2Builder()
              .withId(immersionOfferId)
              .build(),
          ])
          .build(),
      ]);
      expect(
        await pgImmersionOfferRepository.getContactByImmersionOfferId(
          immersionOfferId,
        ),
      ).toBeUndefined();
    });

    test("returns undefined for missing offer", async () => {
      const missingOfferId = "82e37a80-eb0b-4de6-a531-68d30af7887a";
      expect(
        await pgImmersionOfferRepository.getContactByImmersionOfferId(
          missingOfferId,
        ),
      ).toBeUndefined();
    });
  });

  describe("getImmersionOfferById", () => {
    test("fetches existing offer", async () => {
      const immersionOfferId = "fdc2c62d-103d-4474-a546-8bf3fbebe83f";
      const storedImmersionOffer = new ImmersionOfferEntityV2Builder()
        .withId(immersionOfferId)
        .withRome("M1808")
        .build();
      await pgImmersionOfferRepository.insertEstablishmentAggregates([
        new EstablishmentAggregateBuilder()
          .withEstablishment(new EstablishmentEntityV2Builder().build())
          .withImmersionOffers([storedImmersionOffer])
          .build(),
      ]);
      const immersionOffer =
        await pgImmersionOfferRepository.getAnnotatedImmersionOfferById(
          immersionOfferId,
        );
      expect(immersionOffer).toEqual({
        ...storedImmersionOffer,
        romeLabel: "Information géographique",
      });
    });

    test("returns undefined for missing offer", async () => {
      const missingOfferId = "82e37a80-eb0b-4de6-a531-68d30af7887a";
      expect(
        await pgImmersionOfferRepository.getAnnotatedImmersionOfferById(
          missingOfferId,
        ),
      ).toBeUndefined();
    });
  });

  const getEstablishmentsBySiret = (siret: string) =>
    client
      .query("SELECT * FROM establishments WHERE siret=$1", [siret])
      .then((res) => res.rows);
});
