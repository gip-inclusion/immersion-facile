import { Pool, PoolClient } from "pg";
import { prop, sortBy } from "ramda";
import {
  AppellationAndRomeDto,
  Location,
  SearchResultDto,
  SiretDto,
  expectArraysToEqualIgnoringOrder,
  expectArraysToMatch,
  expectPromiseToFailWithError,
  expectToEqual,
} from "shared";
import { SearchMade } from "../../../../domain/offer/entities/SearchMadeEntity";
import { NotFoundError } from "../../../primary/helpers/httpErrors";
import {
  rueBitcheDto,
  rueGuillaumeTellDto,
  rueJacquardDto,
} from "../../addressGateway/InMemoryAddressGateway";
import {
  ContactEntityBuilder,
  EstablishmentAggregateBuilder,
  EstablishmentEntityBuilder,
  OfferEntityBuilder,
} from "../../offer/InMemoryEstablishmentAggregateRepository";
import { KyselyDb, makeKyselyDb } from "../kysely/kyselyUtils";
import { getTestPgPool } from "../pgUtils";
import { PgEstablishmentAggregateRepository } from "./PgEstablishmentAggregateRepository";
import {
  InsertActiveEstablishmentAndOfferAndEventuallyContactProps,
  PgEstablishmentRow,
  getAllEstablishmentImmersionContactsRows,
  getAllEstablishmentsRows,
  getAllImmersionContactsRows,
  getAllImmersionOfferRows,
  getEstablishmentsRowsBySiret,
  insertActiveEstablishmentAndOfferAndEventuallyContact,
  insertEstablishment,
  insertImmersionOffer,
} from "./PgEstablishmentAggregateRepository.test.helpers";

const cartographeImmersionOffer = new OfferEntityBuilder()
  .withAppellationCode("11704")
  .withAppellationLabel("Cartographe")
  .withRomeCode("M1808")
  .build();
