import { Pool, PoolClient } from "pg";
import { PgImmersionOfferRepository } from "../../adapters/secondary/pg/PgImmersionOfferRepository";
import { EstablishmentEntityV2 } from "../../domain/immersionOffer/entities/EstablishmentEntity";
import {
  LatLonDto,
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
    test("Insert immersions and retrieves them back if establishment is active", async () => {
      const closedEstablishmentAggregate = new EstablishmentAggregateBuilder()
        .withEstablishment({
          address: "fake address establishment 1 12345 some city",
          name: "Company from la bonne boite for search",
          voluntaryToImmersion: false,
          siret: "78000403200029",
          dataSource: "api_labonneboite",
          numberEmployeesRange: 12,
          position: { lat: 49, lon: 6 },
          naf: "8520A",
          contactMethod: "EMAIL",
          isActive: false,
          updatedAt: new Date("2022-03-07T19:10:00.000"),
        })
        .withImmersionOffers([
          {
            id: "13df03a5-a2a5-430a-b558-111111111122",
            rome: "M1808",
            score: 4.5,
          },
        ])
        .build();
      const activeEstablishmentAggregate = new EstablishmentAggregateBuilder()
        .withEstablishment({
          address: "fake address establishment 2 12345 some city",
          name: "Company from FORM for search",
          voluntaryToImmersion: false,
          siret: "78000403200040",
          dataSource: "form",
          numberEmployeesRange: 1,
          position: { lat: 49.05, lon: 6.05 },
          naf: "8520A",
          contactMethod: "PHONE",
          isActive: true,
          updatedAt: new Date("2022-03-07T19:10:00.000"),
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
        .build();
      await pgImmersionOfferRepository.insertEstablishmentAggregates([
        closedEstablishmentAggregate,
        activeEstablishmentAggregate,
      ]);

      const searchWithNoRomeResult =
        await pgImmersionOfferRepository.getFromSearch({
          distance_km: 30,
          lat: 49.1,
          lon: 6.1,
        });
      expect(searchWithNoRomeResult).toHaveLength(1);

      const searchResult = await pgImmersionOfferRepository.getFromSearch({
        rome: "M1808",
        distance_km: 30,
        lat: 49.1,
        lon: 6.1,
        nafDivision: "85",
      });
      expect(searchResult).toHaveLength(1);

      const expectedResult: SearchImmersionResultDto = {
        id: activeEstablishmentAggregate.immersionOffers[0].id,
        address: activeEstablishmentAggregate.establishment.address,
        city: "some city",
        name: activeEstablishmentAggregate.establishment.name,
        voluntaryToImmersion:
          activeEstablishmentAggregate.establishment.voluntaryToImmersion,
        rome: "M1808",
        romeLabel: "Information géographique",
        siret: activeEstablishmentAggregate.establishment.siret,
        location: activeEstablishmentAggregate.establishment.position,
        distance_m: 6653,
        naf: activeEstablishmentAggregate.establishment.naf,
        nafLabel: "Enseignement primaire",
        contactMode: activeEstablishmentAggregate.establishment.contactMethod,
        numberOfEmployeeRange: "1-2",
      };

      expect(searchResult).toMatchObject([expectedResult]);

      const searchResults = await pgImmersionOfferRepository.getFromSearch({
        rome: "M1808",
        distance_km: 30,
        lat: 49.1,
        lon: 6.1,
        nafDivision: "85",
        siret: "78000403200040",
      });
      expect(searchResults).toHaveLength(1);
      expect(searchResults[0].siret).toBe("78000403200040");
      expect(searchResults[0].contactDetails).toBeUndefined();

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

  const position: LatLonDto = {
    lat: 0,
    lon: 0,
  };
  describe("Pg implementation of method getActiveEstablishmentSiretsNotUpdatedSince", () => {
    it("Returns a siret list of establishments having field `update_date` < parameter `since` ", async () => {
      // Prepare
      const since = new Date("2020-05-05T12:00:00.000");
      const siretOfClosedEstablishmentNotUpdatedSince = "78000403200021";
      const siretOfActiveEstablishmentNotUpdatedSince = "78000403200022";
      const siretOfActiveEstablishmentUpdatedSince = "78000403200023";

      const beforeSince = new Date("2020-04-14T12:00:00.000");
      const afterSince = new Date("2020-05-15T12:00:00.000");

      await Promise.all([
        insertEstablishment({
          client,
          siret: siretOfClosedEstablishmentNotUpdatedSince,
          updatedAt: beforeSince,
          isActive: false,
          position,
        }),
        insertEstablishment({
          client,
          siret: siretOfActiveEstablishmentNotUpdatedSince,
          updatedAt: beforeSince,
          isActive: true,
          position,
        }),
        insertEstablishment({
          client,
          siret: siretOfActiveEstablishmentUpdatedSince,
          updatedAt: afterSince,
          isActive: true,
          position,
        }),
      ]);

      // Act
      const actualResult =
        await pgImmersionOfferRepository.getActiveEstablishmentSiretsNotUpdatedSince(
          since,
        );

      // Assert
      const expectedResult: string[] = [
        siretOfActiveEstablishmentNotUpdatedSince,
      ];
      expect(actualResult).toEqual(expectedResult);
    });
    it("Returns a siret list of all establishmetns having same `update_date` and `create_date` (which means they have never been updated !) ", async () => {
      // Prepare
      const neverUpdatedEstablishmentSiret = "88000403200022";
      await insertEstablishment({
        client,
        siret: neverUpdatedEstablishmentSiret,
        isActive: true,
        position,
      });
      // Act
      const actualResult =
        await pgImmersionOfferRepository.getActiveEstablishmentSiretsNotUpdatedSince(
          new Date("2020-04-14T12:00:00.000"), // whatever date
        );

      // Assert
      const expectedResult: string[] = [neverUpdatedEstablishmentSiret];
      expect(actualResult).toEqual(expectedResult);
    });
  });

  describe("Pg implementation of method updateEstablishment", () => {
    it("Updates the parameter `updatedAt` and `isActive if given", async () => {
      // Prepare
      const siretOfEstablishmentToUpdate = "78000403200021";

      await insertEstablishment({
        client,
        siret: siretOfEstablishmentToUpdate,
        updatedAt: new Date("2020-04-14T12:00:00.000"),
        isActive: true,
        position,
      });

      // Act
      const updatedAt = new Date("2020-05-15T12:00:00.000");
      await pgImmersionOfferRepository.updateEstablishment(
        siretOfEstablishmentToUpdate,
        {
          isActive: false,
          updatedAt,
        },
      );

      // Assert
      const establishmentRowInDB = await retrieveEstablishmentWithSiret(
        client,
        siretOfEstablishmentToUpdate,
      );
      expect(establishmentRowInDB).toMatchObject({
        is_active: false,
        update_date: updatedAt,
      });
    });

    it("Updates parameters `naf`, `nb of employe`, `adress` and `position` if given and `updatedAt`", async () => {
      // Prepare
      const siretOfEstablishmentToUpdate = "78000403200021";

      const updateProps: Partial<
        Pick<
          EstablishmentEntityV2,
          "address" | "position" | "naf" | "numberEmployeesRange" | "isActive"
        >
      > = {
        naf: "8722B",
        numberEmployeesRange: 1,
        position: { lon: 21, lat: 23 },
        address: "4 rue de l'île de Bitche 44000 Nantes",
      };
      await insertEstablishment({
        client,
        siret: siretOfEstablishmentToUpdate,
        updatedAt: new Date("2020-04-14T12:00:00.000"),
        isActive: true,
        position,
      });

      // Act
      const updatedAt = new Date("2020-05-15T12:00:00.000");
      await pgImmersionOfferRepository.updateEstablishment(
        siretOfEstablishmentToUpdate,
        {
          ...updateProps,
          updatedAt,
        },
      );

      // Assert
      const actualEstablishmentRowInDB = await retrieveEstablishmentWithSiret(
        client,
        siretOfEstablishmentToUpdate,
      );
      const partialExpectedEstablishmentRowInDB: PartialEstablishmentPGRow = {
        update_date: updatedAt,
        naf: updateProps?.naf,
        number_employees: updateProps.numberEmployeesRange,
        address: updateProps.address,
        longitude: updateProps?.position?.lon,
        latitude: updateProps?.position?.lat,
      };
      expect(actualEstablishmentRowInDB).toMatchObject(
        partialExpectedEstablishmentRowInDB,
      );
    });
  });

  const getEstablishmentsBySiret = (siret: string) =>
    client
      .query("SELECT * FROM establishments WHERE siret=$1", [siret])
      .then((res) => res.rows);
});

const insertEstablishment = async (props: {
  client: PoolClient;
  siret: string;
  updatedAt?: Date;
  isActive: boolean;
  naf?: string;
  numberEmployeesRange?: number;
  address?: string;
  position: LatLonDto;
}) => {
  const insertQuery = `INSERT INTO establishments (
    siret, name, address, number_employees, naf, contact_mode, data_source, gps, update_date, is_active
  ) VALUES ('${props.siret}', '', '${props.address ?? ""}', ${
    props.numberEmployeesRange ?? null
  }, '${
    props.naf ?? "8622B"
  }', null, 'api_labonneboite', ${`ST_GeographyFromText('POINT(${props.position.lon} ${props.position.lat})')`}, ${
    props.updatedAt ? `'${props.updatedAt.toISOString()}'` : "null"
  }, ${props.isActive} )`;
  await props.client.query(insertQuery);
};

type PartialEstablishmentPGRow = {
  update_date?: Date;
  naf?: string;
  number_employees?: number;
  address?: string;
  longitude?: number;
  latitude?: number;
};

const retrieveEstablishmentWithSiret = async (
  client: PoolClient,
  siret: string,
): Promise<PartialEstablishmentPGRow | undefined> => {
  const pgResult = await client.query(
    `SELECT update_date, is_active, naf, number_employees, address, ST_X(gps::geometry) AS longitude, ST_Y(gps::geometry) AS latitude 
     FROM establishments WHERE siret='${siret}' LIMIT 1;`,
  );
  return pgResult.rows[0] ?? (pgResult.rows[0] as PartialEstablishmentPGRow);
};
