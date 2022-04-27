import { Pool, PoolClient } from "pg";
import { prop, sortBy } from "ramda";
import { PgEstablishmentAggregateRepository } from "../../adapters/secondary/pg/PgEstablishmentAggregateRepository";
import {
  DataSource,
  EstablishmentEntityV2,
  NumberEmployeesRange,
} from "../../domain/immersionOffer/entities/EstablishmentEntity";
import { SearchMade } from "../../domain/immersionOffer/entities/SearchMadeEntity";
import { LatLonDto } from "../../shared/latLon";
import { AppellationDto } from "../../shared/romeAndAppellationDtos/romeAndAppellation.dto";
import { SearchImmersionResultDto } from "../../shared/searchImmersion/SearchImmersionResult.dto";
import { ContactEntityV2Builder } from "../../_testBuilders/ContactEntityV2Builder";
import { EstablishmentAggregateBuilder } from "../../_testBuilders/EstablishmentAggregateBuilder";
import { EstablishmentEntityV2Builder } from "../../_testBuilders/EstablishmentEntityV2Builder";
import { getTestPgPool } from "../../_testBuilders/getTestPgPool";
import { ImmersionOfferEntityV2Builder } from "../../_testBuilders/ImmersionOfferEntityV2Builder";
import {
  ContactMethod,
  FormEstablishmentSource,
} from "../../shared/formEstablishment/FormEstablishment.dto";
import {
  expectArraysToEqualIgnoringOrder,
  expectTypeToMatchAndEqual,
} from "../../_testBuilders/test.helpers";

const testUid1 = "11111111-a2a5-430a-b558-ed3e2f03512d";
const testUid2 = "22222222-a2a5-430a-b558-ed3e2f03512d";
const testUid3 = "33333333-a2a5-430a-b558-ed3e2f03512d";
const testUid4 = "44444444-a2a5-430a-b558-ed3e2f03512d";

