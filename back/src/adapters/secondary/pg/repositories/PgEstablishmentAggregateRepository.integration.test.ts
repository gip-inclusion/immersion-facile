import { Pool } from "pg";
import { prop, sortBy } from "ramda";
import {
  AppellationAndRomeDto,
  Location,
  SearchResultDto,
  expectArraysToEqualIgnoringOrder,
  expectArraysToMatch,
  expectObjectsToMatch,
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
  defaultLocation,
} from "../../offer/EstablishmentBuilders";
import { KyselyDb, makeKyselyDb } from "../kysely/kyselyUtils";
import { getTestPgPool } from "../pgUtils";
import { PgEstablishmentAggregateRepository } from "./PgEstablishmentAggregateRepository";
import {
  InsertEstablishmentAggregateProps,
  getAllEstablishmentImmersionContactsRows,
  getAllEstablishmentsRows,
  getAllImmersionContactsRows,
  getAllImmersionOfferRows,
  getEstablishmentsRowsBySiret,
  insertEstablishmentAggregate,
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

const cuvisteOffer = new OfferEntityBuilder()
  .withAppellationCode("140927")
  .withAppellationLabel("Cuviste")
  .withRomeCode("A1413")
  .build();

const artisteCirqueOffer = new OfferEntityBuilder()
  .withAppellationCode("11155")
  .withAppellationLabel("Artiste de cirque")
  .withRomeCode("L1204")
  .build();

const groomChevauxOffer = new OfferEntityBuilder()
  .withAppellationCode("140928")
  .withAppellationLabel("Groom chevaux")
  .withRomeCode("A1501")
  .build();

const bassompierreSaintesLocation = {
  id: "22222222-ee70-4c90-b3f4-668d492f7395",
  address: {
    city: "Saintes",
    postcode: "17100",
    streetNumberAndAddress: "8 Place bassompierre",
    departmentCode: "17",
  },
  position: {
    lat: 45.7424192,
    lon: -0.6293045,
  },
};

const portHubleChaniersLocation = {
  id: "22222222-ee70-4c90-b3f4-668d492f7396",
  address: {
    city: "Chaniers",
    postcode: "17610",
    streetNumberAndAddress: "Le Port Hublé, 2 Chem. des Métrelles",
    departmentCode: "17",
  },
  position: {
    lat: 45.7285766,
    lon: -0.5878595,
  },
};

const tourDeLaChaineLaRochelleLocation = {
  id: "33333333-ee70-4c90-b3f4-668d492f7354",
  address: {
    streetNumberAndAddress: "Tour de la chaîne",
    postcode: "17000",
    city: "La Rochelle",
    departmentCode: "17",
  },
  position: {
    lat: 46.1556411,
    lon: -1.153885,
  },
};
const veauxLocation = {
  id: "33333333-ee70-4c90-b3f4-668d492f7395",
  address: rueJacquardDto,
  position: {
    lat: 45.7636093,
    lon: 4.9209047,
  },
};

describe("PgEstablishmentAggregateRepository", () => {
  let pool: Pool;
  let kyselyDb: KyselyDb;
  let pgEstablishmentAggregateRepository: PgEstablishmentAggregateRepository;

  beforeAll(async () => {
    pool = getTestPgPool();
    kyselyDb = makeKyselyDb(pool);
  });

  beforeEach(async () => {
    await kyselyDb.deleteFrom("immersion_contacts").execute();
    await kyselyDb.deleteFrom("immersion_offers").execute();
    await kyselyDb.deleteFrom("discussions").execute();
    await kyselyDb.deleteFrom("establishments_locations").execute();
    await kyselyDb.deleteFrom("establishments").execute();

    pgEstablishmentAggregateRepository = new PgEstablishmentAggregateRepository(
      kyselyDb,
    );
  });

  afterAll(async () => {
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
        const establishmentsAndOffers = [
          {
            siret: "78000403200029",
            romeAndAppellationCodes: [
              { romeCode: "A1101", appellationCode: "11987" },
            ],
            establishmentPosition: searchedPosition, // Position matching
            createdAt: new Date(),
          },
          {
            siret: "79000403200029",
            romeAndAppellationCodes: [
              { romeCode: "A1101", appellationCode: "11987" },
            ],
            establishmentPosition: searchedPosition, // Position matching
            createdAt: new Date(),
          },
        ] satisfies InsertEstablishmentAggregateProps[];

        // Prepare
        await Promise.all(
          establishmentsAndOffers.map((establishmentsAndOffer, index) =>
            insertEstablishmentAggregate(
              pgEstablishmentAggregateRepository,
              establishmentsAndOffer,
              index,
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
        await insertEstablishmentAggregate(
          pgEstablishmentAggregateRepository,
          {
            siret: "78000403200029",
            romeAndAppellationCodes: [
              {
                romeCode: "A1101",
                appellationCode: "20404", // Appellation : Tractoriste agricole; Tractoriste agricole
              },
              {
                romeCode: "A1101", // Same rome and establishment as offer
                appellationCode: "17751", // Appellation : Pilote de machines d'abattage;Pilote de machines d'abattage
              },
            ],
            establishmentPosition: searchedPosition,
            createdAt: new Date(),
          },
          0,
        );

        /// Establishment oustide geographical are
        await insertEstablishmentAggregate(
          pgEstablishmentAggregateRepository,
          {
            siret: "99000403200029",
            romeAndAppellationCodes: [
              {
                romeCode: "A1101",
                appellationCode: "12862",
              },
            ],
            establishmentPosition: farFromSearchedPosition,
            createdAt: new Date(),
          },
          1,
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
      it("returns only offers with locations within geographical area without rome code given", async () => {
        const establishmentAggregate1 = new EstablishmentAggregateBuilder()
          .withEstablishmentSiret("78000403200029")
          .withContactId("11111111-1111-4444-1111-111111110001")
          .withOffers([cuvisteOffer, artisteCirqueOffer])
          .withLocations([
            bassompierreSaintesLocation,
            // outside geographical area
            veauxLocation,
          ])
          .build();

        const establishmentAggregate2 = new EstablishmentAggregateBuilder()
          .withEstablishmentSiret("78000403200030")
          .withContactId("11111111-1111-4444-1111-111111110002")
          .withOffers([
            cartographeImmersionOffer,
            cuvisteOffer,
            groomChevauxOffer,
          ])
          .withLocations([
            portHubleChaniersLocation,
            tourDeLaChaineLaRochelleLocation,
          ])
          .build();

        // Prepare
        /// Two establishments located inside geographical area
        await pgEstablishmentAggregateRepository.insertEstablishmentAggregate(
          establishmentAggregate1,
        );

        await pgEstablishmentAggregateRepository.insertEstablishmentAggregate(
          establishmentAggregate2,
        );

        // Act
        const searchResults: SearchResultDto[] =
          await pgEstablishmentAggregateRepository.searchImmersionResults({
            searchMade: {
              distanceKm: 100,
              // Center of Saintes
              lat: 45.7461575,
              lon: -0.728166,
            },
          });
        const readableResults = searchResults.map(toReadableSearchResult);
        expectArraysToEqualIgnoringOrder(readableResults, [
          {
            address: "Le Port Hublé, 2 Chem. des Métrelles 17610 Chaniers",
            rome: "A1501",
            distance_m: 52,
          },
          {
            address: "Tour de la chaîne 17000 La Rochelle",
            rome: "A1413",
            distance_m: 10,
          },
          {
            address: "Le Port Hublé, 2 Chem. des Métrelles 17610 Chaniers",
            rome: "A1413",
            distance_m: 10,
          },
          {
            address: "Le Port Hublé, 2 Chem. des Métrelles 17610 Chaniers",
            rome: "M1808",
            distance_m: 10,
          },
          {
            address: "8 Place bassompierre 17100 Saintes",
            rome: "L1204",
            distance_m: 10,
          },
          {
            address: "Tour de la chaîne 17000 La Rochelle",
            rome: "A1501",
            distance_m: 10,
          },
          {
            address: "8 Place bassompierre 17100 Saintes",
            rome: "A1413",
            distance_m: 10,
          },
          {
            address: "Tour de la chaîne 17000 La Rochelle",
            rome: "M1808",
            distance_m: 10,
          },
        ]);
      });
    });

    describe("if 'establishmentSearchableBy' parameter is defined", () => {
      const siret1 = "12345678901234";
      const siret2 = "12345677654321";
      const siret3 = "09876543211234";

      beforeEach(async () => {
        await Promise.all(
          [
            {
              siret: siret1,
              establishmentPosition: searchedPosition,
              // no need to provide searchableByStudents, searchableByJobSeekers, it should default to true
              createdAt: new Date(),
            },
            {
              siret: siret2,
              establishmentPosition: searchedPosition,
              searchableByStudents: true,
              searchableByJobSeekers: false,
              createdAt: new Date(),
            },
            {
              siret: siret3,
              establishmentPosition: searchedPosition,
              searchableByStudents: false,
              searchableByJobSeekers: true,
              createdAt: new Date(),
            },
          ].map((params, index) =>
            insertEstablishmentAggregate(
              pgEstablishmentAggregateRepository,
              {
                ...params,
                romeAndAppellationCodes: [
                  {
                    romeCode: cartographeImmersionOffer.romeCode,
                    // biome-ignore lint/style/noNonNullAssertion:
                    appellationCode: cartographeSearchMade.appellationCodes![0],
                  },
                ],
                offerCreatedAt: new Date("2022-05-05"),
              },
              index,
            ),
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
          searchResultsOnlyForStudents.map(({ siret }) => siret),
          [siret2, siret1],
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
          searchResultsOnlyForStudents.map(({ siret }) => siret),
          [siret1, siret3],
        );
      });

      it('return all establishments if "establishmentSearchableBy" parameter is not defined', async () => {
        const searchResultsOnlyForStudents =
          await pgEstablishmentAggregateRepository.searchImmersionResults({
            searchMade: cartographeSearchMade,
          });

        expectArraysToEqualIgnoringOrder(
          searchResultsOnlyForStudents.map(({ siret }) => siret),
          [siret2, siret1, siret3],
        );
      });
    });

    it("returns active establishments only", async () => {
      // Prepare : establishment in geographical area but not active
      const notActiveSiret = "78000403200029";

      await insertEstablishmentAggregate(pgEstablishmentAggregateRepository, {
        siret: notActiveSiret,
        establishmentPosition: searchedPosition,
        romeAndAppellationCodes: [
          {
            romeCode: cartographeImmersionOffer.romeCode,
            appellationCode: cartographeImmersionOffer.appellationCode,
          },
          {
            romeCode: hydrographeAppellationAndRome.romeCode,
            appellationCode: hydrographeAppellationAndRome.appellationCode,
          },
        ],
        createdAt: new Date(),
        isOpen: false,
      });

      // Act
      const searchWithNoRomeResult =
        await pgEstablishmentAggregateRepository.searchImmersionResults({
          searchMade: cartographeSearchMade,
        });
      // Assert
      expect(searchWithNoRomeResult).toHaveLength(0);
    });

    it("provide also non searchable establishments (so that usecase can prevent LBB results to be shown)", async () => {
      // Prepare : establishment in geographical area but not active
      const notSearchableSiret = "78000403200029";

      await insertEstablishmentAggregate(pgEstablishmentAggregateRepository, {
        siret: notSearchableSiret,
        establishmentPosition: searchedPosition,
        isSearchable: false,
        createdAt: new Date(),
        romeAndAppellationCodes: [
          {
            romeCode: cartographeImmersionOffer.romeCode,
            appellationCode: cartographeImmersionOffer.appellationCode,
          },
          {
            romeCode: hydrographeAppellationAndRome.romeCode,
            appellationCode: hydrographeAppellationAndRome.appellationCode,
          },
        ],
      });

      // Act
      const searchWithNoRomeResult =
        await pgEstablishmentAggregateRepository.searchImmersionResults({
          searchMade: cartographeSearchMade,
        });

      // Assert
      expectToEqual(
        searchWithNoRomeResult.map(({ siret }) => siret),
        [notSearchableSiret],
      );
    });

    it("returns one search DTO by establishment, with offers matching rome and geographical area", async () => {
      // Prepare
      /// Establishment with offer inside geographical area with searched rome
      const siretMatchingToSearch = "78000403200029";
      const matchingEstablishmentAddress = rueBitcheDto;
      const matchingNaf = "8622B";
      const matchingNumberOfEmployeeRange = "1-2";
      const locationId = "22222222-ee70-4c90-b3f4-668d492f7395";
      const matchingNafLabel = "Activité des médecins spécialistes";
      await insertEstablishmentAggregate(
        pgEstablishmentAggregateRepository,
        {
          siret: siretMatchingToSearch,
          locationId,
          romeAndAppellationCodes: [
            {
              romeCode: cartographeImmersionOffer.romeCode,
              appellationCode: cartographeImmersionOffer.appellationCode,
            },
            {
              romeCode: analysteEnGeomatiqueImmersionOffer.romeCode,
              appellationCode:
                analysteEnGeomatiqueImmersionOffer.appellationCode,
            },
          ],
          establishmentPosition: searchedPosition,
          offerContactUid: undefined,
          sourceProvider: "immersion-facile",
          address: matchingEstablishmentAddress,
          nafCode: matchingNaf,
          numberEmployeesRange: matchingNumberOfEmployeeRange,
          fitForDisabledWorkers: true,
          createdAt: new Date(),
        },
        0,
      );

      /// Establishment with offer inside geographical area but an other rome
      await insertEstablishmentAggregate(
        pgEstablishmentAggregateRepository,
        {
          siret: "88000403200029",
          establishmentPosition: searchedPosition,
          romeAndAppellationCodes: [
            {
              romeCode: notMatchingRome,
              appellationCode: "19540",
            },
          ],
          createdAt: new Date(),
        },
        1,
      );

      // Establishment with offer with searched rome but oustide geographical area
      await insertEstablishmentAggregate(
        pgEstablishmentAggregateRepository,
        {
          siret: "99000403200029",
          establishmentPosition: farFromSearchedPosition,
          romeAndAppellationCodes: [
            {
              romeCode: analysteEnGeomatiqueImmersionOffer.romeCode,
              appellationCode:
                analysteEnGeomatiqueImmersionOffer.appellationCode,
            },
          ],
          createdAt: new Date(),
        },
        2,
      );

      // Act
      const searchImmersionResults =
        await pgEstablishmentAggregateRepository.searchImmersionResults({
          searchMade: cartographeSearchMade,
        });

      // Assert : one match and defined contact details
      expect(searchImmersionResults).toHaveLength(1);

      expectToEqual(searchImmersionResults, [
        {
          name: "Company inside repository",
          siret: siretMatchingToSearch,
          isSearchable: true,
          locationId: locationId,
          rome: cartographeImmersionOffer.romeCode,
          romeLabel: "Information géographique",
          appellations: [
            {
              appellationLabel:
                analysteEnGeomatiqueImmersionOffer.appellationLabel,
              appellationCode:
                analysteEnGeomatiqueImmersionOffer.appellationCode,
            },
            {
              appellationLabel: cartographeImmersionOffer.appellationLabel,
              appellationCode: cartographeImmersionOffer.appellationCode,
            },
          ],
          distance_m: 0,
          voluntaryToImmersion: true,
          contactMode: "EMAIL",
          address: matchingEstablishmentAddress,
          numberOfEmployeeRange: "1-2",
          naf: matchingNaf,
          nafLabel: matchingNafLabel,
          position: searchedPosition,
          fitForDisabledWorkers: true,
          website: "",
          additionalInformation: "",
        },
      ]);

      const searchResultsWithOverriddenRomeCode: SearchResultDto[] =
        await pgEstablishmentAggregateRepository.searchImmersionResults({
          searchMade: { ...cartographeSearchMade, romeCode: "A1010" },
        });
      expectToEqual(searchResultsWithOverriddenRomeCode, []);
    });

    it("returns offers for geographical area with rome given for establishment aggregate with multiple locations", async () => {
      const establishmentAggregate1 = new EstablishmentAggregateBuilder()
        .withEstablishmentSiret("78000403200029")
        .withContactId("11111111-1111-4444-1111-111111110001")
        .withOffers([cuvisteOffer, artisteCirqueOffer])
        .withLocations([
          bassompierreSaintesLocation,
          // outside geographical area
          veauxLocation,
        ])
        .build();
      const establishmentAggregate2 = new EstablishmentAggregateBuilder()
        .withEstablishmentSiret("78000403200030")
        .withContactId("11111111-1111-4444-1111-111111110002")
        .withOffers([
          cartographeImmersionOffer,
          cuvisteOffer,
          groomChevauxOffer,
        ])
        .withLocations([
          portHubleChaniersLocation,
          // outside geographical area (52km)
          tourDeLaChaineLaRochelleLocation,
        ])
        .build();

      // Prepare
      /// Two establishments located inside geographical area
      await pgEstablishmentAggregateRepository.insertEstablishmentAggregate(
        establishmentAggregate1,
      );

      await pgEstablishmentAggregateRepository.insertEstablishmentAggregate(
        establishmentAggregate2,
      );

      // Act
      const searchResults: SearchResultDto[] =
        await pgEstablishmentAggregateRepository.searchImmersionResults({
          searchMade: {
            distanceKm: 50,
            // Center of Saintes
            lat: 45.7461575,
            lon: -0.728166,
            romeCode: "A1413",
          },
        });
      const readableResults = searchResults.map(toReadableSearchResult);
      expectArraysToEqualIgnoringOrder(readableResults, [
        {
          address: "8 Place bassompierre 17100 Saintes",
          rome: "A1413",
          distance_m: 0,
        },
        {
          address: "Le Port Hublé, 2 Chem. des Métrelles 17610 Chaniers",
          rome: "A1413",
          distance_m: 10,
        },
      ]);
    });

    it("returns empty array for offers of establishment with multiple locations without matching rome code", async () => {
      const establishmentAggregate1 = new EstablishmentAggregateBuilder()
        .withEstablishmentSiret("78000403200029")
        .withContactId("11111111-1111-4444-1111-111111110001")
        .withOffers([cuvisteOffer, artisteCirqueOffer])
        .withLocations([
          bassompierreSaintesLocation,
          // outside geographical area
          veauxLocation,
        ])
        .build();
      const establishmentAggregate2 = new EstablishmentAggregateBuilder()
        .withEstablishmentSiret("78000403200030")
        .withContactId("11111111-1111-4444-1111-111111110002")
        .withOffers([
          cartographeImmersionOffer,
          cuvisteOffer,
          groomChevauxOffer,
        ])
        .withLocations([
          portHubleChaniersLocation,
          // outside geographical area (52km)
          tourDeLaChaineLaRochelleLocation,
        ])
        .build();

      // Prepare
      /// Two establishments located inside geographical area
      await pgEstablishmentAggregateRepository.insertEstablishmentAggregate(
        establishmentAggregate1,
      );

      await pgEstablishmentAggregateRepository.insertEstablishmentAggregate(
        establishmentAggregate2,
      );

      // Act
      const searchResults: SearchResultDto[] =
        await pgEstablishmentAggregateRepository.searchImmersionResults({
          searchMade: {
            distanceKm: 100,
            // Center of Saintes
            lat: 45.7461575,
            lon: -0.728166,
            romeCode: "H2206",
          },
        });
      const readableResults = searchResults.map(toReadableSearchResult);
      expectArraysToEqualIgnoringOrder(readableResults, []);
    });

    it("if sorted=distance, returns closest establishments in first", async () => {
      // Prepare : establishment in geographical area but not active
      const closeSiret = "99000403200029";
      const farSiret = "11000403200029";

      await insertEstablishmentAggregate(
        pgEstablishmentAggregateRepository,
        {
          siret: closeSiret,
          establishmentPosition: searchedPosition,
          createdAt: new Date(),
          romeAndAppellationCodes: [
            {
              romeCode: cartographeImmersionOffer.romeCode,
              appellationCode: cartographeImmersionOffer.appellationCode,
            },
          ],
        },
        0,
      );

      await insertEstablishmentAggregate(
        pgEstablishmentAggregateRepository,
        {
          siret: farSiret,
          establishmentPosition: {
            lon: searchedPosition.lon + 0.01,
            lat: searchedPosition.lat + 0.01,
          },
          createdAt: new Date(),
          romeAndAppellationCodes: [
            {
              romeCode: cartographeImmersionOffer.romeCode,
              appellationCode: cartographeImmersionOffer.appellationCode,
            },
          ],
        },
        1,
      );

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

      await Promise.all(
        [
          { siret: recentOfferSiret, offerCreatedAt: new Date("2022-05-05") },
          {
            siret: oldOfferSiret,
            offerCreatedAt: new Date("2022-05-02"),
          },
        ].map((params, index) =>
          insertEstablishmentAggregate(
            pgEstablishmentAggregateRepository,
            {
              siret: params.siret,
              establishmentPosition: searchedPosition,
              createdAt: new Date(),
              romeAndAppellationCodes: [
                {
                  romeCode: cartographeImmersionOffer.romeCode,
                  appellationCode: cartographeImmersionOffer.appellationCode,
                },
              ],
              offerCreatedAt: params.offerCreatedAt,
            },
            index,
          ),
        ),
      );

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

      await Promise.all(
        [
          {
            siret: establishmentSiret1,
            appellationCode: cartographeImmersionOffer.appellationCode,
            romeCode: cartographeImmersionOffer.romeCode,
            offerCreatedAt: new Date("2022-05-05"),
          },
          {
            siret: establishmentSiret2,
            appellationCode: analysteEnGeomatiqueImmersionOffer.appellationCode,
            romeCode: analysteEnGeomatiqueImmersionOffer.romeCode,
            offerCreatedAt: new Date("2022-05-02"),
          },
        ].map((params, index) =>
          insertEstablishmentAggregate(
            pgEstablishmentAggregateRepository,
            {
              siret: params.siret,
              romeAndAppellationCodes: [
                {
                  romeCode: params.romeCode,
                  appellationCode: params.appellationCode,
                },
              ],
              offerCreatedAt: params.offerCreatedAt,
              createdAt: new Date(),
              establishmentPosition: searchedPosition,
            },
            index,
          ),
        ),
      );

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

      await pgEstablishmentAggregateRepository.insertEstablishmentAggregate(
        aggregate,
      );

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
      it("adds the establishment values in `establishments` table when one new establishment is given", async () => {
        // Prepare
        const establishmentToInsert = new EstablishmentEntityBuilder()
          .withMaxContactsPerWeek(7)
          .withLastInseeCheck(new Date("2020-04-14T12:00:00.000"))
          .build();

        // Act;
        await pgEstablishmentAggregateRepository.insertEstablishmentAggregate(
          new EstablishmentAggregateBuilder()
            .withEstablishment(establishmentToInsert)
            .build(),
        );
        // Assert
        const actualEstablishmentRows =
          await getAllEstablishmentsRows(kyselyDb);
        expect(actualEstablishmentRows).toHaveLength(1);
        expectObjectsToMatch(actualEstablishmentRows[0], {
          siret: establishmentToInsert.siret,
          name: establishmentToInsert.name,
          customized_name: establishmentToInsert.customizedName ?? null,
          is_commited: establishmentToInsert.isCommited ?? null,
          number_employees: establishmentToInsert.numberEmployeesRange,
          naf_code: establishmentToInsert.nafDto.code,
          naf_nomenclature: establishmentToInsert.nafDto.nomenclature,
          update_date: establishmentToInsert.updatedAt,
          is_open: establishmentToInsert.isOpen,
          max_contacts_per_week: establishmentToInsert.maxContactsPerWeek,
          last_insee_check_date: establishmentToInsert.lastInseeCheckDate,
        });
      });

      it("adds one new row per establishment in `establishments` table when multiple establishments are given", async () => {
        // Act
        await pgEstablishmentAggregateRepository.insertEstablishmentAggregate(
          new EstablishmentAggregateBuilder()
            .withEstablishment(
              new EstablishmentEntityBuilder()
                .withSiret(siret1)
                .withLocations([
                  {
                    id: "22222222-ee70-4c90-b3f4-668d492f7395",
                    position: { lat: 49, lon: 6 },
                    address: rueGuillaumeTellDto,
                  },
                ])
                .build(),
            )
            .withOffers([new OfferEntityBuilder().build()])
            .build(),
        );
        await pgEstablishmentAggregateRepository.insertEstablishmentAggregate(
          new EstablishmentAggregateBuilder()
            .withEstablishmentSiret(siret2)
            .withOffers([new OfferEntityBuilder().build()])
            .withGeneratedContactId()
            .build(),
        );
        // Assert
        const establishmentsRows = await getAllEstablishmentsRows(kyselyDb);
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
        await pgEstablishmentAggregateRepository.insertEstablishmentAggregate(
          new EstablishmentAggregateBuilder()
            .withEstablishmentSiret(siret1)
            .withContact(contact)
            .build(),
        );

        // Assert
        expectToEqual(await getAllImmersionContactsRows(kyselyDb), [
          {
            uuid: contact.id,
            email: contact.email,
            phone: contact.phone,
            lastname: contact.lastName,
            firstname: contact.firstName,
            job: contact.job,
            contact_mode: "EMAIL",
            copy_emails: contact.copyEmails as any,
          },
        ]);
        expectToEqual(
          await getAllEstablishmentImmersionContactsRows(kyselyDb),
          [
            {
              contact_uuid: contact.id,
              establishment_siret: siret1,
            },
          ],
        );
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
        await pgEstablishmentAggregateRepository.insertEstablishmentAggregate(
          establishmentAggregateToInsert,
        );

        // Assert

        expectToEqual(await getAllImmersionOfferRows(kyselyDb), [
          {
            rome_code: offer1.romeCode,
            score: offer1.score,
            siret: siret1,
            appellation_code: parseInt(offer1.appellationCode),
          },
          {
            rome_code: offer2.romeCode,
            score: offer2.score,
            siret: siret1,
            appellation_code: parseInt(offer2.appellationCode),
          },
        ]);
      });
    });
  });

  describe("updateEstablishmentAggregate", () => {
    it("updates the establishment values", async () => {
      // Prepare
      const originalEstablishmentAggregate =
        new EstablishmentAggregateBuilder().build();
      await pgEstablishmentAggregateRepository.insertEstablishmentAggregate(
        originalEstablishmentAggregate,
      );
      const updatedAt = new Date();
      const updatedAggregate = new EstablishmentAggregateBuilder()
        .withLocations([
          {
            id: "22222222-ee70-4c90-b3f4-668d492f7395",
            position: { lat: 49, lon: 6 },
            address: rueJacquardDto,
          },
          {
            id: "22222222-ee70-4c90-b3f4-668d492f7396",
            position: { lat: 49, lon: 6 },
            address: rueBitcheDto,
          },
        ])
        .withMaxContactsPerWeek(7)
        .withEstablishmentUpdatedAt(updatedAt)
        .build();

      await pgEstablishmentAggregateRepository.updateEstablishmentAggregate(
        updatedAggregate,
        updatedAt,
      );

      expectToEqual(
        await pgEstablishmentAggregateRepository.getEstablishmentAggregateBySiret(
          updatedAggregate.establishment.siret,
        ),
        updatedAggregate,
      );
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
      await insertEstablishmentAggregate(pgEstablishmentAggregateRepository, {
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

  describe("getSiretsOfEstablishmentsWithRomeCode", () => {
    it("Returns a list of establishment sirets that have an offer with given rome", async () => {
      // Prepare
      const romeCode = "A1101";
      const siretWithRomeCodeOfferMatching = "11111111111111";
      const siretWithoutRomeCodeOfferMatching = "22222222222222";

      await Promise.all(
        [
          {
            siret: siretWithRomeCodeOfferMatching,
            romeCode,
            appellationCode: "19540",
          },
          {
            siret: siretWithoutRomeCodeOfferMatching,
            romeCode: "A1201",
            appellationCode: "19541",
          },
        ].map((params, index) =>
          insertEstablishmentAggregate(
            pgEstablishmentAggregateRepository,
            {
              siret: params.siret,
              romeAndAppellationCodes: [
                {
                  romeCode: params.romeCode,
                  appellationCode: params.appellationCode,
                },
              ],
            },
            index,
          ),
        ),
      );

      // Act
      const actualSiretOfEstablishmentsWithRomeCode =
        await pgEstablishmentAggregateRepository.getSiretsOfEstablishmentsWithRomeCode(
          romeCode,
        );
      // Assert
      expect(actualSiretOfEstablishmentsWithRomeCode).toEqual([
        siretWithRomeCodeOfferMatching,
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

      await pgEstablishmentAggregateRepository.insertEstablishmentAggregate(
        establishmentAggregate,
      );
      expectToEqual(
        await pgEstablishmentAggregateRepository.getEstablishmentAggregateBySiret(
          establishmentAggregate.establishment.siret,
        ),
        establishmentAggregate,
      );

      await pgEstablishmentAggregateRepository.delete(
        establishmentAggregate.establishment.siret,
      );

      expectToEqual(await getAllImmersionOfferRows(kyselyDb), []);
      expectToEqual(await getAllImmersionContactsRows(kyselyDb), []);
      expectToEqual(
        await getAllEstablishmentImmersionContactsRows(kyselyDb),
        [],
      );
      expectToEqual(await getAllEstablishmentsRows(kyselyDb), []);
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
        [
          {
            siret: siretToKeep,
            romeAndAppellationsCodes: [
              { romeCode: "A1405", appellationCode: "17044" },
            ],
          },
          {
            siret: siretToRemove,
            romeAndAppellationsCodes: [
              { romeCode: "A1401", appellationCode: "10806" },
              { romeCode: "A1405", appellationCode: "12112" },
            ],
          },
        ].map((params, index) =>
          insertEstablishmentAggregate(
            pgEstablishmentAggregateRepository,
            {
              siret: params.siret,
              romeAndAppellationCodes: params.romeAndAppellationsCodes,
            },
            index,
          ),
        ),
      );

      // Act
      await pgEstablishmentAggregateRepository.delete(siretToRemove);
      // Assert
      //   Establishment has been removed
      expect(
        await getEstablishmentsRowsBySiret(kyselyDb, siretToRemove),
      ).toBeUndefined();
      expect(
        await getEstablishmentsRowsBySiret(kyselyDb, siretToKeep),
      ).toBeDefined();
      //   Offers of this establishment have been removed
      const immersionOfferRows = await getAllImmersionOfferRows(kyselyDb);
      expect(immersionOfferRows).toHaveLength(1);
      expect(immersionOfferRows[0].siret).toEqual(siretToKeep);
    });
  });

  describe("getOffersAsAppelationDtoForFormEstablishment", () => {
    const siretInTable = "12345678901234";
    const establishment = new EstablishmentEntityBuilder()
      .withSiret(siretInTable)
      .withLocations([defaultLocation])
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
      await pgEstablishmentAggregateRepository.insertEstablishmentAggregate(
        aggregate,
      );
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

  describe("getSearchImmersionResultDtoBySiretAndAppellationCode", () => {
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
      const extraLocation: Location = {
        address: rueJacquardDto,
        position: { lon: 2, lat: 48 },
        id: "55555555-5555-4444-5555-555555555555",
      };

      const establishment = new EstablishmentEntityBuilder()
        .withSiret(siret)
        .withCustomizedName("La boulangerie de Lucie")
        .withNafDto({ code: "1071Z", nomenclature: "NAFRev2" })
        .withLocations([defaultLocation, extraLocation])
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

      await pgEstablishmentAggregateRepository.insertEstablishmentAggregate(
        new EstablishmentAggregateBuilder()
          .withEstablishment(establishment)
          .withOffers([boulangerOffer1, boulangerOffer2, otherOffer])
          .withContact(contact)
          .build(),
      );

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
        position: extraLocation.position,
        address: extraLocation.address,
        numberOfEmployeeRange: establishment.numberEmployeesRange,
        contactMode: contact.contactMethod,
        distance_m: undefined,
        locationId: extraLocation.id,
      });
    });
  });
});

const toReadableSearchResult = ({
  address,
  rome,
  distance_m,
}: SearchResultDto) => ({
  address: `${address?.streetNumberAndAddress} ${address?.postcode} ${address?.city}`,
  rome,
  distance_m,
});
