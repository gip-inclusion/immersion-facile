import { addDays } from "date-fns";
import subDays from "date-fns/subDays";
import { Pool, PoolClient } from "pg";
import { prop, sortBy } from "ramda";
import {
  AppellationAndRomeDto,
  expectArraysToEqualIgnoringOrder,
  expectObjectsToMatch,
  expectPromiseToFailWith,
  expectPromiseToFailWithError,
  expectToEqual,
  SearchImmersionResultDto,
} from "shared";
import {
  rueBitcheDto,
  rueGuillaumeTellDto,
  rueJacquardDto,
} from "../../../_testBuilders/addressDtos";
import { ContactEntityBuilder } from "../../../_testBuilders/ContactEntityBuilder";
import { DiscussionAggregateBuilder } from "../../../_testBuilders/DiscussionAggregateBuilder";
import { EstablishmentAggregateBuilder } from "../../../_testBuilders/establishmentAggregate.test.helpers";
import { EstablishmentEntityBuilder } from "../../../_testBuilders/EstablishmentEntityBuilder";
import { getTestPgPool } from "../../../_testBuilders/getTestPgPool";
import {
  defaultValidImmersionOfferEntityV2,
  ImmersionOfferEntityV2Builder,
} from "../../../_testBuilders/ImmersionOfferEntityV2Builder";
import {
  EstablishmentAggregate,
  EstablishmentEntity,
} from "../../../domain/immersionOffer/entities/EstablishmentEntity";
import { SearchMade } from "../../../domain/immersionOffer/entities/SearchMadeEntity";
import { UpdateEstablishmentsWithInseeDataParams } from "../../../domain/immersionOffer/ports/EstablishmentAggregateRepository";
import { NotFoundError } from "../../primary/helpers/httpErrors";
import { PgDiscussionAggregateRepository } from "./PgDiscussionAggregateRepository";
import { PgEstablishmentAggregateRepository } from "./PgEstablishmentAggregateRepository";
import {
  expectAggregateEqual,
  getAllEstablishmentsRows,
  getAllImmersionContactsRows,
  getAllImmersionOfferRows,
  getEstablishmentsRowsBySiret,
  insertActiveEstablishmentAndOfferAndEventuallyContact,
  insertEstablishment,
  insertImmersionContact,
  insertImmersionOffer,
  PgEstablishmentRow,
  PgEstablishmentRowWithGeo,
  PgImmersionContactWithSiretRow,
  retrieveEstablishmentWithSiret,
} from "./PgEstablishmentAggregateRepository.test.helpers";

const testUid1 = "11111111-a2a5-430a-b558-ed3e2f03512d";
const testUid2 = "22222222-a2a5-430a-b558-ed3e2f03512d";

const cartographeImmersionOffer = new ImmersionOfferEntityV2Builder()
  .withAppellationCode("11704")
  .withAppellationLabel("Cartographe")
  .withRomeCode("M1808")
  .build();
const analysteEnGeomatiqueImmersionOffer = new ImmersionOfferEntityV2Builder()
  .withAppellationCode("10946")
  .withAppellationLabel("Analyste en géomatique")
  .withRomeCode("M1808")
  .build();

const hydrographeAppellationAndRome: AppellationAndRomeDto = {
  appellationCode: "15504",
  appellationLabel: "Hydrographe",
  romeLabel: "Information géographique",
  romeCode: "M1808",
};