describe("Postgres implementation of immersion offer repository", () => {
  let pool: Pool;
  let client: PoolClient;
  let pgEstablishmentAggregateRepository: PgEstablishmentAggregateRepository;

  beforeAll(async () => {
    pool = getTestPgPool();
    client = await pool.connect();
  });

  beforeEach(async () => {
    await client.query("DELETE FROM establishments");
    await client.query("DELETE FROM immersion_contacts");
    pgEstablishmentAggregateRepository = new PgEstablishmentAggregateRepository(
      client,
    );
  });

  afterAll(async () => {
    client.release();
    await pool.end();
  });

  describe("pg implementation of method getSearchImmersionResultDtoFromSearchMade", () => {
    const informationGeographiqueRome = "M1808"; // "Information géographique"
    const analysteEnGeomatiqueAppellation = "10946";
    const cartographeAppellation = "11704";

    const searchedPosition = { lat: 49, lon: 6 };
    const notMatchingRome = "B1805";
    const farFromSearchedPosition = { lat: 32, lon: 89 };
    const searchMadeWithRome: SearchMade = {
      rome: informationGeographiqueRome,
      ...searchedPosition,
      distance_km: 30,
    };
    const searchMadeWithoutRome: SearchMade = {
      ...searchedPosition,
      distance_km: 30,
    };
    it("returns empty list when repo is empty", async () => {
      // Act
      const searchWithNoRomeResult =
        await pgEstablishmentAggregateRepository.getSearchImmersionResultDtoFromSearchMade(
          { searchMade: searchMadeWithRome },
        );
      // Assert
      expect(searchWithNoRomeResult).toHaveLength(0);
    });

    const insertActiveEstablishmentAndOfferAndEventuallyContact = async (
      offerUid: string,
      siret: string,
      rome: string,
      establishmentPosition: LatLonDto,
      appellationCode?: string,
      offerContactUid?: string,
      dataSource: DataSource = "form",
      sourceProvider: FormEstablishmentSource = "immersion-facile",
      address?: string,
      nafCode?: string,
      numberEmployeesRange?: NumberEmployeesRange,
    ) => {
      await insertEstablishment({
        siret,
        isActive: true,
        position: establishmentPosition,
        dataSource,
        sourceProvider,
        address,
        nafCode,
        numberEmployeesRange,
      });
      if (offerContactUid) {
        await insertImmersionContact({
          uuid: offerContactUid,
          siret_establishment: siret,
        });
      }
      await insertImmersionOffer({
        uuid: offerUid,
        siret,
        romeCode: rome,
        romeAppellation: appellationCode,
      });
    };
    describe("if parameter `maxResults` is given", () => {
      it("returns at most `maxResults` establishments", async () => {
        // Prepare
        /// Two establishments match
        await insertActiveEstablishmentAndOfferAndEventuallyContact(
          testUid1,
          "78000403200029",
          "A1101", // Whatever
          searchedPosition, // Position matching
        );
        await insertActiveEstablishmentAndOfferAndEventuallyContact(
          testUid2,
          "79000403200029",
          "A1201", // Whatever
          searchedPosition, // Position matching
        );

        // Act
        const searchResult: SearchImmersionResultDto[] =
          await pgEstablishmentAggregateRepository.getSearchImmersionResultDtoFromSearchMade(
            {
              searchMade: searchMadeWithoutRome,
              withContactDetails: false,
              maxResults: 1,
            },
          );

        // Assert : one match and defined contact details
        expect(searchResult).toHaveLength(1);
      });
    });
    describe("if no rome code is given", () => {
      it("returns all establishments within geographical area", async () => {
        // Prepare
        /// Two establishments located inside geographical area
        await insertActiveEstablishmentAndOfferAndEventuallyContact(
          testUid1,
          "78000403200029",
          "A1101", // Whatever
          searchedPosition, // Position matching
          "20404", // Appellation : Tractoriste agricole; Tractoriste agricole
        );
        await insertImmersionOffer({
          uuid: testUid2,
          romeCode: "A1101", // Same rome and establishment as offer with id testUid2
          siret: "78000403200029",
          romeAppellation: "17751", // Appellation : Pilote de machines d'abattage;Pilote de machines d'abattage
        });

        await insertActiveEstablishmentAndOfferAndEventuallyContact(
          testUid3,
          "79000403200029",
          "A1201",
          searchedPosition, // Position matching
          undefined, // No appellation given
        );
        /// Establishment oustide geographical area
        await insertActiveEstablishmentAndOfferAndEventuallyContact(
          testUid4,
          "99000403200029",
          "A1101", // Whatever
          farFromSearchedPosition, // Position not matching
        );

        // Act
        const searchResult: SearchImmersionResultDto[] =
          await pgEstablishmentAggregateRepository.getSearchImmersionResultDtoFromSearchMade(
            { searchMade: searchMadeWithoutRome },
          );

        // Assert : one match and defined contact details
        expect(searchResult).toHaveLength(2);

        const expectedResult: Partial<SearchImmersionResultDto>[] = [
          {
            rome: "A1101",
            siret: "78000403200029",
            distance_m: 0,
            appellationLabels: [
              "Pilote de machines d'abattage",
              "Tractoriste agricole",
            ],
          },
          {
            rome: "A1201",
            siret: "79000403200029",
            distance_m: 0,
            appellationLabels: [],
          },
        ];

        expect(sortBy(prop("rome"), searchResult)).toMatchObject(
          expectedResult,
        );
      });
    });

    it("returns active establishments only", async () => {
      // Prepare : establishment in geographical area but not active
      const notActiveSiret = "78000403200029";

      await insertEstablishment({
        siret: notActiveSiret,
        isActive: false,
        position: searchedPosition,
      });
      await insertImmersionOffer({
        uuid: testUid1,
        romeCode: informationGeographiqueRome,
        romeAppellation: undefined, // Appellation
        siret: notActiveSiret,
      });

      await insertImmersionOffer({
        uuid: testUid2,
        romeCode: informationGeographiqueRome,
        romeAppellation: undefined, // Appellation
        siret: notActiveSiret,
      });

      // Act
      const searchWithNoRomeResult =
        await pgEstablishmentAggregateRepository.getSearchImmersionResultDtoFromSearchMade(
          { searchMade: searchMadeWithRome },
        );
      // Assert
      expect(searchWithNoRomeResult).toHaveLength(0);
    });

    it("returns searchable establishments only", async () => {
      // Prepare : establishment in geographical area but not active
      const notSearchableSiret = "78000403200029";

      await insertEstablishment({
        siret: notSearchableSiret,
        isSearchable: false,
        position: searchedPosition,
      });
      await insertImmersionOffer({
        uuid: testUid1,
        romeCode: informationGeographiqueRome,
        romeAppellation: undefined, // Appellation
        siret: notSearchableSiret,
      });

      await insertImmersionOffer({
        uuid: testUid2,
        romeCode: informationGeographiqueRome,
        romeAppellation: undefined, // Appellation
        siret: notSearchableSiret,
      });

      // Act
      const searchWithNoRomeResult =
        await pgEstablishmentAggregateRepository.getSearchImmersionResultDtoFromSearchMade(
          { searchMade: searchMadeWithRome },
        );
      // Assert
      expect(searchWithNoRomeResult).toHaveLength(0);
    });

    it("returns one search DTO by establishment, with offers matching rome and geographical area", async () => {
      // Prepare
      /// Establishment with offer inside geographical area with searched rome
      const siretMatchingToSearch = "78000403200029";
      const immersionOfferIdMatchingSearch = testUid1;
      const matchingEstablishmentAddress = "4 rue de Bitche, 44000 Nantes";
      const matchingNaf = "8622B";
      const matchingNumberOfEmployeeRange = "1-2";
      const matchingNafLabel = "Activité des médecins spécialistes";
      await insertActiveEstablishmentAndOfferAndEventuallyContact(
        immersionOfferIdMatchingSearch,
        siretMatchingToSearch,
        informationGeographiqueRome, // Matching
        searchedPosition, // Establishment position matching
        cartographeAppellation, // No appellation given
        undefined, // no  contact !
        "form", // data source
        "immersion-facile", // source_provider
        matchingEstablishmentAddress,
        matchingNaf,
        matchingNumberOfEmployeeRange,
      );

      await insertImmersionOffer({
        uuid: testUid2,
        siret: siretMatchingToSearch,
        romeCode: informationGeographiqueRome,
        romeAppellation: analysteEnGeomatiqueAppellation,
      });

      /// Establishment with offer inside geographical area but an other rome
      await insertActiveEstablishmentAndOfferAndEventuallyContact(
        testUid3,
        "88000403200029",
        notMatchingRome, // Not matching
        searchedPosition,
      );

      // Establishment with offer with searched rome but oustide geographical area
      await insertActiveEstablishmentAndOfferAndEventuallyContact(
        testUid4,
        "99000403200029",
        informationGeographiqueRome,
        farFromSearchedPosition,
      );

      // Act
      const searchResult: SearchImmersionResultDto[] =
        await pgEstablishmentAggregateRepository.getSearchImmersionResultDtoFromSearchMade(
          { searchMade: searchMadeWithRome },
        );

      // Assert : one match and defined contact details
      expect(searchResult).toHaveLength(1);

      const expectedResult: Partial<SearchImmersionResultDto> = {
        rome: informationGeographiqueRome,
        romeLabel: "Information géographique",
        appellationLabels: ["Analyste en géomatique", "Cartographe"],
        siret: siretMatchingToSearch,
        distance_m: 0,
        voluntaryToImmersion: true,
        contactMode: undefined,
        address: matchingEstablishmentAddress,
        city: "Nantes",
        numberOfEmployeeRange: "1-2",
        naf: matchingNaf,
        nafLabel: matchingNafLabel,
        location: searchedPosition,
      };

      expect(searchResult).toMatchObject([expectedResult]);
    });
    it("returns Form establishments before LBB establishments", async () => {
      // Prepare : establishment in geographical area but not active
      const formSiret = "99000403200029";
      const lbbSiret1 = "11000403200029";
      const lbbSiret2 = "22000403200029";

      await insertActiveEstablishmentAndOfferAndEventuallyContact(
        testUid2,
        lbbSiret1,
        informationGeographiqueRome, // Matching
        searchedPosition, // Establishment position matching
        cartographeAppellation,
        undefined,
        "api_labonneboite", // data source
      );

      await insertActiveEstablishmentAndOfferAndEventuallyContact(
        testUid3,
        lbbSiret2,
        informationGeographiqueRome, // Matching
        searchedPosition, // Establishment position matching
        cartographeAppellation,
        undefined,
        "api_labonneboite", // data source
      );

      await insertActiveEstablishmentAndOfferAndEventuallyContact(
        testUid1,
        formSiret,
        informationGeographiqueRome, // Matching
        searchedPosition, // Establishment position matching
        cartographeAppellation,
        undefined,
        "form", // data source
      );

      // Act
      const searchResult =
        await pgEstablishmentAggregateRepository.getSearchImmersionResultDtoFromSearchMade(
          { searchMade: searchMadeWithRome, maxResults: 2 },
        );
      // Assert
      expect(searchResult).toHaveLength(2);
      expect(searchResult[0].siret).toEqual(formSiret);
      expect(searchResult[0].voluntaryToImmersion).toBe(true);
      expect(searchResult[1].siret).toEqual(lbbSiret1);
      expect(searchResult[1].voluntaryToImmersion).toBe(false);
    });
    it("returns also contact details if offer has contact uuid and flag is True", async () => {
      // Prepare
      /// Establishment with offer inside geographical area with searched rome
      const siretMatchingToSearch = "78000403200029";
      const contactUidOfOfferMatchingSearch = testUid1;

      await insertActiveEstablishmentAndOfferAndEventuallyContact(
        testUid1,
        siretMatchingToSearch,
        informationGeographiqueRome, // Matching
        searchedPosition, // Establishment position matching
        undefined, // No appellation given
        contactUidOfOfferMatchingSearch,
      );

      // With multiple contacts
      await insertImmersionContact({
        uuid: testUid2,
        lastName: "Dupont",
        email: "jean@dupont",
        siret_establishment: siretMatchingToSearch,
      });

      // Act
      const searchResult: SearchImmersionResultDto[] =
        await pgEstablishmentAggregateRepository.getSearchImmersionResultDtoFromSearchMade(
          { searchMade: searchMadeWithRome, withContactDetails: true },
        );

      // Assert : one match and defined contact details
      expect(searchResult).toHaveLength(1);
      expect(searchResult[0].contactDetails?.id).toEqual(
        contactUidOfOfferMatchingSearch,
      );
    });
    it("returns only form establishments if voluntaryOnly is true", async () => {
      // Prepare : establishment in geographical area but not active
      const formSiret = "11000403200029";
      const lbbSiret = "22000403200029";

      await Promise.all([
        insertEstablishment({
          siret: formSiret,
          isActive: true,
          position: searchedPosition,
          dataSource: "form",
        }),
        insertEstablishment({
          siret: lbbSiret,
          isActive: true,
          position: searchedPosition,
          dataSource: "api_labonneboite",
        }),
      ]);
      await Promise.all([
        insertImmersionOffer({
          uuid: testUid1,
          romeCode: informationGeographiqueRome,
          siret: formSiret,
        }),

        insertImmersionOffer({
          uuid: testUid2,
          romeCode: informationGeographiqueRome,
          siret: lbbSiret,
        }),
      ]);
      // Act
      const searchWithVoluntaryOnly =
        await pgEstablishmentAggregateRepository.getSearchImmersionResultDtoFromSearchMade(
          {
            searchMade: { ...searchMadeWithRome, voluntary_to_immersion: true },
          },
        );
      // Assert
      expect(searchWithVoluntaryOnly).toHaveLength(1);
      expect(searchWithVoluntaryOnly[0].siret).toEqual(formSiret);
    });
  });

  describe("Pg implementation of method getActiveEstablishmentSiretsNotUpdatedSince", () => {
    const position = { lon: 2, lat: 3 };
    it("returns a siret list of establishments having field `update_date` < parameter `since`", async () => {
      // Prepare
      const since = new Date("2020-05-05T12:00:00.000");
      const siretOfClosedEstablishmentNotUpdatedSince = "78000403200021";
      const siretOfActiveEstablishmentNotUpdatedSince = "78000403200022";
      const siretOfActiveEstablishmentUpdatedSince = "78000403200023";
      const siretOfActiveFormEstablishmentUpdatedSince = "78000403200024";

      const beforeSince = new Date("2020-04-14T12:00:00.000");
      const afterSince = new Date("2020-05-15T12:00:00.000");

      await Promise.all([
        // Should NOT update because not active
        insertEstablishment({
          siret: siretOfClosedEstablishmentNotUpdatedSince,
          updatedAt: beforeSince,
          isActive: false,
          position,
          dataSource: "api_labonneboite",
        }),
        insertEstablishment({
          // Should update because from LBB, before the date and active
          siret: siretOfActiveEstablishmentNotUpdatedSince,
          updatedAt: beforeSince,
          isActive: true,
          position,
          dataSource: "api_labonneboite",
        }),
        insertEstablishment({
          // Should NOT update because from form
          siret: siretOfActiveFormEstablishmentUpdatedSince,
          updatedAt: beforeSince,
          isActive: true,
          position,
          dataSource: "form",
          sourceProvider: "immersion-facile",
        }),
        insertEstablishment({
          // Should NOT update because already updated since date
          siret: siretOfActiveEstablishmentUpdatedSince,
          updatedAt: afterSince,
          isActive: true,
          position,
          dataSource: "api_labonneboite",
        }),
      ]);

      // Act
      const actualResult =
        await pgEstablishmentAggregateRepository.getActiveEstablishmentSiretsFromLaBonneBoiteNotUpdatedSince(
          since,
        );

      // Assert
      const expectedResult: string[] = [
        siretOfActiveEstablishmentNotUpdatedSince,
      ];
      expect(actualResult).toEqual(expectedResult);
    });
    it("returns a siret list of all establishments having same `update_date` and `create_date` (which means they have never been updated !)", async () => {
      // Prepare
      const neverUpdatedEstablishmentSiret = "88000403200022";
      await insertEstablishment({
        siret: neverUpdatedEstablishmentSiret,
        isActive: true,
        position,
        dataSource: "api_labonneboite",
      });
      // Act
      const actualResult =
        await pgEstablishmentAggregateRepository.getActiveEstablishmentSiretsFromLaBonneBoiteNotUpdatedSince(
          new Date("2020-04-14T12:00:00.000"), // whatever date
        );

      // Assert
      const expectedResult: string[] = [neverUpdatedEstablishmentSiret];
      expect(actualResult).toEqual(expectedResult);
    });
  });

  describe("Pg implementation of method updateEstablishment", () => {
    const position = { lon: 2, lat: 3 };
    it("Updates the parameter `updatedAt` and `isActive if given", async () => {
      // Prepare
      const siretOfEstablishmentToUpdate = "78000403200021";

      await insertEstablishment({
        siret: siretOfEstablishmentToUpdate,
        updatedAt: new Date("2020-04-14T12:00:00.000"),
        isActive: true,
        position,
      });

      // Act
      const updatedAt = new Date("2020-05-15T12:00:00.000");
      await pgEstablishmentAggregateRepository.updateEstablishment(
        siretOfEstablishmentToUpdate,
        {
          isActive: false,
          updatedAt,
        },
      );

      // Assert
      const establishmentRowInDB = await retrieveEstablishmentWithSiret(
        siretOfEstablishmentToUpdate,
      );
      expect(establishmentRowInDB).toMatchObject({
        is_active: false,
        update_date: updatedAt,
      });
    });

    it("updates parameters `nafDto`, `nb of employe`, `address` and `position` if given and `updatedAt`", async () => {
      // Prepare
      const siretOfEstablishmentToUpdate = "78000403200021";

      const updateProps: Pick<
        EstablishmentEntityV2,
        "address" | "nafDto" | "numberEmployeesRange" | "position"
      > = {
        nafDto: { code: "8722B", nomenclature: "nomenc" },
        numberEmployeesRange: "1-2",
        position: { lon: 21, lat: 23 },
        address: "4 rue de l'île de Bitche 44000 Nantes",
      };
      await insertEstablishment({
        siret: siretOfEstablishmentToUpdate,
        updatedAt: new Date("2020-04-14T12:00:00.000"),
        isActive: true,
        position,
      });

      // Act
      const updatedAt = new Date("2020-05-15T12:00:00.000");
      await pgEstablishmentAggregateRepository.updateEstablishment(
        siretOfEstablishmentToUpdate,
        {
          ...updateProps,
          updatedAt,
        },
      );

      // Assert
      const actualEstablishmentRowInDB = await retrieveEstablishmentWithSiret(
        siretOfEstablishmentToUpdate,
      );
      const partialExpectedEstablishmentRowInDB: Partial<PgEstablishmentRowWithGeo> =
        {
          update_date: updatedAt,
          naf_code: updateProps.nafDto.code,
          naf_nomenclature: updateProps.nafDto.nomenclature,
          number_employees: updateProps.numberEmployeesRange,
          address: updateProps.address,
          longitude: updateProps.position.lon,
          latitude: updateProps.position.lat,
        };
      expect(actualEstablishmentRowInDB).toMatchObject(
        partialExpectedEstablishmentRowInDB,
      );
    });
  });

  describe("pg implementation of method insertEstablishmentAggregates", () => {
    const siret1 = "11111111111111";
    const siret2 = "22222222222222";
    describe("create new establishments", () => {
      it("does nothing if empty list given", async () => {
        await pgEstablishmentAggregateRepository.insertEstablishmentAggregates(
          [],
        );
        expect(await getAllEstablishmentsRows()).toHaveLength(0);
      });
      it("adds the establishment values in `establishments` table when one new establishment is given", async () => {
        // Prepare
        const establishmentToInsert =
          new EstablishmentEntityV2Builder().build();

        // Act;
        await pgEstablishmentAggregateRepository.insertEstablishmentAggregates([
          new EstablishmentAggregateBuilder()
            .withEstablishment(establishmentToInsert)
            .build(),
        ]);

        // Assert
        const expectedEstablishmentRow: Partial<PgEstablishmentRow> = {
          siret: establishmentToInsert.siret,
          name: establishmentToInsert.name,
          customized_name: establishmentToInsert.customizedName ?? null,
          is_commited: establishmentToInsert.isCommited ?? null,
          address: establishmentToInsert.address,
          number_employees: establishmentToInsert.numberEmployeesRange,
          naf_code: establishmentToInsert.nafDto.code,
          naf_nomenclature: establishmentToInsert.nafDto.nomenclature,
          data_source: establishmentToInsert.dataSource,
          update_date: establishmentToInsert.updatedAt,
          is_active: establishmentToInsert.isActive,
        };
        const actualEstablishmentRows = await getAllEstablishmentsRows();
        expect(actualEstablishmentRows).toHaveLength(1);
        expect(actualEstablishmentRows[0]).toMatchObject(
          expectedEstablishmentRow,
        );
      });
      it("adds one new row per establishment in `establishments` table when multiple establishments are given", async () => {
        // Act
        await pgEstablishmentAggregateRepository.insertEstablishmentAggregates([
          new EstablishmentAggregateBuilder()
            .withEstablishmentSiret(siret1)
            .build(),
          new EstablishmentAggregateBuilder()
            .withEstablishmentSiret(siret2)
            .build(),
        ]);
        // Assert
        const establishmentsRows = await getAllEstablishmentsRows();
        expect(establishmentsRows).toHaveLength(2);
        expect(establishmentsRows.map((row) => row.siret)).toEqual([
          siret1,
          siret2,
        ]);
      });
      it("adds a new row in contact table with contact referencing the establishment siret", async () => {
        // Prepare
        const contactId = "3ca6e619-d654-4d0d-8fa6-2febefbe953d";
        const contact = new ContactEntityV2Builder()
          .withId(contactId)
          .withContactMethod("EMAIL")
          .build();

        // Act
        await pgEstablishmentAggregateRepository.insertEstablishmentAggregates([
          new EstablishmentAggregateBuilder()
            .withEstablishmentSiret(siret1)
            .withContact(contact)
            .build(),
        ]);

        // Assert
        const actualImmersionContactRows = await getAllImmersionContactsRows();
        expect(actualImmersionContactRows).toHaveLength(1);
        const expectedImmersionContactRow: PgImmersionContactWithSiretRow = {
          uuid: contact.id,
          email: contact.email,
          phone: contact.phone,
          lastname: contact.lastName,
          firstname: contact.firstName,
          role: contact.job,
          establishment_siret: siret1,
          contact_mode: "EMAIL",
          copy_emails: contact.copyEmails,
        };
        expect(actualImmersionContactRows[0]).toMatchObject(
          expectedImmersionContactRow,
        );
      });
      it("adds as many row as immersion offers in table `immersion_offers`, each referencing the establishment siret and the contact uuid", async () => {
        // Act
        const offer1 = new ImmersionOfferEntityV2Builder()
          .withId("11111111-a2a5-430a-b558-ed3e2f03512d")
          .withRomeCode("A1101")
          .build();
        const offer2 = new ImmersionOfferEntityV2Builder()
          .withId("22222222-a2a5-430a-b558-ed3e2f03512d")
          .withRomeCode("A1201")
          .build();

        const contactId = "3ca6e619-d654-4d0d-8fa6-2febefbe953d";
        const establishmentAggregateToInsert =
          new EstablishmentAggregateBuilder()
            .withEstablishmentSiret(siret1)
            .withImmersionOffers([offer1, offer2])
            .withContactId(contactId)
            .build();

        await pgEstablishmentAggregateRepository.insertEstablishmentAggregates([
          establishmentAggregateToInsert,
        ]);

        // Assert
        const actualImmersionOfferRows = await getAllImmersionOfferRows();
        expect(actualImmersionOfferRows).toHaveLength(2);

        const expectedFirstImmersionOfferRow: Partial<PgImmersionOfferRow> = {
          uuid: offer1.id,
          rome_code: offer1.romeCode,
          score: offer1.score,
          siret: siret1,
        };
        expect(actualImmersionOfferRows[0]).toMatchObject(
          expectedFirstImmersionOfferRow,
        );
      });
    });
    describe("when the establishment siret already exists and active", () => {
      const existingSiret = "88888888888888";
      const existingUpdateAt = new Date("2021-01-01T10:10:00.000Z");
      const existingEstablishmentAddress = "7 rue guillaume tell, 75017 Paris";
      const insertExistingEstablishmentWithDataSource = async (
        dataSource: DataSource,
      ) => {
        await insertEstablishment({
          siret: existingSiret,
          isActive: true,
          position: { lat: 88, lon: 3 },
          address: existingEstablishmentAddress,
          nafCode: "1032Z",
          numberEmployeesRange: "1-2",
          updatedAt: existingUpdateAt,
          dataSource,
        });
      };
      describe("existing establishment's data source is `form` and new data source is `api_labonneboite`", () => {
        it("adds a new offer with source `api_labonneboite` and contact_uid null (even if an offer with same rome and siret already exists)", async () => {
          // Prepare : this establishment has once been inserted with an offer through source `form`
          const offer1Rome = "A1101";
          await insertExistingEstablishmentWithDataSource("form");
          await insertImmersionOffer({
            uuid: testUid1,
            romeCode: offer1Rome,
            siret: existingSiret,
          });

          // Act : An aggregate with same siret and rome offer needs to be inserted from source `api_labonneboite`
          const offer2Rome = "A1201";
          await pgEstablishmentAggregateRepository.insertEstablishmentAggregates(
            [
              new EstablishmentAggregateBuilder()
                .withEstablishment(
                  new EstablishmentEntityV2Builder()
                    .withSiret(existingSiret)
                    .withDataSource("api_labonneboite")
                    .withAddress("LBB address should be ignored")
                    .build(),
                )
                .withImmersionOffers([
                  new ImmersionOfferEntityV2Builder()
                    .withRomeCode(offer2Rome)
                    .build(),
                ])
                .build(),
            ],
          );

          // Assert : establishment is not updated, but
          /// Update date and address should not have changed
          const actualEstablishmentRowInDB = await getEstablishmentsRowsBySiret(
            existingSiret,
          );
          expect(actualEstablishmentRowInDB?.update_date).toEqual(
            existingUpdateAt,
          );
          expect(actualEstablishmentRowInDB?.address).toEqual(
            existingEstablishmentAddress,
          );

          /// Offer should have been added
          const actualImmersionOfferRows = await getAllImmersionOfferRows();
          expect(actualImmersionOfferRows).toHaveLength(2);
          expect(actualImmersionOfferRows[0]?.rome_code).toEqual(offer1Rome);
          expect(actualImmersionOfferRows[1]?.rome_code).toEqual(offer2Rome);

          // /// Contact should not have been added
          // expect(await getAllImmersionContactsRows()).toHaveLength(0); // TODO : fix me ?
        });
      });
      describe("existing establishment's data source is `api_labonneboite` and new data source is also `api_labonneboite`", () => {
        it("updates the data in the establishments table", async () => {
          // Prepare
          await insertExistingEstablishmentWithDataSource("api_labonneboite");

          // Act
          const newAddress = "New establishment address, 44000 Nantes";
          await pgEstablishmentAggregateRepository.insertEstablishmentAggregates(
            [
              new EstablishmentAggregateBuilder()
                .withEstablishment(
                  new EstablishmentEntityV2Builder()
                    .withSiret(existingSiret)
                    .withAddress(newAddress)
                    .withDataSource("api_labonneboite")
                    .build(),
                )
                .withImmersionOffers([
                  new ImmersionOfferEntityV2Builder().build(),
                ])
                .build(),
            ],
          );
          // Assert
          /// Address (amongst other fields) should have been updated
          expect(
            (await getEstablishmentsRowsBySiret(existingSiret))?.address,
          ).toEqual(newAddress);
          /// Offer should have been added
          expect(await getAllImmersionOfferRows()).toHaveLength(1);
        });
      });
      describe("existing establishment's data source is `api_labonneboite` and new data source is `form`", () => {
        it("updates the data in the establishments table (dataSource, ...), contact table and adds the offers (no matter if same rome, siret already has offer) .", async () => {
          // Prepare : an establishment with offer rome A1101 and no contact has previously been inserted by source La Bonne Boite
          const offerRome = "A1101";
          await insertExistingEstablishmentWithDataSource("api_labonneboite");
          await insertImmersionOffer({
            uuid: "22222222-a2a5-430a-b558-ed3e2f03512d",
            romeCode: offerRome,
            siret: existingSiret,
          });
          // Act : an establishment aggregate with this siret is inserted by source Form
          await pgEstablishmentAggregateRepository.insertEstablishmentAggregates(
            [
              new EstablishmentAggregateBuilder()
                .withEstablishment(
                  new EstablishmentEntityV2Builder()
                    .withSiret(existingSiret)
                    .withDataSource("form")
                    .build(),
                )
                .withImmersionOffers([
                  new ImmersionOfferEntityV2Builder().build(),
                ])
                .build(),
            ],
          );
          // Assert
          /// Data Source (amongst other fields) should have been updated
          expect(
            (await getEstablishmentsRowsBySiret(existingSiret))?.data_source,
          ).toBe("form");
          /// Offer should have been added
          const allImmersionOffeRows = await getAllImmersionOfferRows();
          expect(allImmersionOffeRows).toHaveLength(2);
        });
      });
    });
  });

  describe("pg implementation of method getContactEmailFromSiret", () => {
    const siret = "12345678901234";
    it("returns undefined if no establishment contact with this siret", async () => {
      // Act
      const actualContactEmail = (
        await pgEstablishmentAggregateRepository.getContactForEstablishmentSiret(
          siret,
        )
      )?.email;
      // Assert
      expect(actualContactEmail).toBeUndefined();
    });
    it("returns the first contact if exist", async () => {
      // Prepare
      await insertEstablishment({
        siret,
      });
      const contactEmail = "antoine@yahoo.fr";
      await insertImmersionContact({
        uuid: testUid1,
        email: contactEmail,
        siret_establishment: siret,
      });
      // Act
      const actualContactEmail = (
        await pgEstablishmentAggregateRepository.getContactForEstablishmentSiret(
          siret,
        )
      )?.email;
      // Assert
      expect(actualContactEmail).toEqual(contactEmail);
    });
  });
  describe("pg implementation of method hasEstablishmentFromFormWithSiret", () => {
    const siret = "12345678901234";
    it("returns false if no establishment from form with given siret exists", async () => {
      // Prepare
      await insertEstablishment({
        siret,
        dataSource: "api_labonneboite",
      });
      // Act and assert
      expect(
        await pgEstablishmentAggregateRepository.hasEstablishmentFromFormWithSiret(
          siret,
        ),
      ).toBe(false);
    });
    it("returns true if an establishment from form with given siret exists", async () => {
      // Prepare
      await insertEstablishment({
        siret,
        dataSource: "form",
      });
      // Act and assert
      expect(
        await pgEstablishmentAggregateRepository.hasEstablishmentFromFormWithSiret(
          siret,
        ),
      ).toBe(true);
    });
  });
  describe("Pg implementation of method getEstablishmentDataSourceFromSiret", () => {
    const siret = "12345678901234";
    it("Returns undefined when there is no establishment in db with this siret", async () => {
      const establishmentDataSource =
        await pgEstablishmentAggregateRepository.getEstablishmentDataSourceFromSiret(
          siret,
        );
      expect(establishmentDataSource).toBeUndefined();
    });
    it("Check the establishment data_source", async () => {
      // Prepare
      await insertEstablishment({
        siret,
        dataSource: "form",
      });
      // Act
      const establishmentDataSource =
        await pgEstablishmentAggregateRepository.getEstablishmentDataSourceFromSiret(
          siret,
        );
      // Assert
      expect(establishmentDataSource).toBe("form");
    });
  });
  describe("Pg implementation of method getSiretOfEstablishmentsFromFormSource", () => {
    it("Returns a list of sirets of establishments with `form` data source", async () => {
      // Prepare
      const siretFromForm1 = "11111111111111";
      const siretFromForm2 = "22222222222222";
      const siretFromLBB = "33333333333333";

      await Promise.all([
        insertEstablishment({
          siret: siretFromForm1,
          dataSource: "form",
        }),
        insertEstablishment({
          siret: siretFromForm2,
          dataSource: "form",
        }),
        insertEstablishment({
          siret: siretFromLBB,
          dataSource: "api_labonneboite",
        }),
      ]);

      // Act
      const actualSiretOfEstablishmentsFromFormSource =
        await pgEstablishmentAggregateRepository.getSiretOfEstablishmentsFromFormSource();
      // Assert
      expectArraysToEqualIgnoringOrder(
        actualSiretOfEstablishmentsFromFormSource,
        [siretFromForm1, siretFromForm2],
      );
    });
  });
  describe("Pg implementation of method removeEstablishmentAndOffersWithSiret", () => {
    it("Removes only establishment with given siret and its offers", async () => {
      // Prepare
      const siretToRemove = "11111111111111";
      const siretToKeep = "22222222222222";

      await Promise.all([
        insertEstablishment({
          siret: siretToRemove,
        }),
        insertEstablishment({
          siret: siretToKeep,
        }),
      ]);
      await Promise.all([
        insertImmersionOffer({
          uuid: testUid1,
          romeCode: "A1401",
          siret: siretToRemove,
        }),
        insertImmersionOffer({
          uuid: testUid2,
          romeCode: "A1405",
          siret: siretToRemove,
        }),
        insertImmersionOffer({
          uuid: testUid3,
          romeCode: "A1405",
          siret: siretToKeep,
        }),
      ]);

      // Act
      await pgEstablishmentAggregateRepository.removeEstablishmentAndOffersAndContactWithSiret(
        siretToRemove,
      );
      // Assert
      //   Establishment has been removed
      expect(await getEstablishmentsRowsBySiret(siretToRemove)).toBeUndefined();
      expect(await getEstablishmentsRowsBySiret(siretToKeep)).toBeDefined();
      //   Offers of this establishment have been removed
      const immersionOfferRows = await getAllImmersionOfferRows();
      expect(immersionOfferRows).toHaveLength(1);
      expect(immersionOfferRows[0].siret).toEqual(siretToKeep);
    });
  });

  describe("Pg implementation of methods getEstablishmentForSiret, getContactsForEstablishmentSiret and getOffersFromEstablishmentSiret", () => {
    const siretInTable = "12345678901234";
    const establishment = new EstablishmentEntityV2Builder()
      .withSiret(siretInTable)
      .withAddress("7 rue guillaume tell, 75017 Paris")
      .build();
    const contact = new ContactEntityV2Builder()
      .withEmail("toto@gmail.com")
      .build();
    const offers = [
      new ImmersionOfferEntityV2Builder()
        .withNewId()
        .withRomeCode("A1101") // Code only, no appellation
        .withAppellationCode("11987")
        .build(),
      new ImmersionOfferEntityV2Builder()
        .withNewId()
        .withRomeCode("A1101")
        .withAppellationCode("12862")
        .build(),
    ];
    beforeEach(async () => {
      const aggregate = new EstablishmentAggregateBuilder()
        .withEstablishment(establishment)
        .withContact(contact)
        .withImmersionOffers(offers)
        .build();
      await pgEstablishmentAggregateRepository.insertEstablishmentAggregates([
        aggregate,
      ]);
    });
    describe("getEstablishmentForSiret", () => {
      it("returns undefined if no establishment found with this siret", async () => {
        const siretNotInTable = "11111111111111";

        expect(
          await pgEstablishmentAggregateRepository.getEstablishmentForSiret(
            siretNotInTable,
          ),
        ).toBeUndefined();
      });
      it("returns the establishment entity with given siret", async () => {
        expectTypeToMatchAndEqual(
          await pgEstablishmentAggregateRepository.getEstablishmentForSiret(
            siretInTable,
          ),
          { ...establishment, nafLabel: "" },
        );
      });
    });
    describe("getContactForEstablishmentSiret", () => {
      it("returns undefined if no establishment found with this siret", async () => {
        const siretNotInTable = "11111111111111";

        expect(
          await pgEstablishmentAggregateRepository.getContactForEstablishmentSiret(
            siretNotInTable,
          ),
        ).toBeUndefined();
      });
      it("returns the first contact entity attached to establishment of given siret", async () => {
        expect(
          await pgEstablishmentAggregateRepository.getContactForEstablishmentSiret(
            siretInTable,
          ),
        ).toEqual(contact);
      });
    });

    describe("getOffersAsAppelationDtoForFormEstablishment", () => {
      it("returns an empty list if no establishment found with this siret", async () => {
        const siretNotInTable = "11111111111111";

        expect(
          await pgEstablishmentAggregateRepository.getOffersAsAppelationDtoForFormEstablishment(
            siretNotInTable,
          ),
        ).toHaveLength(0);
      });
      it("returns a list with offers from offers as AppellationDto of given siret", async () => {
        const expectedOffersAsAppelationDto: AppellationDto[] = [
          {
            romeCode: offers[0].romeCode,
            romeLabel: "Conduite d'engins agricoles et forestiers",
            appellationCode: offers[0].appellationCode!.toString(),
            appellationLabel: "Chauffeur / Chauffeuse de machines agricoles",
          },
          {
            romeCode: offers[1].romeCode,
            romeLabel: "Conduite d'engins agricoles et forestiers",
            appellationCode: offers[1].appellationCode!.toString(),
            appellationLabel: "Conducteur / Conductrice d'abatteuses",
          },
        ];
        const actualOffersAsAppelationDto =
          await pgEstablishmentAggregateRepository.getOffersAsAppelationDtoForFormEstablishment(
            siretInTable,
          );
        expectArraysToEqualIgnoringOrder(
          actualOffersAsAppelationDto,
          expectedOffersAsAppelationDto,
        );
      });
    });
  });

  type PgEstablishmentRow = {
    siret: string;
    name: string;
    customized_name?: string | null;
    address: string;
    number_employees: string;
    naf_code: string;
    naf_nomenclature: string;
    data_source: string;
    gps: string;
    update_date?: Date;
    is_active: boolean;
    is_commited?: boolean | null;
  };

  const getAllEstablishmentsRows = async (): Promise<PgEstablishmentRow[]> =>
    client.query("SELECT * FROM establishments").then((res) => res.rows);

  const getEstablishmentsRowsBySiret = async (
    siret: string,
  ): Promise<PgEstablishmentRow | undefined> =>
    client
      .query("SELECT * FROM establishments WHERE siret=$1", [siret])
      .then((res) => res.rows[0]);

  type PgImmersionContactWithSiretRow = {
    uuid: string;
    lastname: string;
    firstname: string;
    role: string;
    email: string;
    phone: string;
    establishment_siret: string;
    contact_mode: ContactMethod;
    copy_emails: string[];
  };

  const getAllImmersionContactsRows = async (): Promise<
    PgImmersionContactWithSiretRow[]
  > =>
    client
      .query(
        `SELECT * FROM immersion_contacts AS ic JOIN establishments__immersion_contacts AS eic
         ON ic.uuid = eic.contact_uuid WHERE contact_uuid IS NOT NULL`,
      )
      .then((res) => res.rows);

  type PgImmersionOfferRow = {
    uuid: string;
    rome_code: string;
    rome_nomenclature: number;
    siret: string;
    score: number;
  };

  const getAllImmersionOfferRows = async (): Promise<PgImmersionOfferRow[]> =>
    client.query("SELECT * FROM immersion_offers").then((res) => res.rows);

  type PgEstablishmentRowWithGeo = PgEstablishmentRow & {
    longitude: number;
    latitude: number;
  };

  const retrieveEstablishmentWithSiret = async (
    siret: string,
  ): Promise<PgEstablishmentRowWithGeo | undefined> => {
    const pgResult = await client.query(
      `SELECT *, ST_X(gps::geometry) AS longitude, ST_Y(gps::geometry) AS latitude 
       FROM establishments WHERE siret='${siret}' LIMIT 1;`,
    );
    return pgResult.rows[0] ?? (pgResult.rows[0] as PgEstablishmentRowWithGeo);
  };
  const insertEstablishment = async (props: {
    siret: string;
    updatedAt?: Date;
    isActive?: boolean;
    isSearchable?: boolean;
    nafCode?: string;
    numberEmployeesRange?: NumberEmployeesRange;
    address?: string;
    dataSource?: DataSource;
    sourceProvider?: FormEstablishmentSource;
    position?: LatLonDto;
  }) => {
    const defaultPosition = { lon: 12.2, lat: 2.1 };
    const position = props.position ?? defaultPosition;
    const insertQuery = `
    INSERT INTO establishments (
      siret, name, address, number_employees, naf_code, data_source, source_provider, update_date, is_active, is_searchable, gps, lon, lat
    ) VALUES ($1, '', $2, $3, $4, $5, $6, $7, $8, $9, ST_GeographyFromText('POINT(${position.lon} ${position.lat})'), $10, $11)`;
    await client.query(insertQuery, [
      props.siret,
      props.address ?? "7 rue guillaume tell, 75017 Paris",
      props.numberEmployeesRange ?? null,
      props.nafCode ?? "8622B",
      props.dataSource ?? "api_labonneboite",
      props.sourceProvider ?? "api_labonneboite",
      props.updatedAt ? `'${props.updatedAt.toISOString()}'` : null,
      props.isActive ?? true,
      props.isSearchable ?? true,
      position.lon,
      position.lat,
    ]);
  };
  const insertImmersionOffer = async (props: {
    uuid: string;
    romeCode: string;
    siret: string;
    romeAppellation?: string;
  }) => {
    const insertQuery = `INSERT INTO immersion_offers (
      uuid, rome_code, siret, score, rome_appellation
    ) VALUES
     ($1, $2, $3, $4, $5)`;
    const defaultScore = 4;

    await client.query(insertQuery, [
      props.uuid,
      props.romeCode,
      props.siret,
      defaultScore,
      props.romeAppellation ?? null,
    ]);
  };
  const insertImmersionContact = async (props: {
    uuid: string;
    lastName?: string;
    email?: string;
    siret_establishment: string;
  }) => {
    await client.query(
      `
    INSERT INTO immersion_contacts (
    uuid, lastname, firstname, role, email, phone, contact_mode
  ) VALUES
   ($1, $2, '', '', $3, '', 'EMAIL');`,
      [
        props.uuid,
        props.lastName ?? "Jacques",
        props.email ?? "jacques@gmail.com",
      ],
    );

    await client.query(
      `INSERT INTO establishments__immersion_contacts (establishment_siret, contact_uuid) VALUES ($1, $2)`,
      [props.siret_establishment, props.uuid],
    );
  };
});