const analysteEnGeomatiqueImmersionOffer = new OfferEntityBuilder()
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
  let transaction: KyselyDb;
  let pgEstablishmentAggregateRepository: PgEstablishmentAggregateRepository;

  beforeAll(async () => {
    pool = getTestPgPool();
    client = await pool.connect();
    transaction = makeKyselyDb(pool);
  });

  beforeEach(async () => {
    await client.query("DELETE FROM immersion_contacts");
    await client.query("DELETE FROM discussions");
    await client.query("DELETE FROM establishments");

    pgEstablishmentAggregateRepository = new PgEstablishmentAggregateRepository(
      transaction,
    );
  });

  afterAll(async () => {
    client.release();
    await pool.end();
  });

  describe("searchImmersionResults", () => {
    const searchedPosition = { lat: 49, lon: 6 };
    const notMatchingRome = "B1805";
    const farFromSearchedPosition = { lat: 32, lon: 89 };
    const cartographeSearchMade: SearchMade = {
      appellationCodes: [cartographeImmersionOffer.appellationCode],
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
        const establishmentsAndOffers: InsertActiveEstablishmentAndOfferAndEventuallyContactProps[] =
          [
            {
              siret: "78000403200029",
              rome: "A1101",
              establishmentPosition: searchedPosition, // Position matching
              appellationCode: "11987",
              createdAt: new Date(),
            },
            {
              siret: "79000403200029",
              rome: "A1201",
              establishmentPosition: searchedPosition, // Position matching
              appellationCode: "12755",
              createdAt: new Date(),
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
        const searchResult: SearchResultDto[] =
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
          createdAt: new Date(),
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
            createdAt: new Date(),
          }, // Position not matching
        );

        // Act
        const searchResult: SearchResultDto[] =
          await pgEstablishmentAggregateRepository.searchImmersionResults({
            searchMade: searchMadeWithoutRome,
          });

        const expectedResult: Partial<SearchResultDto>[] = [
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

    describe("if 'establishmentSearchableBy' parameter is defined", () => {
      const siret1 = "12345678901234";
      const siret2 = "12345677654321";
      const siret3 = "09876543211234";

      const sirets = [siret1, siret2, siret3];

      beforeEach(async () => {
        await insertEstablishment(client, {
          siret: siret1,
          position: searchedPosition,
          // no need to provide searchableByStudents, searchableByJobSeekers, it should default to true
          createdAt: new Date(),
        });

        await insertEstablishment(client, {
          siret: siret2,
          position: searchedPosition,
          searchableByStudents: true,
          searchableByJobSeekers: false,
          createdAt: new Date(),
        });

        await insertEstablishment(client, {
          siret: siret3,
          position: searchedPosition,
          searchableByStudents: false,
          searchableByJobSeekers: true,
          createdAt: new Date(),
        });

        await Promise.all(
          sirets.map(async (siret) =>
            insertImmersionOffer(client, {
              romeCode: cartographeImmersionOffer.romeCode,
              // biome-ignore lint/style/noNonNullAssertion:
              appellationCode: cartographeSearchMade.appellationCodes![0],
              siret,
              offerCreatedAt: new Date("2022-05-05"),
            }),
          ),
        );
      });

      it('return only establishment searchable by student if "establishmentSearchableBy" parameter is defined to students', async () => {
        const searchResultsOnlyForStudents =
          await pgEstablishmentAggregateRepository.searchImmersionResults({
            searchMade: {
              ...cartographeSearchMade,
              establishmentSearchableBy: "students",
            },
          });

        expectArraysToEqualIgnoringOrder(
          searchResultsOnlyForStudents,
          toSearchResults([siret2, siret1]),
        );
      });

      it('return only establishment searchable by student if "establishmentSearchableBy" parameter is defined to jobSeekers', async () => {
        const searchResultsOnlyForStudents =
          await pgEstablishmentAggregateRepository.searchImmersionResults({
            searchMade: {
              ...cartographeSearchMade,
              establishmentSearchableBy: "jobSeekers",
            },
          });

        expectArraysToEqualIgnoringOrder(
          searchResultsOnlyForStudents,
          toSearchResults([siret3, siret1]),
        );
      });

      it('return all establishments if "establishmentSearchableBy" parameter is not defined', async () => {
        const searchResultsOnlyForStudents =
          await pgEstablishmentAggregateRepository.searchImmersionResults({
            searchMade: cartographeSearchMade,
          });

        expectArraysToEqualIgnoringOrder(
          searchResultsOnlyForStudents,
          toSearchResults([siret2, siret1, siret3]),
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
        createdAt: new Date(),
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
        createdAt: new Date(),
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
          locationId: "123",
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
        createdAt: new Date(),
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
        createdAt: new Date(),
      });

      // Establishment with offer with searched rome but oustide geographical area
      await insertActiveEstablishmentAndOfferAndEventuallyContact(client, {
        siret: "99000403200029",
        establishmentPosition: farFromSearchedPosition,
        rome: analysteEnGeomatiqueImmersionOffer.romeCode,
        appellationCode: analysteEnGeomatiqueImmersionOffer.appellationCode,
        createdAt: new Date(),
      });

      // Act
      const searchResult: SearchResultDto[] =
        await pgEstablishmentAggregateRepository.searchImmersionResults({
          searchMade: cartographeSearchMade,
        });

      // Assert : one match and defined contact details
      expect(searchResult).toHaveLength(1);

      const expectedResult: Partial<SearchResultDto> = {
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

      const searchResultsWithOverriddenRomeCode: SearchResultDto[] =
        await pgEstablishmentAggregateRepository.searchImmersionResults({
          searchMade: { ...cartographeSearchMade, romeCode: "A1010" },
        });
      expectToEqual(searchResultsWithOverriddenRomeCode, []);
    });

    it("if sorted=distance, returns closest establishments in first", async () => {
      // Prepare : establishment in geographical area but not active
      const closeSiret = "99000403200029";
      const farSiret = "11000403200029";

      await insertEstablishment(client, {
        siret: closeSiret,
        position: searchedPosition,
        createdAt: new Date(),
      });
      await insertEstablishment(client, {
        siret: farSiret,
        position: {
          lon: searchedPosition.lon + 0.01,
          lat: searchedPosition.lat + 0.01,
        },
        createdAt: new Date(),
      });
      await insertImmersionOffer(client, {
        romeCode: cartographeImmersionOffer.romeCode,
        siret: closeSiret,
        // biome-ignore lint/style/noNonNullAssertion:
        appellationCode: cartographeSearchMade.appellationCodes![0],
      });
      await insertImmersionOffer(client, {
        romeCode: cartographeImmersionOffer.romeCode,
        siret: farSiret,
        // biome-ignore lint/style/noNonNullAssertion:
        appellationCode: cartographeSearchMade.appellationCodes![0],
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
          createdAt: new Date(),
        }),
        insertEstablishment(client, {
          siret: oldOfferSiret,
          position: searchedPosition,
          createdAt: new Date(),
        }),
      ]);

      await Promise.all([
        insertImmersionOffer(client, {
          romeCode: cartographeImmersionOffer.romeCode,
          // biome-ignore lint/style/noNonNullAssertion:
          appellationCode: cartographeSearchMade.appellationCodes![0],
          siret: recentOfferSiret,
          offerCreatedAt: new Date("2022-05-05"),
        }),
        insertImmersionOffer(client, {
          romeCode: cartographeImmersionOffer.romeCode,
          // biome-ignore lint/style/noNonNullAssertion:
          appellationCode: cartographeSearchMade.appellationCodes![0],
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

    it("when multiple appellationCodes, returns the two related immersion-offers", async () => {
      // Prepare : establishment in geographical area but not active
      const establishmentSiret1 = "99000403200029";
      const establishmentSiret2 = "11000403200029";

      await Promise.all([
        insertEstablishment(client, {
          siret: establishmentSiret1,
          position: searchedPosition,
          createdAt: new Date(),
        }),
        insertEstablishment(client, {
          siret: establishmentSiret2,
          position: searchedPosition,
          createdAt: new Date(),
        }),
      ]);

      await Promise.all([
        insertImmersionOffer(client, {
          romeCode: cartographeImmersionOffer.romeCode,
          appellationCode: cartographeImmersionOffer.appellationCode,
          siret: establishmentSiret1,
          offerCreatedAt: new Date("2022-05-05"),
        }),
        insertImmersionOffer(client, {
          romeCode: analysteEnGeomatiqueImmersionOffer.romeCode,
          appellationCode: analysteEnGeomatiqueImmersionOffer.appellationCode,
          siret: establishmentSiret2,
          offerCreatedAt: new Date("2022-05-02"),
        }),
      ]);

      // Act
      const searchResult =
        await pgEstablishmentAggregateRepository.searchImmersionResults({
          searchMade: {
            ...cartographeSearchMade,
            sortedBy: "date",
            appellationCodes: [
              cartographeImmersionOffer.appellationCode,
              analysteEnGeomatiqueImmersionOffer.appellationCode,
            ],
          },
        });

      // Assert
      expect(searchResult[0].siret).toEqual(establishmentSiret1);
      expect(searchResult[1].siret).toEqual(establishmentSiret2);
    });

    it("provide next availability date on result if establishment entity have it", async () => {
      const aggregate = new EstablishmentAggregateBuilder()
        .withEstablishmentNextAvailabilityDate(new Date())
        .build();

      await pgEstablishmentAggregateRepository.insertEstablishmentAggregates([
        aggregate,
      ]);

      const searchResults =
        await pgEstablishmentAggregateRepository.searchImmersionResults({
          searchMade: {
            ...aggregate.establishment.locations[0].position,
            appellationCodes: [aggregate.offers[0].appellationCode],
            distanceKm: 0,
            sortedBy: "date",
          },
          maxResults: 2,
        });

      expectArraysToMatch(searchResults, [
        {
          nextAvailabilityDate: aggregate.establishment.nextAvailabilityDate,
        },
      ]);
    });
  });

  describe("insertEstablishmentAggregates", () => {
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
          // street_number_and_address:
          //   establishmentToInsert.address.streetNumberAndAddress,
          // post_code: establishmentToInsert.address.postcode,
          // city: establishmentToInsert.address.city,
          // department_code: establishmentToInsert.address.departmentCode,
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
            .withOffers([new OfferEntityBuilder().build()])
            .build(),
          new EstablishmentAggregateBuilder()
            .withEstablishmentSiret(siret2)
            .withOffers([new OfferEntityBuilder().build()])
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
        expectToEqual(await getAllImmersionContactsRows(client), [
          {
            uuid: contact.id,
            email: contact.email,
            phone: contact.phone,
            lastname: contact.lastName,
            firstname: contact.firstName,
            job: contact.job,
            contact_mode: "EMAIL",
            copy_emails: contact.copyEmails,
          },
        ]);
        expectToEqual(await getAllEstablishmentImmersionContactsRows(client), [
          {
            contact_uuid: contact.id,
            establishment_siret: siret1,
          },
        ]);
      });

      it("adds as many row as immersion offers in table `immersion_offers`, each referencing the establishment siret and the contact uuid", async () => {
        // Arrange
        const offer1 = new OfferEntityBuilder()
          .withRomeCode("A1101")
          .withAppellationCode("19540")
          .build();
        const offer2 = new OfferEntityBuilder()
          .withRomeCode("A1201")
          .withAppellationCode("19541")
          .build();

        const contactId = "3ca6e619-d654-4d0d-8fa6-2febefbe953d";
        const establishmentAggregateToInsert =
          new EstablishmentAggregateBuilder()
            .withEstablishmentSiret(siret1)
            .withOffers([offer1, offer2])
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

  describe("hasEstablishmentFromFormWithSiret", () => {
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
        createdAt: new Date(),
      });
      // Act and assert
      expect(
        await pgEstablishmentAggregateRepository.hasEstablishmentWithSiret(
          siret,
        ),
      ).toBe(true);
    });
  });

  describe("getSiretsOfEstablishmentsWithRomeCode", () => {
    it("Returns a list of establishment sirets that have an offer with given rome", async () => {
      // Prepare
      const romeCode = "A1101";
      const siretWithRomeCodeOffer = "11111111111111";
      const siretWithoutRomeCodeOffer = "22222222222222";
      await pgEstablishmentAggregateRepository.insertEstablishmentAggregates([
        new EstablishmentAggregateBuilder()
          .withEstablishmentSiret(siretWithRomeCodeOffer)
          .withOffers([new OfferEntityBuilder().withRomeCode(romeCode).build()])
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

  describe("delete", () => {
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
      const establishmentAggregate = new EstablishmentAggregateBuilder()
        .withSearchableBy({
          students: false,
          jobSeekers: false,
        })
        .build();

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
      expectToEqual(await getAllEstablishmentImmersionContactsRows(client), []);
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
            createdAt: new Date(),
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

  describe("getOffersAsAppelationDtoForFormEstablishment", () => {
    const siretInTable = "12345678901234";
    const establishment = new EstablishmentEntityBuilder()
      .withSiret(siretInTable)
      .withLocations([
        {
          address: rueGuillaumeTellDto,
          position: { lon: 2, lat: 48 },
          id: "123",
        },
      ])
      .build();
    const contact = new ContactEntityBuilder()
      .withEmail("toto@gmail.com")
      .build();
    const offers = [
      new OfferEntityBuilder()
        .withRomeCode("A1101") // Code only, no appellation
        .withAppellationCode("11987")
        .build(),
      new OfferEntityBuilder()
        .withRomeCode("A1101")
        .withAppellationCode("12862")
        .build(),
    ];
    beforeEach(async () => {
      const aggregate = new EstablishmentAggregateBuilder()
        .withEstablishment(establishment)
        .withContact(contact)
        .withOffers(offers)
        .withSearchableBy({
          students: true,
          jobSeekers: false,
        })
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
          appellationCode: offers[0].appellationCode?.toString(),
          appellationLabel: "Chauffeur / Chauffeuse de machines agricoles",
        },
        {
          romeCode: offers[1].romeCode,
          romeLabel: "Conduite d'engins agricoles et forestiers",
          appellationCode: offers[1].appellationCode?.toString(),
          appellationLabel: "Conducteur / Conductrice d'abatteuses",
        },
      ]);
    });
  });

  describe("getSearchImmersionResultDtoBySiretAndAppellation", () => {
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
        .withLocations([
          {
            address: rueJacquardDto,
            position: { lon: 2, lat: 48 },
            id: "123",
          },
        ])
        .withSearchableBy({
          students: false,
          jobSeekers: false,
        })
        .build();
      const boulangerOffer1 = new OfferEntityBuilder()
        .withRomeCode(boulangerRome)
        .withAppellationCode("10868") // Aide-boulanger / Aide-boulangère
        .build();
      const boulangerOffer2 = new OfferEntityBuilder()
        .withRomeCode(boulangerRome)
        .withAppellationCode("12006") // Chef boulanger / boulangère
        .build();
      const otherOffer = new OfferEntityBuilder().withRomeCode("H2102").build();
      const contact = new ContactEntityBuilder()
        .withGeneratedContactId()
        .build();
      const location: Location = {
        address: rueJacquardDto,
        position: { lon: 2, lat: 48 },
        id: "123",
      };

      await pgEstablishmentAggregateRepository.insertEstablishmentAggregates([
        new EstablishmentAggregateBuilder()
          .withEstablishment(establishment)
          .withOffers([boulangerOffer1, boulangerOffer2, otherOffer])
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
        position: location.position,
        address: location.address,
        numberOfEmployeeRange: establishment.numberEmployeesRange,
        contactMode: contact.contactMethod,
        distance_m: undefined,
        locationId: location.id,
      });
    });
  });
});

const toSearchResults = (sirets: SiretDto[]): SearchResultDto[] =>
  sirets.map((siret) => ({
    rome: "M1808",
    siret,
    distance_m: 0,
    isSearchable: true,
    name: "",
    website: "",
    additionalInformation: "",
    position: { lon: 6, lat: 49 },
    romeLabel: "Information géographique",
    appellations: [
      { appellationCode: "11704", appellationLabel: "Cartographe" },
    ],
    naf: "8622B",
    nafLabel: "Activité des médecins spécialistes",
    address: {
      streetNumberAndAddress: "7 rue guillaume tell",
      postcode: "75017",
      city: "Paris",
      departmentCode: "75",
    },
    voluntaryToImmersion: true,
    locationId: "123",
  }));