describe("PgEstablishmentAggregateRepository", () => {
  let pool: Pool;
  let client: PoolClient;
  let pgEstablishmentAggregateRepository: PgEstablishmentAggregateRepository;

  beforeAll(async () => {
    pool = getTestPgPool();
    client = await pool.connect();
  });

  beforeEach(async () => {
    await client.query("DELETE FROM immersion_contacts");
    await client.query("DELETE FROM discussions");
    await client.query("DELETE FROM establishments");

    pgEstablishmentAggregateRepository = new PgEstablishmentAggregateRepository(
      client,
    );
  });

  afterAll(async () => {
    client.release();
    await pool.end();
  });

  describe("Pg implementation of method searchImmersionResults", () => {
    const searchedPosition = { lat: 49, lon: 6 };
    const notMatchingRome = "B1805";
    const farFromSearchedPosition = { lat: 32, lon: 89 };
    const cartographeSearchMade: SearchMade = {
      appellationCode: cartographeImmersionOffer.appellationCode,
      ...searchedPosition,
      distanceKm: 30,
      sortedBy: "distance",
    };
    const searchMadeWithoutRome: SearchMade = {
      ...searchedPosition,
      distanceKm: 30,
      sortedBy: "distance",
    };

    it("returns empty list when repo is empty", async () => {
      // Act
      const searchWithNoRomeResult =
        await pgEstablishmentAggregateRepository.searchImmersionResults({
          searchMade: cartographeSearchMade,
        });
      // Assert
      expect(searchWithNoRomeResult).toHaveLength(0);
    });

    describe("if parameter `maxResults` is given", () => {
      it("returns at most `maxResults` establishments", async () => {
        const establishmentsAndOffers = [
          {
            siret: "78000403200029",
            rome: "A1101",
            establishmentPosition: searchedPosition, // Position matching
            appellationCode: "11987",
          },
          {
            siret: "79000403200029",
            rome: "A1201",
            establishmentPosition: searchedPosition, // Position matching
            appellationCode: "12755",
          },
        ];
        // Prepare
        await Promise.all(
          establishmentsAndOffers.map((establishmentsAndOffer) =>
            insertActiveEstablishmentAndOfferAndEventuallyContact(
              client,
              establishmentsAndOffer,
            ),
          ),
        );

        // Act
        const searchResult: SearchImmersionResultDto[] =
          await pgEstablishmentAggregateRepository.searchImmersionResults({
            searchMade: searchMadeWithoutRome,
            maxResults: 1,
          });

        // Assert : one match and defined contact details
        expect(searchResult).toHaveLength(1);
      });
    });

    describe("if no rome code is given", () => {
      it("returns all establishments within geographical area", async () => {
        // Prepare
        /// Two establishments located inside geographical area
        await insertActiveEstablishmentAndOfferAndEventuallyContact(client, {
          siret: "78000403200029",
          rome: "A1101",
          appellationCode: "20404", // Appellation : Tractoriste agricole; Tractoriste agricole
          establishmentPosition: searchedPosition,
        });
        await insertImmersionOffer(client, {
          siret: "78000403200029",
          romeCode: "A1101", // Same rome and establishment as offer
          appellationCode: "17751", // Appellation : Pilote de machines d'abattage;Pilote de machines d'abattage
        });

        /// Establishment oustide geographical are
        await insertActiveEstablishmentAndOfferAndEventuallyContact(
          client,
          {
            siret: "99000403200029",
            rome: "A1101",
            establishmentPosition: farFromSearchedPosition,
            appellationCode: "12862",
          }, // Position not matching
        );

        // Act
        const searchResult: SearchImmersionResultDto[] =
          await pgEstablishmentAggregateRepository.searchImmersionResults({
            searchMade: searchMadeWithoutRome,
          });

        const expectedResult: Partial<SearchImmersionResultDto>[] = [
          {
            rome: "A1101",
            siret: "78000403200029",
            distance_m: 0,
            appellations: [
              {
                appellationLabel: "Pilote de machines d'abattage",
                appellationCode: "17751",
              },
              {
                appellationLabel: "Tractoriste agricole",
                appellationCode: "20404",
              },
            ],
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

      await insertEstablishment(client, {
        siret: notActiveSiret,
        isOpen: false,
        position: searchedPosition,
      });
      await insertImmersionOffer(client, {
        romeCode: cartographeImmersionOffer.romeCode,
        appellationCode: hydrographeAppellationAndRome.appellationCode, // Appellation
        siret: notActiveSiret,
      });

      await insertImmersionOffer(client, {
        romeCode: cartographeImmersionOffer.romeCode,
        appellationCode: cartographeImmersionOffer.appellationCode, // Appellation
        siret: notActiveSiret,
      });

      // Act
      const searchWithNoRomeResult =
        await pgEstablishmentAggregateRepository.searchImmersionResults({
          searchMade: cartographeSearchMade,
        });
      // Assert
      expect(searchWithNoRomeResult).toHaveLength(0);
    });

    it("provide also searchable establishments", async () => {
      // Prepare : establishment in geographical area but not active
      const notSearchableSiret = "78000403200029";

      await insertEstablishment(client, {
        siret: notSearchableSiret,
        isSearchable: false,
        position: searchedPosition,
      });

      await Promise.all([
        insertImmersionOffer(client, {
          siret: notSearchableSiret,
          romeCode: hydrographeAppellationAndRome.romeCode,
          appellationCode: hydrographeAppellationAndRome.appellationCode, // Appellation
        }),
        insertImmersionOffer(client, {
          siret: notSearchableSiret,
          romeCode: cartographeImmersionOffer.romeCode,
          appellationCode: cartographeImmersionOffer.appellationCode,
        }),
      ]);

      // Act
      const searchWithNoRomeResult =
        await pgEstablishmentAggregateRepository.searchImmersionResults({
          searchMade: cartographeSearchMade,
        });

      // Assert
      expectToEqual(searchWithNoRomeResult, [
        {
          address: {
            city: "Paris",
            streetNumberAndAddress: "7 rue guillaume tell",
            postcode: "75017",
            departmentCode: "75",
          },
          additionalInformation: "",
          website: "",
          distance_m: 0,
          appellations: [
            {
              appellationCode: cartographeImmersionOffer.appellationCode,
              appellationLabel: cartographeImmersionOffer.appellationLabel,
            },
            {
              appellationCode: hydrographeAppellationAndRome.appellationCode,
              appellationLabel: hydrographeAppellationAndRome.appellationLabel,
            },
          ],
          isSearchable: false,
          naf: "8622B",
          nafLabel: "Activité des médecins spécialistes",
          name: "",
          rome: cartographeImmersionOffer.romeCode,
          romeLabel: "Information géographique",
          position: {
            lat: 49,
            lon: 6,
          },
          siret: "78000403200029",
          voluntaryToImmersion: true,
        },
      ]);
    });

    it("returns one search DTO by establishment, with offers matching rome and geographical area", async () => {
      // Prepare
      /// Establishment with offer inside geographical area with searched rome
      const siretMatchingToSearch = "78000403200029";
      const matchingEstablishmentAddress = rueBitcheDto;
      const matchingNaf = "8622B";
      const matchingNumberOfEmployeeRange = "1-2";
      const matchingNafLabel = "Activité des médecins spécialistes";
      await insertActiveEstablishmentAndOfferAndEventuallyContact(client, {
        siret: siretMatchingToSearch,
        rome: cartographeImmersionOffer.romeCode,
        establishmentPosition: searchedPosition,
        appellationCode: cartographeImmersionOffer.appellationCode,
        offerContactUid: undefined,
        sourceProvider: "immersion-facile",
        address: matchingEstablishmentAddress,
        nafCode: matchingNaf,
        numberEmployeesRange: matchingNumberOfEmployeeRange,
        fitForDisabledWorkers: true,
      });

      await insertImmersionOffer(client, {
        siret: siretMatchingToSearch,
        romeCode: analysteEnGeomatiqueImmersionOffer.romeCode,
        appellationCode: analysteEnGeomatiqueImmersionOffer.appellationCode,
      });

      /// Establishment with offer inside geographical area but an other rome
      await insertActiveEstablishmentAndOfferAndEventuallyContact(client, {
        siret: "88000403200029",
        establishmentPosition: searchedPosition,
        rome: notMatchingRome,
        appellationCode: "19540",
      });

      // Establishment with offer with searched rome but oustide geographical area
      await insertActiveEstablishmentAndOfferAndEventuallyContact(client, {
        siret: "99000403200029",
        establishmentPosition: farFromSearchedPosition,
        rome: analysteEnGeomatiqueImmersionOffer.romeCode,
        appellationCode: analysteEnGeomatiqueImmersionOffer.appellationCode,
      });

      // Act
      const searchResult: SearchImmersionResultDto[] =
        await pgEstablishmentAggregateRepository.searchImmersionResults({
          searchMade: cartographeSearchMade,
        });

      // Assert : one match and defined contact details
      expect(searchResult).toHaveLength(1);

      const expectedResult: Partial<SearchImmersionResultDto> = {
        rome: cartographeImmersionOffer.romeCode,
        romeLabel: "Information géographique",
        appellations: [
          {
            appellationLabel:
              analysteEnGeomatiqueImmersionOffer.appellationLabel,
            appellationCode: analysteEnGeomatiqueImmersionOffer.appellationCode,
          },
          {
            appellationLabel: cartographeImmersionOffer.appellationLabel,
            appellationCode: cartographeImmersionOffer.appellationCode,
          },
        ],
        siret: siretMatchingToSearch,
        distance_m: 0,
        voluntaryToImmersion: true,
        contactMode: undefined,
        address: matchingEstablishmentAddress,
        numberOfEmployeeRange: "1-2",
        naf: matchingNaf,
        nafLabel: matchingNafLabel,
        position: searchedPosition,
        fitForDisabledWorkers: true,
      };

      expect(searchResult).toMatchObject([expectedResult]);
    });

    it("if sorted=distance, returns closest establishments in first", async () => {
      // Prepare : establishment in geographical area but not active
      const closeSiret = "99000403200029";
      const farSiret = "11000403200029";

      await insertEstablishment(client, {
        siret: closeSiret,
        position: searchedPosition,
      });
      await insertEstablishment(client, {
        siret: farSiret,
        position: {
          lon: searchedPosition.lon + 0.01,
          lat: searchedPosition.lat + 0.01,
        },
      });
      await insertImmersionOffer(client, {
        romeCode: cartographeImmersionOffer.romeCode,
        siret: closeSiret,
        appellationCode: cartographeSearchMade.appellationCode!,
      });
      await insertImmersionOffer(client, {
        romeCode: cartographeImmersionOffer.romeCode,
        siret: farSiret,
        appellationCode: cartographeSearchMade.appellationCode!,
      });
      // Act
      const searchResult =
        await pgEstablishmentAggregateRepository.searchImmersionResults({
          searchMade: { ...cartographeSearchMade, sortedBy: "distance" },
          maxResults: 2,
        });
      // Assert
      expect(searchResult[0].siret).toEqual(closeSiret);
      expect(searchResult[1].siret).toEqual(farSiret);
    });

    it("if sorted=date, returns latest offers in first", async () => {
      // Prepare : establishment in geographical area but not active
      const recentOfferSiret = "99000403200029";
      const oldOfferSiret = "11000403200029";

      await Promise.all([
        insertEstablishment(client, {
          siret: recentOfferSiret,
          position: searchedPosition,
        }),
        insertEstablishment(client, {
          siret: oldOfferSiret,
          position: searchedPosition,
        }),
      ]);

      await Promise.all([
        insertImmersionOffer(client, {
          romeCode: cartographeImmersionOffer.romeCode,
          appellationCode: cartographeSearchMade.appellationCode!,
          siret: recentOfferSiret,
          offerCreatedAt: new Date("2022-05-05"),
        }),
        insertImmersionOffer(client, {
          romeCode: cartographeImmersionOffer.romeCode,
          appellationCode: cartographeSearchMade.appellationCode!,
          siret: oldOfferSiret,
          offerCreatedAt: new Date("2022-05-02"),
        }),
      ]);

      // Act
      const searchResult =
        await pgEstablishmentAggregateRepository.searchImmersionResults({
          searchMade: { ...cartographeSearchMade, sortedBy: "date" },
          maxResults: 2,
        });
      // Assert
      expect(searchResult[0].siret).toEqual(recentOfferSiret);
      expect(searchResult[1].siret).toEqual(oldOfferSiret);
    });

    it("returns also contact details if offer has contact uuid and flag is True", async () => {
      // Prepare
      /// Establishment with offer inside geographical area with searched rome
      const siretMatchingToSearch = "78000403200029";
      const contactUidOfOfferMatchingSearch = testUid1;

      await insertActiveEstablishmentAndOfferAndEventuallyContact(client, {
        siret: siretMatchingToSearch,
        rome: cartographeImmersionOffer.romeCode,
        establishmentPosition: searchedPosition,
        appellationCode: cartographeImmersionOffer.appellationCode,
        offerContactUid: contactUidOfOfferMatchingSearch,
      });

      // With multiple contacts
      await insertImmersionContact(client, {
        uuid: testUid2,
        lastName: "Dupont",
        email: "jean@dupont",
        siret_establishment: siretMatchingToSearch,
      });

      // Act
      const searchResult: SearchImmersionResultDto[] =
        await pgEstablishmentAggregateRepository.searchImmersionResults({
          searchMade: cartographeSearchMade,
        });

      // Assert : one match and defined contact details
      expect(searchResult).toHaveLength(1);
    });
  });

  describe("Pg implementation of method updateEstablishment", () => {
    const position = { lon: 2, lat: 3 };

    it("Updates the parameter `updatedAt`, `fitForDisabledWorkers` and `isActive if given", async () => {
      // Prepare
      const siretOfEstablishmentToUpdate = "78000403200021";

      await insertEstablishment(client, {
        siret: siretOfEstablishmentToUpdate,
        updatedAt: new Date("2020-04-14T12:00:00.000"),
        isOpen: true,
        fitForDisabledWorkers: false,
        position,
      });

      // Act
      const updatedAt = new Date("2020-05-15T12:00:00.000");
      await pgEstablishmentAggregateRepository.updateEstablishment({
        siret: siretOfEstablishmentToUpdate,
        isOpen: false,
        fitForDisabledWorkers: true,
        updatedAt,
      });

      // Assert
      const establishmentRowInDB = await retrieveEstablishmentWithSiret(
        client,
        siretOfEstablishmentToUpdate,
      );

      expectObjectsToMatch(establishmentRowInDB, {
        is_open: false,
        update_date: updatedAt,
        fit_for_disabled_workers: true,
      });
    });

    it("updates parameters `nafDto`, `nb of employe`, `address` and `position` if given and `updatedAt`", async () => {
      // Prepare
      const siretOfEstablishmentToUpdate = "78000403200021";

      const updateProps: Pick<
        EstablishmentEntity,
        "address" | "nafDto" | "numberEmployeesRange" | "position"
      > = {
        nafDto: { code: "8722B", nomenclature: "nomenc" },
        numberEmployeesRange: "1-2",
        position: { lon: 21, lat: 23 },
        address: rueBitcheDto,
      };
      await insertEstablishment(client, {
        siret: siretOfEstablishmentToUpdate,
        updatedAt: new Date("2020-04-14T12:00:00.000"),
        isOpen: true,
        position,
      });

      // Act
      const updatedAt = new Date("2020-05-15T12:00:00.000");
      await pgEstablishmentAggregateRepository.updateEstablishment({
        ...updateProps,
        siret: siretOfEstablishmentToUpdate,
        updatedAt,
      });

      // Assert
      const actualEstablishmentRowInDB = await retrieveEstablishmentWithSiret(
        client,
        siretOfEstablishmentToUpdate,
      );
      const partialExpectedEstablishmentRowInDB: Partial<PgEstablishmentRowWithGeo> =
        {
          update_date: updatedAt,
          naf_code: updateProps.nafDto.code,
          naf_nomenclature: updateProps.nafDto.nomenclature,
          number_employees: updateProps.numberEmployeesRange,
          street_number_and_address: updateProps.address.streetNumberAndAddress,
          city: updateProps.address.city,
          post_code: updateProps.address.postcode,
          department_code: updateProps.address.departmentCode,
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
        expect(await getAllEstablishmentsRows(client)).toHaveLength(0);
      });

      it("adds the establishment values in `establishments` table when one new establishment is given", async () => {
        // Prepare
        const establishmentToInsert = new EstablishmentEntityBuilder()
          .withMaxContactsPerWeek(7)
          .withLastInseeCheck(new Date("2020-04-14T12:00:00.000"))
          .build();

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
          street_number_and_address:
            establishmentToInsert.address.streetNumberAndAddress,
          post_code: establishmentToInsert.address.postcode,
          city: establishmentToInsert.address.city,
          department_code: establishmentToInsert.address.departmentCode,
          number_employees: establishmentToInsert.numberEmployeesRange,
          naf_code: establishmentToInsert.nafDto.code,
          naf_nomenclature: establishmentToInsert.nafDto.nomenclature,
          update_date: establishmentToInsert.updatedAt,
          is_open: establishmentToInsert.isOpen,
          max_contacts_per_week: establishmentToInsert.maxContactsPerWeek,
          last_insee_check_date: establishmentToInsert.lastInseeCheckDate,
        };
        const actualEstablishmentRows = await getAllEstablishmentsRows(client);
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
            .withImmersionOffers([new ImmersionOfferEntityV2Builder().build()])
            .build(),
          new EstablishmentAggregateBuilder()
            .withEstablishmentSiret(siret2)
            .withImmersionOffers([new ImmersionOfferEntityV2Builder().build()])
            .withGeneratedContactId()
            .build(),
        ]);
        // Assert
        const establishmentsRows = await getAllEstablishmentsRows(client);
        expect(establishmentsRows).toHaveLength(2);
        expect(establishmentsRows.map((row) => row.siret)).toEqual([
          siret1,
          siret2,
        ]);
      });

      it("adds a new row in contact table with contact referencing the establishment siret", async () => {
        // Prepare
        const contactId = "3ca6e619-d654-4d0d-8fa6-2febefbe953d";
        const contact = new ContactEntityBuilder()
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
        const actualImmersionContactRows = await getAllImmersionContactsRows(
          client,
        );
        expect(actualImmersionContactRows).toHaveLength(1);
        const expectedImmersionContactRow: PgImmersionContactWithSiretRow = {
          uuid: contact.id,
          email: contact.email,
          phone: contact.phone,
          lastname: contact.lastName,
          firstname: contact.firstName,
          job: contact.job,
          establishment_siret: siret1,
          contact_mode: "EMAIL",
          copy_emails: contact.copyEmails,
        };
        expect(actualImmersionContactRows[0]).toMatchObject(
          expectedImmersionContactRow,
        );
      });

      it("adds as many row as immersion offers in table `immersion_offers`, each referencing the establishment siret and the contact uuid", async () => {
        // Arrange
        const offer1 = new ImmersionOfferEntityV2Builder()
          .withRomeCode("A1101")
          .withAppellationCode("19540")
          .build();
        const offer2 = new ImmersionOfferEntityV2Builder()
          .withRomeCode("A1201")
          .withAppellationCode("19541")
          .build();

        const contactId = "3ca6e619-d654-4d0d-8fa6-2febefbe953d";
        const establishmentAggregateToInsert =
          new EstablishmentAggregateBuilder()
            .withEstablishmentSiret(siret1)
            .withImmersionOffers([offer1, offer2])
            .withContactId(contactId)
            .build();

        // Act
        await pgEstablishmentAggregateRepository.insertEstablishmentAggregates([
          establishmentAggregateToInsert,
        ]);

        // Assert

        expectToEqual(await getAllImmersionOfferRows(client), [
          {
            rome_code: offer1.romeCode,
            score: offer1.score,
            siret: siret1,
            appellation_code: parseInt(offer1.appellationCode),
            rome_nomenclature: undefined,
          },
          {
            rome_code: offer2.romeCode,
            score: offer2.score,
            siret: siret1,
            appellation_code: parseInt(offer2.appellationCode),
            rome_nomenclature: undefined,
          },
        ]);
      });
    });
  });

  describe("Pg implementation of method hasEstablishmentFromFormWithSiret", () => {
    const siret = "12345678901234";

    it("returns false if no establishment from form with given siret exists", async () => {
      // Act and assert
      expect(
        await pgEstablishmentAggregateRepository.hasEstablishmentWithSiret(
          siret,
        ),
      ).toBe(false);
    });

    it("returns true if an establishment from form with given siret exists", async () => {
      // Prepare
      await insertEstablishment(client, {
        siret,
      });
      // Act and assert
      expect(
        await pgEstablishmentAggregateRepository.hasEstablishmentWithSiret(
          siret,
        ),
      ).toBe(true);
    });
  });

  describe("Pg implementation of method getSiretsOfEstablishmentsWithRomeCode", () => {
    it("Returns a list of establishment sirets that have an offer with given rome", async () => {
      // Prepare
      const romeCode = "A1101";
      const siretWithRomeCodeOffer = "11111111111111";
      const siretWithoutRomeCodeOffer = "22222222222222";
      await pgEstablishmentAggregateRepository.insertEstablishmentAggregates([
        new EstablishmentAggregateBuilder()
          .withEstablishmentSiret(siretWithRomeCodeOffer)
          .withImmersionOffers([
            new ImmersionOfferEntityV2Builder().withRomeCode(romeCode).build(),
          ])
          .build(),
        new EstablishmentAggregateBuilder()
          .withEstablishmentSiret(siretWithoutRomeCodeOffer)
          .withContactId("12233432-1111-2222-3333-123456789123")
          .build(),
      ]);

      // Act
      const actualSiretOfEstablishmentsWithRomeCode =
        await pgEstablishmentAggregateRepository.getSiretsOfEstablishmentsWithRomeCode(
          romeCode,
        );
      // Assert
      expect(actualSiretOfEstablishmentsWithRomeCode).toEqual([
        siretWithRomeCodeOffer,
      ]);
    });
  });

  describe("Pg implementation of method delete", () => {
    it("Throws on missing establishment", async () => {
      const siretNotInTable = "11111111111111";

      await expectPromiseToFailWithError(
        pgEstablishmentAggregateRepository.delete(siretNotInTable),
        new NotFoundError(
          `Establishment with siret ${siretNotInTable} missing on Establishment Aggregate Repository.`,
        ),
      );
    });

    it("Delete aggregate including establishment, immersion offers, immersion contacts", async () => {
      const establishmentAggregate =
        new EstablishmentAggregateBuilder().build();

      await pgEstablishmentAggregateRepository.insertEstablishmentAggregates([
        establishmentAggregate,
      ]);
      expectToEqual(
        await pgEstablishmentAggregateRepository.getEstablishmentAggregateBySiret(
          establishmentAggregate.establishment.siret,
        ),
        establishmentAggregate,
      );

      await pgEstablishmentAggregateRepository.delete(
        establishmentAggregate.establishment.siret,
      );

      expectToEqual(await getAllImmersionOfferRows(client), []);
      expectToEqual(await getAllImmersionContactsRows(client), []);
      expectToEqual(await getAllEstablishmentsRows(client), []);
      expectToEqual(
        await pgEstablishmentAggregateRepository.getEstablishmentAggregateBySiret(
          establishmentAggregate.establishment.siret,
        ),
        undefined,
      );
    });

    it("Removes only establishment with given siret and its offers and its contacts", async () => {
      // Prepare
      const siretToRemove = "11111111111111";
      const siretToKeep = "22222222222222";

      await Promise.all(
        [siretToRemove, siretToKeep].map((siret) =>
          insertEstablishment(client, {
            siret,
          }),
        ),
      );
      await Promise.all([
        insertImmersionOffer(client, {
          romeCode: "A1401",
          appellationCode: "10806",
          siret: siretToRemove,
        }),
        insertImmersionOffer(client, {
          romeCode: "A1405",
          appellationCode: "12112",
          siret: siretToRemove,
        }),
        insertImmersionOffer(client, {
          romeCode: "A1405",
          appellationCode: "17044",
          siret: siretToKeep,
        }),
      ]);

      // Act
      await pgEstablishmentAggregateRepository.delete(siretToRemove);
      // Assert
      //   Establishment has been removed
      expect(
        await getEstablishmentsRowsBySiret(client, siretToRemove),
      ).toBeUndefined();
      expect(
        await getEstablishmentsRowsBySiret(client, siretToKeep),
      ).toBeDefined();
      //   Offers of this establishment have been removed
      const immersionOfferRows = await getAllImmersionOfferRows(client);
      expect(immersionOfferRows).toHaveLength(1);
      expect(immersionOfferRows[0].siret).toEqual(siretToKeep);
    });
  });

  describe("Pg implementation of method  getOffersAsAppelationDtoForFormEstablishment", () => {
    const siretInTable = "12345678901234";
    const establishment = new EstablishmentEntityBuilder()
      .withSiret(siretInTable)
      .withAddress(rueGuillaumeTellDto)
      .build();
    const contact = new ContactEntityBuilder()
      .withEmail("toto@gmail.com")
      .build();
    const offers = [
      new ImmersionOfferEntityV2Builder()
        .withRomeCode("A1101") // Code only, no appellation
        .withAppellationCode("11987")
        .build(),
      new ImmersionOfferEntityV2Builder()
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

    it("returns an empty list if no establishment found with this siret", async () => {
      const siretNotInTable = "11111111111111";

      expect(
        await pgEstablishmentAggregateRepository.getOffersAsAppellationDtoEstablishment(
          siretNotInTable,
        ),
      ).toHaveLength(0);
    });

    it("returns a list with offers from offers as AppellationDto of given siret", async () => {
      const actualOffersAsAppelationDto =
        await pgEstablishmentAggregateRepository.getOffersAsAppellationDtoEstablishment(
          siretInTable,
        );
      expectArraysToEqualIgnoringOrder(actualOffersAsAppelationDto, [
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
      ]);
    });
  });

  describe("Pg implementation of method getSearchImmersionResultDtoBySiretAndAppellation", () => {
    it("Returns undefined when no matching establishment or appellation code", async () => {
      const siretNotInTable = "11111111111111";

      expect(
        await pgEstablishmentAggregateRepository.getSearchImmersionResultDtoBySiretAndAppellationCode(
          siretNotInTable,
          "14012",
        ),
      ).toBeUndefined();
    });

    it("Returns reconstructed SearchImmersionResultDto for given siret and appellationCode", async () => {
      // Prepare
      const siret = "12345678901234";
      const boulangerRome = "D1102";
      const establishment = new EstablishmentEntityBuilder()
        .withSiret(siret)
        .withCustomizedName("La boulangerie de Lucie")
        .withNafDto({ code: "1071Z", nomenclature: "NAFRev2" })
        .withAddress(rueJacquardDto)
        .build();
      const boulangerOffer1 = new ImmersionOfferEntityV2Builder()
        .withRomeCode(boulangerRome)
        .withAppellationCode("10868") // Aide-boulanger / Aide-boulangère
        .build();
      const boulangerOffer2 = new ImmersionOfferEntityV2Builder()
        .withRomeCode(boulangerRome)
        .withAppellationCode("12006") // Chef boulanger / boulangère
        .build();
      const otherOffer = new ImmersionOfferEntityV2Builder()
        .withRomeCode("H2102")
        .build();
      const contact = new ContactEntityBuilder()
        .withGeneratedContactId()
        .build();

      await pgEstablishmentAggregateRepository.insertEstablishmentAggregates([
        new EstablishmentAggregateBuilder()
          .withEstablishment(establishment)
          .withImmersionOffers([boulangerOffer1, boulangerOffer2, otherOffer])
          .withContact(contact)
          .build(),
      ]);

      // Act
      const actualSearchResultDto =
        await pgEstablishmentAggregateRepository.getSearchImmersionResultDtoBySiretAndAppellationCode(
          siret,
          "12006",
        );
      // Assert
      expectToEqual(actualSearchResultDto, {
        rome: boulangerRome,
        romeLabel: "Boulangerie - viennoiserie",
        appellations: [
          // {
          //   appellationLabel: "Aide-boulanger / Aide-boulangère",
          //   appellationCode: "10868",
          // },
          {
            appellationLabel: "Chef boulanger / boulangère",
            appellationCode: "12006",
          },
        ],
        naf: establishment.nafDto.code,
        nafLabel: "Fabrication de pain et de pâtisserie fraîche",
        siret,
        name: establishment.name,
        customizedName: establishment.customizedName,
        website: establishment.website,
        additionalInformation: establishment.additionalInformation,
        voluntaryToImmersion: establishment.voluntaryToImmersion,
        fitForDisabledWorkers: establishment.fitForDisabledWorkers,
        position: establishment.position,
        address: establishment.address,
        numberOfEmployeeRange: establishment.numberEmployeesRange,
        contactMode: contact.contactMethod,
        distance_m: undefined,
      });
    });
  });

  describe("Pg implementation of method getSearchImmersionResultDtoBySiretAndRome", () => {
    it("Returns undefined when no matching establishment", async () => {
      const siretNotInTable = "11111111111111";

      expect(
        await pgEstablishmentAggregateRepository.getSearchImmersionResultDtoBySiretAndRome(
          siretNotInTable,
          "A1401",
        ),
      ).toBeUndefined();
    });

    it("Returns reconstructed SearchImmersionResultDto for given siret and rome when appellation is specified", async () => {
      // Prepare
      const siret = "12345678901234";
      const boulangerRome = "D1102";
      const establishment = new EstablishmentEntityBuilder()
        .withSiret(siret)
        .withCustomizedName("La boulangerie de Lucie")
        .withNafDto({ code: "1071Z", nomenclature: "NAFRev2" })
        .withAddress(rueJacquardDto)
        .build();
      const boulangerOffer1 = new ImmersionOfferEntityV2Builder()
        .withRomeCode(boulangerRome)
        .withAppellationCode("10868") // Aide-boulanger / Aide-boulangère
        .build();
      const boulangerOffer2 = new ImmersionOfferEntityV2Builder()
        .withRomeCode(boulangerRome)
        .withAppellationCode("12006") // Chef boulanger / boulangère
        .build();
      const otherOffer = new ImmersionOfferEntityV2Builder()
        .withRomeCode("H2102")
        .build();
      const contact = new ContactEntityBuilder()
        .withGeneratedContactId()
        .build();

      await pgEstablishmentAggregateRepository.insertEstablishmentAggregates([
        new EstablishmentAggregateBuilder()
          .withEstablishment(establishment)
          .withImmersionOffers([boulangerOffer1, boulangerOffer2, otherOffer])
          .withContact(contact)
          .build(),
      ]);

      // Act
      const actualSearchResultDto =
        await pgEstablishmentAggregateRepository.getSearchImmersionResultDtoBySiretAndRome(
          siret,
          boulangerRome,
        );
      // Assert
      expectToEqual(actualSearchResultDto, {
        rome: boulangerRome,
        romeLabel: "Boulangerie - viennoiserie",
        appellations: [
          {
            appellationLabel: "Aide-boulanger / Aide-boulangère",
            appellationCode: "10868",
          },
          {
            appellationLabel: "Chef boulanger / boulangère",
            appellationCode: "12006",
          },
        ],
        naf: establishment.nafDto.code,
        nafLabel: "Fabrication de pain et de pâtisserie fraîche",
        siret,
        name: establishment.name,
        customizedName: establishment.customizedName,
        website: establishment.website,
        additionalInformation: establishment.additionalInformation,
        voluntaryToImmersion: establishment.voluntaryToImmersion,
        fitForDisabledWorkers: establishment.fitForDisabledWorkers,
        position: establishment.position,
        address: establishment.address,
        numberOfEmployeeRange: establishment.numberEmployeesRange,
        contactMode: contact.contactMethod,
        distance_m: undefined,
      });
    });

    it("Returns reconstructed SearchImmersionResultDto for given siret and rome when no appellation and no contact is specified", async () => {
      // Prepare
      const siret = "12345678901234";
      const establishment = new EstablishmentEntityBuilder()
        .withSiret(siret)
        .withCustomizedName("La boulangerie de Lucie")
        .withNafDto({ code: "1071Z", nomenclature: "NAFRev2" })
        .withAddress(rueJacquardDto)
        .build();
      const offerWithRomeButNoAppellation = new ImmersionOfferEntityV2Builder()
        .withRomeCode("H2102")
        .build();
      await pgEstablishmentAggregateRepository.insertEstablishmentAggregates([
        new EstablishmentAggregateBuilder()
          .withEstablishment(establishment)
          .withImmersionOffers([offerWithRomeButNoAppellation])
          .withoutContact()
          .build(),
      ]);

      // Act
      const actualSearchResultDto =
        await pgEstablishmentAggregateRepository.getSearchImmersionResultDtoBySiretAndRome(
          siret,
          "H2102",
        );

      // Assert
      expectToEqual(actualSearchResultDto, {
        rome: "H2102",
        romeLabel: "Conduite d'équipement de production alimentaire",
        appellations: [
          {
            appellationLabel: "Styliste",
            appellationCode: "19540",
          },
        ],
        naf: establishment.nafDto.code,
        nafLabel: "Fabrication de pain et de pâtisserie fraîche",
        siret,
        name: establishment.name,
        customizedName: establishment.customizedName,
        website: establishment.website,
        additionalInformation: establishment.additionalInformation,
        voluntaryToImmersion: establishment.voluntaryToImmersion,
        fitForDisabledWorkers: undefined,
        position: establishment.position,
        address: establishment.address,
        numberOfEmployeeRange: establishment.numberEmployeesRange,
        contactMode: undefined,
        distance_m: undefined,
      });
    });

    describe("Pg implementation of method  getEstablishmentAggregateBySiret", () => {
      const siret = "12345678901234";

      it("Returns undefined if no aggregate exists with given siret", async () => {
        // Act
        const retrievedAggregate =
          await pgEstablishmentAggregateRepository.getEstablishmentAggregateBySiret(
            siret,
          );
        // Assert
        expect(retrievedAggregate).toBeUndefined();
      });

      it("Retrieves an existing aggregate given its siret", async () => {
        // Prepare
        const establishmentAggregate = new EstablishmentAggregateBuilder()
          .withEstablishment(
            new EstablishmentEntityBuilder()
              .withSiret(siret)
              .withFitForDisabledWorkers(true)
              .withUpdatedAt(new Date("2020-01-05T23:00:00"))
              .build(),
          )
          .withImmersionOffers([
            new ImmersionOfferEntityV2Builder()
              .withAppellationCode("10900") // Appellation given
              .withAppellationLabel("Aide-viticulteur / Aide-viticultrice")
              .withRomeCode("A1401")
              .build(),
            new ImmersionOfferEntityV2Builder().withRomeCode("A1402").build(), // No appellation
          ])
          .build();

        await pgEstablishmentAggregateRepository.insertEstablishmentAggregates([
          establishmentAggregate,
        ]);
        // Act
        const retrievedAggregate =
          await pgEstablishmentAggregateRepository.getEstablishmentAggregateBySiret(
            siret,
          );
        // Assert
        expect(retrievedAggregate).toBeDefined();
        expectAggregateEqual(retrievedAggregate!, establishmentAggregate);
      });
    });

    describe("Pg implementation of method updateEstablishmentAggregate", () => {
      const updatedAt = new Date("2022-01-05T23:00:00.000Z");
      const existingSiret = "12345678901234";
      const existingEstablishmentAggregate = new EstablishmentAggregateBuilder()
        .withEstablishmentSiret(existingSiret)
        .withImmersionOffers([
          new ImmersionOfferEntityV2Builder() // Offer with code A1401 and an appellation
            .withAppellationCode("10806")
            .withAppellationLabel("Aide agricole en arboriculture")
            .withRomeCode("A1401")
            .build(),
          new ImmersionOfferEntityV2Builder() // Offer with code A1401 and an appellation
            .withAppellationCode("10900")
            .withAppellationLabel("Aide-viticulteur / Aide-viticultrice")
            .withRomeCode("A1401")
            .build(),
          new ImmersionOfferEntityV2Builder() // Offer with code A1402 without an appellation
            .withRomeCode("A1402")
            .build(),
        ])
        .build();

      beforeEach(async () => {
        // Prepare: insert an existing aggregate
        await pgEstablishmentAggregateRepository.insertEstablishmentAggregates([
          existingEstablishmentAggregate,
        ]);
      });

      it("Throws if the siret does not exist in base", async () => {
        const aggregateNotInBase = new EstablishmentAggregateBuilder()
          .withEstablishmentSiret("11111111111111")
          .build();

        await expectPromiseToFailWith(
          pgEstablishmentAggregateRepository.updateEstablishmentAggregate(
            aggregateNotInBase,
            updatedAt,
          ),
          `We do not have an establishment with siret 11111111111111 to update`,
        );
      });

      it("Updates offers: removes some and creates some", async () => {
        // Act
        const updatedAggregate: EstablishmentAggregate = {
          ...existingEstablishmentAggregate,
          immersionOffers: [
            new ImmersionOfferEntityV2Builder() // New offer to create
              .withAppellationCode("17892")
              .withAppellationLabel("Porteur / Porteuse de hottes")
              .withRomeCode("A1401")
              .build(),
            existingEstablishmentAggregate.immersionOffers[2], // Existing offer to keep
          ],
        };
        await pgEstablishmentAggregateRepository.updateEstablishmentAggregate(
          updatedAggregate,
          updatedAt,
        );

        // Assert
        const retrievedAggregate =
          await pgEstablishmentAggregateRepository.getEstablishmentAggregateBySiret(
            existingSiret,
          );
        expect(retrievedAggregate).toBeDefined();
        expectAggregateEqual(retrievedAggregate!, updatedAggregate);
      });

      it("Updates establishment informations", async () => {
        // Act
        const updatedAggregate: EstablishmentAggregate = {
          ...existingEstablishmentAggregate,
          establishment: {
            siret: existingSiret,
            name: "New name",
            address: rueGuillaumeTellDto,
            customizedName: "a new customize name",
            isCommited: true,
            sourceProvider: "immersion-facile",
            voluntaryToImmersion: true,
            position: { lat: 8, lon: 30 },
            nafDto: { code: "8539B", nomenclature: "NAFRev3" },
            numberEmployeesRange: "100-199",
            isOpen: true,
            isSearchable: false,
            website: "www.updated-website.fr",
            additionalInformation: "Some additional informations",
            maxContactsPerWeek: 7,
          },
        };
        await pgEstablishmentAggregateRepository.updateEstablishmentAggregate(
          updatedAggregate,
          updatedAt,
        );
        // Assert
        const retrievedAggregate =
          await pgEstablishmentAggregateRepository.getEstablishmentAggregateBySiret(
            existingSiret,
          );
        expect(retrievedAggregate).toBeDefined();
        const expectedAggregate = {
          ...updatedAggregate,
          establishment: { ...updatedAggregate.establishment, updatedAt },
        };
        expectAggregateEqual(retrievedAggregate!, expectedAggregate);
      });

      it("Updates immersion contact but keeps the same id", async () => {
        // Act
        const updatedAggregate: EstablishmentAggregate = {
          ...existingEstablishmentAggregate,
          contact: {
            id: "11111111-d654-4d0d-8fa6-2febefbe953d",
            lastName: "Boitier",
            firstName: "Anne",
            email: "anne.boitier@email.fr",
            job: "la big boss",
            phone: "0600335980",
            contactMethod: "PHONE",
            copyEmails: ["olivia.baini@email.fr"],
          },
        };
        await pgEstablishmentAggregateRepository.updateEstablishmentAggregate(
          updatedAggregate,
          updatedAt,
        );
        // Assert
        const retrievedAggregate =
          await pgEstablishmentAggregateRepository.getEstablishmentAggregateBySiret(
            existingSiret,
          );

        expect(retrievedAggregate).toBeDefined();
        const expectedAggregate = {
          ...updatedAggregate,
          contact: {
            ...updatedAggregate.contact!,
            id: existingEstablishmentAggregate.contact!.id,
          },
        };
        expectAggregateEqual(retrievedAggregate!, expectedAggregate);
      });
    });

    describe("markEstablishmentAsSearchableWhenRecentDiscussionAreUnderMaxContactPerWeek", () => {
      let pgDiscussionRepository: PgDiscussionAggregateRepository;
      const siret1 = "11110000111100";
      const siret2 = "22220000222200";
      const siret3 = "33330000333300";
      const siret4 = "44440000444400";
      const since = new Date("2021-01-02T00:00:00.000Z");

      beforeEach(async () => {
        await client.query("DELETE FROM discussions");
        pgDiscussionRepository = new PgDiscussionAggregateRepository(client);
        const establishment1 = new EstablishmentAggregateBuilder()
          .withEstablishmentSiret(siret1)
          .withIsSearchable(false)
          .withMaxContactsPerWeek(4)
          .build();
        const establishment2 = new EstablishmentAggregateBuilder()
          .withEstablishmentSiret(siret2)
          .withContactId("11111111-1111-1111-1111-111111111111")
          .withIsSearchable(false)
          .withMaxContactsPerWeek(2)
          .build();
        const establishment3 = new EstablishmentAggregateBuilder()
          .withEstablishmentSiret(siret3)
          .withContactId("22222222-2222-2222-2222-222222222222")
          .withIsSearchable(false)
          .withMaxContactsPerWeek(2)
          .build();
        const establishment4 = new EstablishmentAggregateBuilder()
          .withEstablishmentSiret(siret4)
          .withContactId("33333333-3333-3333-3333-333333333333")
          .withIsSearchable(false)
          .withMaxContactsPerWeek(1)
          .build();

        await pgEstablishmentAggregateRepository.insertEstablishmentAggregates([
          establishment1,
          establishment2,
          establishment3,
          establishment4,
        ]);

        await Promise.all([
          pgDiscussionRepository.insert(
            new DiscussionAggregateBuilder()
              .withId("00001111-1111-1111-1111-000000000000")
              .withImmersionObjective("Confirmer un projet professionnel")
              .withSiret(siret1)
              .withCreatedAt(new Date("2021-01-01T00:00:00.000Z"))
              .build(),
          ),
          pgDiscussionRepository.insert(
            new DiscussionAggregateBuilder()
              .withId("11111111-1111-1111-1111-000000000000")
              .withImmersionObjective("Confirmer un projet professionnel")
              .withSiret(siret2)
              .withCreatedAt(new Date("2021-01-11T00:00:00.000Z"))
              .build(),
          ),
          pgDiscussionRepository.insert(
            new DiscussionAggregateBuilder()
              .withId("22222222-2222-2222-2222-000000000000")
              .withImmersionObjective("Confirmer un projet professionnel")
              .withSiret(siret2)
              .withCreatedAt(new Date("2021-01-11T00:00:00.000Z"))
              .build(),
          ),
          pgDiscussionRepository.insert(
            new DiscussionAggregateBuilder()
              .withId("33333333-8888-3333-3333-000000000000")
              .withSiret(siret3)
              .withAppellationCode(
                defaultValidImmersionOfferEntityV2.appellationCode,
              )
              .withCreatedAt(new Date("2021-01-01T00:00:00.000Z"))
              .build(),
          ),
          pgDiscussionRepository.insert(
            new DiscussionAggregateBuilder()
              .withId("44444444-4444-4444-4444-000000000000")
              .withSiret(siret4)
              .withAppellationCode(
                defaultValidImmersionOfferEntityV2.appellationCode,
              )

              .withCreatedAt(new Date("2021-01-03T00:00:00.000Z"))
              .build(),
          ),
        ]);
      });

      it("updates establishments back to is_searchable when discussion are old enough", async () => {
        const numberOfEstablishmentUpdated =
          await pgEstablishmentAggregateRepository.markEstablishmentAsSearchableWhenRecentDiscussionAreUnderMaxContactPerWeek(
            since,
          );

        expect(numberOfEstablishmentUpdated).toBe(2);

        const expectEstablishmentToHaveIsSearchable = async (
          siret: string,
          isSearchable: boolean,
        ) => {
          const establishmentAfterUpdate =
            await pgEstablishmentAggregateRepository.getEstablishmentAggregateBySiret(
              siret,
            );
          expect(establishmentAfterUpdate!.establishment.isSearchable).toBe(
            isSearchable,
          );
        };

        await expectEstablishmentToHaveIsSearchable(siret1, true);
        await expectEstablishmentToHaveIsSearchable(siret2, false);
        await expectEstablishmentToHaveIsSearchable(siret3, true);
        await expectEstablishmentToHaveIsSearchable(siret4, false);
      });
    });

    describe("getSiretsOfEstablishmentsNotCheckedAtInseeSince", () => {
      it("gets only the siret where last insee check date is to old or null", async () => {
        const siret1 = "11110000111100";
        const siret2 = "22220000222200";
        const siret3 = "33330000333300";
        const checkDate = new Date("2023-06-16T00:00:00.000Z");

        await pgEstablishmentAggregateRepository.insertEstablishmentAggregates([
          new EstablishmentAggregateBuilder()
            .withContactId("11111111-1111-4000-1111-111111111111")
            .withEstablishmentSiret(siret1)
            .withEstablishmentLastInseeCheckDate(subDays(checkDate, 1))
            .build(),
          new EstablishmentAggregateBuilder()
            .withContactId("22222222-2222-4000-2222-222222222222")
            .withEstablishmentSiret(siret2)
            .withEstablishmentLastInseeCheckDate(addDays(checkDate, 1))
            .build(),
          new EstablishmentAggregateBuilder()
            .withContactId("33333333-3333-4000-3333-333333333333")
            .withEstablishmentSiret(siret3)
            .withEstablishmentLastInseeCheckDate(undefined)
            .build(),
        ]);

        const siretsToUpdate =
          await pgEstablishmentAggregateRepository.getSiretsOfEstablishmentsNotCheckedAtInseeSince(
            checkDate,
            10,
          );

        expectToEqual(siretsToUpdate, [siret1, siret3]);
      });
    });

    describe("updateEstablishmentsWithInseeData", () => {
      it("updates the establishments corresponding to the given sirets, with the given params", async () => {
        const siret1 = "11110000111100";
        const siret2 = "22220000222200";
        const siret3 = "33330000333300";
        const checkDate = new Date("2023-06-16T00:00:00.000Z");

        const establishment1 = new EstablishmentAggregateBuilder()
          .withContactId("11111111-1111-4000-1111-111111111111")
          .withEstablishmentSiret(siret1)
          .withEstablishmentLastInseeCheckDate(subDays(checkDate, 1))
          .build();
        const establishment2 = new EstablishmentAggregateBuilder()
          .withContactId("22222222-2222-4000-2222-222222222222")
          .withEstablishmentSiret(siret2)
          .withEstablishmentLastInseeCheckDate(addDays(checkDate, 1))
          .build();
        const establishment3 = new EstablishmentAggregateBuilder()
          .withContactId("33333333-3333-4000-3333-333333333333")
          .withEstablishmentSiret(siret3)
          .withEstablishmentLastInseeCheckDate(undefined)
          .build();

        await pgEstablishmentAggregateRepository.insertEstablishmentAggregates([
          establishment1,
          establishment2,
          establishment3,
        ]);

        const inseeCheckDate = new Date("2023-07-16T00:00:00.000Z");

        const updateFromInseeParams: UpdateEstablishmentsWithInseeDataParams = {
          [siret1]: {
            isOpen: false,
            name: "The new business name",
            nafDto: { code: "12345", nomenclature: "Naf nomenclature yolo" },
            numberEmployeesRange: "3-5",
          },
          [siret2]: {
            isOpen: true,
            nafDto: { code: "22222", nomenclature: "Naf nomenclature yolo" },
            numberEmployeesRange: "3-5",
          },
          [siret3]: {},
        };

        await pgEstablishmentAggregateRepository.updateEstablishmentsWithInseeData(
          inseeCheckDate,
          updateFromInseeParams,
        );

        const updatedEstablishment1 =
          await pgEstablishmentAggregateRepository.getEstablishmentAggregateBySiret(
            siret1,
          );

        expectToEqual(
          updatedEstablishment1!.establishment,
          new EstablishmentEntityBuilder(establishment1.establishment)
            .withIsOpen(updateFromInseeParams[siret1]!.isOpen!)
            .withName(updateFromInseeParams[siret1]!.name!)
            .withNafDto(updateFromInseeParams[siret1]!.nafDto!)
            .withNumberOfEmployeeRange(
              updateFromInseeParams[siret1]!.numberEmployeesRange!,
            )
            .withLastInseeCheck(inseeCheckDate)
            .build(),
        );

        const updatedEstablishment2 =
          await pgEstablishmentAggregateRepository.getEstablishmentAggregateBySiret(
            siret2,
          );

        expectToEqual(
          updatedEstablishment2!.establishment,
          new EstablishmentEntityBuilder(establishment2.establishment)
            .withIsOpen(updateFromInseeParams[siret2]!.isOpen!)
            .withNafDto(updateFromInseeParams[siret2]!.nafDto!)
            .withNumberOfEmployeeRange(
              updateFromInseeParams[siret2]!.numberEmployeesRange!,
            )
            .withLastInseeCheck(inseeCheckDate)
            .build(),
        );

        const updatedEstablishment3 =
          await pgEstablishmentAggregateRepository.getEstablishmentAggregateBySiret(
            siret3,
          );

        expectToEqual(
          updatedEstablishment3!.establishment,
          new EstablishmentEntityBuilder(establishment3.establishment)
            .withLastInseeCheck(inseeCheckDate)
            .build(),
        );
      });

      it("updates the establishments corresponding to the given sirets, event with 1000 establishments to update", async () => {
        const checkDate = new Date("2023-06-16T00:00:00.000Z");
        const {
          updateData,
          aggregates,
        }: {
          updateData: UpdateEstablishmentsWithInseeDataParams;
          aggregates: EstablishmentAggregate[];
        } = Array.from({ length: 1000 }).reduce(
          (
            acc: {
              updateData: UpdateEstablishmentsWithInseeDataParams;
              aggregates: EstablishmentAggregate[];
            },
            _,
            index,
          ) => {
            const paddedId = `${index}`.padStart(12, "0");
            const siret = `00${paddedId}`;

            return {
              updateData: {
                ...acc.updateData,
                [siret]: {
                  // eslint-disable-next-line jest/no-if
                  ...(index < 2
                    ? {
                        isOpen: false,
                        name: "The new business name",
                        nafDto: {
                          code: "12345",
                          nomenclature: "Naf nomenclature yolo",
                        },
                        numberEmployeesRange: "3-5",
                      }
                    : {}),
                },
              },
              aggregates: [
                ...acc.aggregates,
                new EstablishmentAggregateBuilder()
                  .withContactId("11111111-1111-4000-0000-" + paddedId)
                  .withEstablishmentSiret(siret)
                  .withEstablishmentLastInseeCheckDate(subDays(checkDate, 1))
                  .build(),
              ],
            };
          },
          {
            updateData: {} satisfies UpdateEstablishmentsWithInseeDataParams,
            aggregates: [],
          } satisfies {
            updateData: UpdateEstablishmentsWithInseeDataParams;
            aggregates: EstablishmentAggregate[];
          },
        );

        await pgEstablishmentAggregateRepository.insertEstablishmentAggregates(
          aggregates,
        );

        const inseeCheckDate = new Date("2023-07-16T00:00:00.000Z");

        await pgEstablishmentAggregateRepository.updateEstablishmentsWithInseeData(
          inseeCheckDate,
          updateData,
        );

        const updatedEstablishment1 =
          await pgEstablishmentAggregateRepository.getEstablishmentAggregateBySiret(
            aggregates[0].establishment.siret,
          );

        const updatedEstablishment1Params =
          updateData[aggregates[0].establishment.siret];

        expectToEqual(
          updatedEstablishment1!.establishment,
          new EstablishmentEntityBuilder(aggregates[0].establishment)
            .withIsOpen(updatedEstablishment1Params!.isOpen!)
            .withName(updatedEstablishment1Params!.name!)
            .withNafDto(updatedEstablishment1Params!.nafDto!)
            .withNumberOfEmployeeRange(
              updatedEstablishment1Params!.numberEmployeesRange!,
            )
            .withLastInseeCheck(inseeCheckDate)
            .build(),
        );

        const updatedEstablishment3 =
          await pgEstablishmentAggregateRepository.getEstablishmentAggregateBySiret(
            aggregates[2].establishment.siret,
          );

        const updatedEstablishment3Params =
          updateData[aggregates[2].establishment.siret];

        expectToEqual(updatedEstablishment3Params, {});

        expectToEqual(
          updatedEstablishment3!.establishment,
          new EstablishmentEntityBuilder(aggregates[2].establishment)
            .withIsOpen(aggregates[2]!.establishment.isOpen!)
            .withName(aggregates[2]!.establishment.name!)
            .withNafDto(aggregates[2]!.establishment.nafDto!)
            .withNumberOfEmployeeRange(
              aggregates[2]!.establishment.numberEmployeesRange!,
            )
            .withLastInseeCheck(inseeCheckDate)
            .build(),
        );
      });
    });
  });
});
