import { addMilliseconds, subDays } from "date-fns";
import { Pool } from "pg";
import {
  BadRequestError,
  DiscussionBuilder,
  Email,
  GeoPositionDto,
  Location,
  LocationBuilder,
  NotFoundError,
  RomeCode,
  SearchResultDto,
  WithAcquisition,
  expectArraysToEqualIgnoringOrder,
  expectArraysToMatch,
  expectPromiseToFailWithError,
  expectToEqual,
} from "shared";
import { v4 as uuid } from "uuid";
import { KyselyDb, makeKyselyDb } from "../../../config/pg/kysely/kyselyUtils";
import { getTestPgPool } from "../../../config/pg/pgUtils";
import {
  rueBitcheDto,
  rueGuillaumeTellDto,
  rueJacquardDto,
} from "../../core/address/adapters/InMemoryAddressGateway";
import { EstablishmentAggregate } from "../entities/EstablishmentEntity";
import { SearchMade } from "../entities/SearchMadeEntity";
import {
  ContactEntityBuilder,
  EstablishmentAggregateBuilder,
  EstablishmentEntityBuilder,
  OfferEntityBuilder,
  defaultLocation,
} from "../helpers/EstablishmentBuilders";
import { PgDiscussionRepository } from "./PgDiscussionRepository";
import { PgEstablishmentAggregateRepository } from "./PgEstablishmentAggregateRepository";
import {
  insertEstablishmentAggregate,
  makeExpectedSearchResult,
  sortSearchResultsByDistanceAndRomeAndSiretOnRandomResults,
} from "./PgEstablishmentAggregateRepository.test.helpers";

describe("PgEstablishmentAggregateRepository", () => {
  let pool: Pool;
  let kyselyDb: KyselyDb;
  let pgEstablishmentAggregateRepository: PgEstablishmentAggregateRepository;
  let pgDiscussionRepository: PgDiscussionRepository;

  beforeAll(() => {
    pool = getTestPgPool();
    kyselyDb = makeKyselyDb(pool);
  });

  beforeEach(async () => {
    await kyselyDb.deleteFrom("establishments_contacts").execute();
    await kyselyDb.deleteFrom("immersion_offers").execute();
    await kyselyDb.deleteFrom("discussions").execute();
    await kyselyDb.deleteFrom("establishments_locations").execute();
    await kyselyDb.deleteFrom("establishments").execute();

    pgEstablishmentAggregateRepository = new PgEstablishmentAggregateRepository(
      kyselyDb,
    );
    pgDiscussionRepository = new PgDiscussionRepository(kyselyDb);
  });

  afterAll(async () => {
    await pool.end();
  });

  describe("Offers", () => {
    describe("searchImmersionResults", () => {
      it("returns empty list when repo is empty", async () => {
        expectToEqual(
          await pgEstablishmentAggregateRepository.searchImmersionResults({
            searchMade: cartographeSearchMade,
          }),
          [],
        );
      });

      it("no location but keys provided in params - case occured from usecase without location", async () => {
        await pgEstablishmentAggregateRepository.insertEstablishmentAggregate(
          establishmentWithOfferA1101_AtPosition,
        );

        expectToEqual(
          await pgEstablishmentAggregateRepository.searchImmersionResults({
            searchMade: {
              lat: undefined,
              lon: undefined,
              distanceKm: undefined,
              sortedBy: "date",
              voluntaryToImmersion: true,
              place: undefined,
              appellationCodes: undefined,
              romeCode: undefined,
              establishmentSearchableBy: "jobSeekers",
              acquisitionCampaign: undefined,
              acquisitionKeyword: undefined,
            },
          }),
          [
            makeExpectedSearchResult({
              establishment: establishmentWithOfferA1101_AtPosition,
              withOffers: [offer_A1101_11987],
              withLocationAndDistance: {
                ...locationOfSearchPosition,
                distance: undefined,
              },
            }),
          ],
        );
      });

      describe("with `maxResults` parameter", () => {
        beforeEach(async () => {
          await pgEstablishmentAggregateRepository.insertEstablishmentAggregate(
            establishmentWithOfferA1101_AtPosition,
          );
          await pgEstablishmentAggregateRepository.insertEstablishmentAggregate(
            establishmentWithOfferA1101_close,
          );
          await pgEstablishmentAggregateRepository.insertEstablishmentAggregate(
            establishmentWithOfferA1101_far,
          );
        });

        it("returns 1 closest establishment with `maxResults` at 1", async () => {
          expectToEqual(
            await pgEstablishmentAggregateRepository.searchImmersionResults({
              searchMade: searchMadeDistanceWithoutRome,
              maxResults: 1,
            }),
            [
              makeExpectedSearchResult({
                establishment: establishmentWithOfferA1101_AtPosition,
                withOffers: [offer_A1101_11987],
                withLocationAndDistance: {
                  ...locationOfSearchPosition,
                  distance: 0,
                },
              }),
            ],
          );
        });

        it("returns 2 closest establishments with `maxResults` at 2", async () => {
          expectToEqual(
            await pgEstablishmentAggregateRepository.searchImmersionResults({
              searchMade: searchMadeDistanceWithoutRome,
              maxResults: 2,
            }),
            [
              makeExpectedSearchResult({
                establishment: establishmentWithOfferA1101_AtPosition,
                withOffers: [offer_A1101_11987],
                withLocationAndDistance: {
                  ...locationOfSearchPosition,
                  distance: 0,
                },
              }),
              makeExpectedSearchResult({
                establishment: establishmentWithOfferA1101_close,
                withOffers: [offer_A1101_11987],
                withLocationAndDistance: {
                  ...locationOfCloseSearchPosition,
                  distance: 133.12254555,
                },
              }),
            ],
          );
        });

        it("returns 2 closest establishments with `maxResults` at 3 without too far establishment", async () => {
          expectArraysToMatch(
            await pgEstablishmentAggregateRepository.searchImmersionResults({
              searchMade: searchMadeDistanceWithoutRome,
              maxResults: 3,
            }),
            [
              makeExpectedSearchResult({
                establishment: establishmentWithOfferA1101_AtPosition,
                withOffers: [offer_A1101_11987],
                withLocationAndDistance: {
                  ...locationOfSearchPosition,
                  distance: 0,
                },
              }),
              makeExpectedSearchResult({
                establishment: establishmentWithOfferA1101_close,
                withOffers: [offer_A1101_11987],
                withLocationAndDistance: {
                  ...locationOfCloseSearchPosition,
                  distance: 133.12254555,
                },
              }),
            ],
          );
        });
      });

      describe("SearchMade parameters", () => {
        describe("without 'romeCode' SearchMade parameter", () => {
          it("returns all establishments within geographical area", async () => {
            // Prepare
            const establishmentCloseWithA1101Offers =
              new EstablishmentAggregateBuilder(
                establishmentWithOfferA1101_AtPosition,
              )
                .withOffers([offer_A1101_20404, offer_A1101_17751])
                .build();
            const establishmentFarWithA1101Offers =
              new EstablishmentAggregateBuilder(establishmentWithOfferA1101_far)
                .withOffers([offer_A1101_12862])
                .build();

            await pgEstablishmentAggregateRepository.insertEstablishmentAggregate(
              establishmentCloseWithA1101Offers,
            );
            await pgEstablishmentAggregateRepository.insertEstablishmentAggregate(
              establishmentFarWithA1101Offers,
            );

            // Act & Assert
            expectToEqual(
              await pgEstablishmentAggregateRepository.searchImmersionResults({
                searchMade: searchMadeDistanceWithoutRome,
              }),
              [
                makeExpectedSearchResult({
                  establishment: establishmentCloseWithA1101Offers,
                  withOffers: [offer_A1101_17751, offer_A1101_20404],
                  withLocationAndDistance: {
                    ...locationOfSearchPosition,
                    distance: 0,
                  },
                }),
              ],
            );
          });

          it("returns only offers with locations within geographical area without rome code given", async () => {
            const establishmentAggregateAtSaintesAndVeaux =
              new EstablishmentAggregateBuilder()
                .withEstablishmentSiret("78000403200029")
                .withContactId(uuid())
                .withOffers([cuvisteOffer, artisteCirqueOffer])
                .withLocations([
                  bassompierreSaintesLocation,
                  veauxLocation, // outside geographical area
                ])
                .build();

            const establishmentAggregateAtChaniersAndLaRochelle =
              new EstablishmentAggregateBuilder()
                .withEstablishmentSiret("78000403200030")
                .withContactId(uuid())
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
              establishmentAggregateAtSaintesAndVeaux,
            );

            await pgEstablishmentAggregateRepository.insertEstablishmentAggregate(
              establishmentAggregateAtChaniersAndLaRochelle,
            );

            const saintesLocation: GeoPositionDto = {
              lat: 45.7461575,
              lon: -0.728166,
            };

            // Act
            const results =
              await pgEstablishmentAggregateRepository.searchImmersionResults({
                searchMade: {
                  sortedBy: "date",
                  distanceKm: 100,
                  ...saintesLocation,
                },
              });

            // Assert
            expectToEqual(
              results.sort(
                sortSearchResultsByDistanceAndRomeAndSiretOnRandomResults,
              ),
              [
                ...[cuvisteOffer, artisteCirqueOffer].map((offer) =>
                  makeExpectedSearchResult({
                    establishment: establishmentAggregateAtSaintesAndVeaux,
                    withOffers: [offer],
                    withLocationAndDistance: {
                      ...bassompierreSaintesLocation,
                      distance: 7704.55035665,
                    },
                  }),
                ),
                ...[
                  cartographeImmersionOffer,
                  cuvisteOffer,
                  groomChevauxOffer,
                ].map((offer) =>
                  makeExpectedSearchResult({
                    establishment:
                      establishmentAggregateAtChaniersAndLaRochelle,
                    withOffers: [offer],
                    withLocationAndDistance: {
                      ...portHubleChaniersLocation,
                      distance: 11093.36505388,
                    },
                  }),
                ),
                ...[
                  cartographeImmersionOffer,
                  cuvisteOffer,
                  groomChevauxOffer,
                ].map((offer) =>
                  makeExpectedSearchResult({
                    establishment:
                      establishmentAggregateAtChaniersAndLaRochelle,
                    withOffers: [offer],
                    withLocationAndDistance: {
                      ...tourDeLaChaineLaRochelleLocation,
                      distance: 56222.51061222,
                    },
                  }),
                ),
              ].sort(sortSearchResultsByDistanceAndRomeAndSiretOnRandomResults),
            );
          });
        });
      });

      describe("'establishmentSearchableBy' SearchMade parameter", () => {
        beforeEach(async () => {
          await pgEstablishmentAggregateRepository.insertEstablishmentAggregate(
            searchableByAllEstablishment,
          );
          await pgEstablishmentAggregateRepository.insertEstablishmentAggregate(
            searchableByStudentsEstablishment,
          );
          await pgEstablishmentAggregateRepository.insertEstablishmentAggregate(
            searchableByJobSeekerEstablishment,
          );
        });

        it(`with "establishmentSearchableBy:'students'" return only establishments SearchImmersionResults searchable by student`, async () => {
          const results =
            await pgEstablishmentAggregateRepository.searchImmersionResults({
              searchMade: {
                ...cartographeSearchMade,
                establishmentSearchableBy: "students",
              },
            });

          expectToEqual(
            results.sort(
              sortSearchResultsByDistanceAndRomeAndSiretOnRandomResults,
            ),
            [searchableByStudentsEstablishment, searchableByAllEstablishment]
              .map((establishment) =>
                makeExpectedSearchResult({
                  establishment: establishment,
                  withLocationAndDistance: {
                    ...establishment.establishment.locations[0],
                    distance: 0,
                  },
                  withOffers: establishment.offers,
                }),
              )
              .sort(sortSearchResultsByDistanceAndRomeAndSiretOnRandomResults),
          );
        });

        it(`with "establishmentSearchableBy:'jobSeekers'" return only establishments SearchImmersionResults searchable by jobseekers`, async () => {
          const results =
            await pgEstablishmentAggregateRepository.searchImmersionResults({
              searchMade: {
                ...cartographeSearchMade,
                establishmentSearchableBy: "jobSeekers",
              },
            });

          expectToEqual(
            results.sort(
              sortSearchResultsByDistanceAndRomeAndSiretOnRandomResults,
            ),
            [searchableByJobSeekerEstablishment, searchableByAllEstablishment]
              .map((establishment) =>
                makeExpectedSearchResult({
                  establishment: establishment,
                  withLocationAndDistance: {
                    ...establishment.establishment.locations[0],
                    distance: 0,
                  },
                  withOffers: establishment.offers,
                }),
              )
              .sort(sortSearchResultsByDistanceAndRomeAndSiretOnRandomResults),
          );
        });

        it('with"establishmentSearchableBy" not defined return all establishment SearchImmersionResults', async () => {
          const results =
            await pgEstablishmentAggregateRepository.searchImmersionResults({
              searchMade: cartographeSearchMade,
            });

          expectToEqual(
            results.sort(
              sortSearchResultsByDistanceAndRomeAndSiretOnRandomResults,
            ),
            [
              searchableByStudentsEstablishment,
              searchableByJobSeekerEstablishment,
              searchableByAllEstablishment,
            ]
              .map((establishment) =>
                makeExpectedSearchResult({
                  establishment: establishment,
                  withLocationAndDistance: {
                    ...establishment.establishment.locations[0],
                    distance: 0,
                  },
                  withOffers: establishment.offers,
                }),
              )
              .sort(sortSearchResultsByDistanceAndRomeAndSiretOnRandomResults),
          );
        });
      });

      it("returns active establishments only", async () => {
        // Prepare : establishment in geographical area but not active
        const notActiveSiret = "78000403200029";

        await insertEstablishmentAggregate(pgEstablishmentAggregateRepository, {
          siret: notActiveSiret,
          establishmentPosition: locationOfSearchPosition.position,
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
          establishmentPosition: locationOfSearchPosition.position,
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
            establishmentPosition: locationOfSearchPosition.position,
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
            establishmentPosition: locationOfSearchPosition.position,
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
            establishmentPosition: locationOfFarFromSearchedPosition.position,
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
                score: analysteEnGeomatiqueImmersionOffer.score,
              },
              {
                appellationLabel: cartographeImmersionOffer.appellationLabel,
                appellationCode: cartographeImmersionOffer.appellationCode,
                score: cartographeImmersionOffer.score,
              },
            ],
            distance_m: 0,
            voluntaryToImmersion: true,
            contactMode: "EMAIL",
            address: matchingEstablishmentAddress,
            numberOfEmployeeRange: "1-2",
            naf: matchingNaf,
            nafLabel: matchingNafLabel,
            position: locationOfSearchPosition.position,
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
              sortedBy: "date",
              distanceKm: 50,
              // Center of Saintes
              lat: 45.7461575,
              lon: -0.728166,
              romeCode: "A1413",
            },
          });
        const readableResults = searchResults.map(toReadableSearchResult);
        expectArraysToEqualIgnoringOrderAndRoundDistance(readableResults, [
          {
            address: "8 Place bassompierre 17100 Saintes",
            rome: "A1413",
            distance_m: 7_705,
          },
          {
            address: "Le Port Hublé, 2 Chem. des Métrelles 17610 Chaniers",
            rome: "A1413",
            distance_m: 11_093,
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
              sortedBy: "distance",
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

      describe("sorting", () => {
        it("if sorted=distance, returns closest establishments in first", async () => {
          const closeEstablishment = new EstablishmentAggregateBuilder()
            .withEstablishmentSiret("00000000000001")
            .withOffers([cartographeImmersionOffer])
            .withContactId(uuid())
            .withLocations([
              new LocationBuilder(locationOfSearchPosition)
                .withId(uuid())
                .build(),
            ])
            .build();

          const farEstablishment = new EstablishmentAggregateBuilder()
            .withEstablishmentSiret("00000000000002")
            .withOffers([cartographeImmersionOffer])
            .withContactId(uuid())
            .withLocations([
              new LocationBuilder(locationOfSearchPosition)

                .withPosition({
                  lat: locationOfSearchPosition.position.lat + 0.001,
                  lon: locationOfSearchPosition.position.lon + 0.001,
                })
                .withId(uuid())
                .build(),
            ])
            .build();

          await pgEstablishmentAggregateRepository.insertEstablishmentAggregate(
            closeEstablishment,
          );
          await pgEstablishmentAggregateRepository.insertEstablishmentAggregate(
            farEstablishment,
          );

          // Act
          const searchResult =
            await pgEstablishmentAggregateRepository.searchImmersionResults({
              searchMade: { ...cartographeSearchMade, sortedBy: "distance" },
              maxResults: 2,
            });

          // Assert
          expectToEqual(
            searchResult.map((result) => result.siret),
            [closeEstablishment, farEstablishment].map(
              ({ establishment }) => establishment.siret,
            ),
          );
        });

        it("if sorted=date, returns latest offers in first", async () => {
          const recentOfferEstablishment = new EstablishmentAggregateBuilder()
            .withEstablishmentSiret("00000000000001")
            .withContactId(uuid())
            .withOffers([
              new OfferEntityBuilder(cartographeImmersionOffer)
                .withCreatedAt(new Date("2022-05-05"))
                .build(),
            ])
            .withLocations([
              new LocationBuilder(locationOfSearchPosition)
                .withId(uuid())
                .build(),
            ])
            .build();

          const olderOfferEstablishment = new EstablishmentAggregateBuilder()
            .withEstablishmentSiret("00000000000002")
            .withContactId(uuid())
            .withOffers([
              new OfferEntityBuilder(cartographeImmersionOffer)
                .withCreatedAt(new Date("2022-05-02"))
                .build(),
            ])
            .withLocations([
              new LocationBuilder(locationOfSearchPosition)
                .withId(uuid())
                .build(),
            ])
            .build();

          await pgEstablishmentAggregateRepository.insertEstablishmentAggregate(
            recentOfferEstablishment,
          );
          await pgEstablishmentAggregateRepository.insertEstablishmentAggregate(
            olderOfferEstablishment,
          );

          // Act
          const searchResult =
            await pgEstablishmentAggregateRepository.searchImmersionResults({
              searchMade: { ...cartographeSearchMade, sortedBy: "date" },
              maxResults: 2,
            });

          // Assert
          expectToEqual(
            searchResult.map((result) => result.siret),
            [recentOfferEstablishment, olderOfferEstablishment].map(
              ({ establishment }) => establishment.siret,
            ),
          );
        });

        it("if sorted=score, returns offers with appellations that have better score first", async () => {
          const establishmentWithHighAndLowScore =
            new EstablishmentAggregateBuilder()
              .withEstablishmentSiret("00000000000001")
              .withContactId(uuid())
              .withLocations([
                {
                  id: uuid(),
                  position: locationOfSearchPosition.position,
                  address: {
                    city: "",
                    departmentCode: "",
                    postcode: "",
                    streetNumberAndAddress: "",
                  },
                },
              ])
              .withOffers([
                new OfferEntityBuilder(cartographeImmersionOffer)
                  .withScore(1)
                  .build(),
                new OfferEntityBuilder(analysteEnGeomatiqueImmersionOffer)
                  .withScore(10)
                  .build(),
              ])
              .build();

          const establishmentWithMediumScores =
            new EstablishmentAggregateBuilder()
              .withEstablishmentSiret("00000000000002")
              .withContactId(uuid())
              .withLocations([
                {
                  id: uuid(),
                  position: locationOfSearchPosition.position,
                  address: {
                    city: "",
                    departmentCode: "",
                    postcode: "",
                    streetNumberAndAddress: "",
                  },
                },
              ])
              .withOffers([
                new OfferEntityBuilder(cartographeImmersionOffer)
                  .withScore(6)
                  .build(),
                new OfferEntityBuilder(analysteEnGeomatiqueImmersionOffer)
                  .withScore(3)
                  .build(),
              ])
              .build();

          await Promise.all([
            pgEstablishmentAggregateRepository.insertEstablishmentAggregate(
              establishmentWithHighAndLowScore,
            ),
            pgEstablishmentAggregateRepository.insertEstablishmentAggregate(
              establishmentWithMediumScores,
            ),
          ]);

          // Act
          const searchResult =
            await pgEstablishmentAggregateRepository.searchImmersionResults({
              searchMade: { ...cartographeSearchMade, sortedBy: "score" },
            });
          // Assert
          expectToEqual(
            searchResult.map(({ siret }) => siret),
            [
              establishmentWithHighAndLowScore,
              establishmentWithMediumScores,
            ].map(({ establishment }) => establishment.siret),
          );
        });
      });

      it("when multiple appellationCodes, returns the two related immersion-offers", async () => {
        const establishmentWithMostRecentOffer =
          new EstablishmentAggregateBuilder()
            .withOffers([
              new OfferEntityBuilder(cartographeImmersionOffer)
                .withCreatedAt(new Date("2022-05-05"))
                .build(),
            ])
            .withEstablishmentSiret("99000403200029")
            .withLocations([
              new LocationBuilder(locationOfSearchPosition)
                .withId(uuid())
                .build(),
            ])
            .withContactId(uuid())
            .build();

        const establishmentWithMostOlderOffer =
          new EstablishmentAggregateBuilder()
            .withOffers([
              new OfferEntityBuilder(analysteEnGeomatiqueImmersionOffer)
                .withCreatedAt(new Date("2022-05-02"))
                .build(),
            ])
            .withEstablishmentSiret("11000403200029")
            .withLocations([
              new LocationBuilder(locationOfSearchPosition)
                .withId(uuid())
                .build(),
            ])
            .withContactId(uuid())
            .build();

        await pgEstablishmentAggregateRepository.insertEstablishmentAggregate(
          establishmentWithMostRecentOffer,
        );
        await pgEstablishmentAggregateRepository.insertEstablishmentAggregate(
          establishmentWithMostOlderOffer,
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
        expectToEqual(
          searchResult.map(({ siret }) => siret),
          [
            establishmentWithMostRecentOffer,
            establishmentWithMostOlderOffer,
          ].map(({ establishment }) => establishment.siret),
        );
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
      it("should return immersion offers even without lat/lon/distanceKm search", async () => {
        const establishmentAggregate = new EstablishmentAggregateBuilder()
          .withEstablishmentSiret("78000403200029")
          .withContactId("11111111-1111-4444-1111-111111110001")
          .withOffers([cuvisteOffer, artisteCirqueOffer])
          .withLocations([bassompierreSaintesLocation, veauxLocation])
          .build();

        // Prepare
        await pgEstablishmentAggregateRepository.insertEstablishmentAggregate(
          establishmentAggregate,
        );

        // Act
        const searchResults: SearchResultDto[] =
          await pgEstablishmentAggregateRepository.searchImmersionResults({
            searchMade: {
              sortedBy: "date",
            },
          });
        const readableResults = searchResults.map(toReadableSearchResult);

        // Assert
        expect(readableResults).toHaveLength(4);
      });

      describe("Wrong paths", () => {
        it("should throw on a search made with sortedBy distance and no geo params are provided", async () => {
          // Assert
          await expectPromiseToFailWithError(
            pgEstablishmentAggregateRepository.searchImmersionResults({
              searchMade: {
                sortedBy: "distance",
              },
            }),
            new BadRequestError(
              "Cannot search by distance with invalid geo params",
            ),
          );
        });
        it("should throw if only one of the geo params is provided (lat/lon/distanceKm)", async () => {
          // Assert
          await expectPromiseToFailWithError(
            pgEstablishmentAggregateRepository.searchImmersionResults({
              searchMade: {
                sortedBy: "distance",
                lat: 45,
              },
            }),
            new BadRequestError(
              "Cannot search by distance with invalid geo params",
            ),
          );
        });
        it("should throw if all geo params value is 0 and sorted by distance", async () => {
          // Assert
          await expectPromiseToFailWithError(
            pgEstablishmentAggregateRepository.searchImmersionResults({
              searchMade: {
                sortedBy: "distance",
                lat: 0,
                lon: 0,
                distanceKm: 0,
              },
            }),
            new BadRequestError(
              "Cannot search by distance with invalid geo params",
            ),
          );
        });

        it("should throw if all geo params value is 0 but distanceKm > 0 and sorted by distance", async () => {
          // Assert
          await expectPromiseToFailWithError(
            pgEstablishmentAggregateRepository.searchImmersionResults({
              searchMade: {
                sortedBy: "distance",
                lat: 0,
                lon: 0,
                distanceKm: 10,
              },
            }),
            new BadRequestError(
              "Cannot search by distance with invalid geo params",
            ),
          );
        });

        it("should throw if lat / lon are 0 but distanceKm is provided and not 0 and sorted by distance", async () => {
          // Assert
          await expectPromiseToFailWithError(
            pgEstablishmentAggregateRepository.searchImmersionResults({
              searchMade: {
                sortedBy: "distance",
                lat: 0,
                lon: 0,
                distanceKm: 10,
              },
            }),
            new BadRequestError(
              "Cannot search by distance with invalid geo params",
            ),
          );
        });
        it("should throw if one of the geo params value is 0", async () => {
          // Assert
          await expectPromiseToFailWithError(
            pgEstablishmentAggregateRepository.searchImmersionResults({
              searchMade: {
                sortedBy: "distance",
                lat: 0,
                lon: 45,
                distanceKm: 10,
              },
            }),
            new BadRequestError(
              "Cannot search by distance with invalid geo params",
            ),
          );
        });
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
          await pgEstablishmentAggregateRepository.getOffersAsAppellationAndRomeDtosBySiret(
            siretNotInTable,
          ),
        ).toHaveLength(0);
      });

      it("returns a list with offers from offers as AppellationDto of given siret", async () => {
        const actualOffersAsAppelationDto =
          await pgEstablishmentAggregateRepository.getOffersAsAppellationAndRomeDtosBySiret(
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

    describe("getSearchImmersionResultDtoBySearchQuery", () => {
      it("Returns undefined when no matching establishment or appellation code", async () => {
        const siretNotInTable = "11111111111111";

        expect(
          await pgEstablishmentAggregateRepository.getSearchImmersionResultDtoBySearchQuery(
            siretNotInTable,
            "14012",
            "55555555-5555-4444-5555-555555555555",
          ),
        ).toBeUndefined();
      });

      it("Returns undefined SearchImmersionResultDto for given siret, appellationCode and wrong location id", async () => {
        // Prepare
        const siret = "12345678901234";
        const boulangerRome = "D1102";
        const extraLocation: Location = {
          address: rueJacquardDto,
          position: { lon: 2, lat: 48 },
          id: "55555555-5555-4444-5555-555555555555",
        };
        const wrongLocationId = "55555555-5555-4444-5555-555555555666";

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
        const otherOffer = new OfferEntityBuilder()
          .withRomeCode("H2102")
          .build();
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
          await pgEstablishmentAggregateRepository.getSearchImmersionResultDtoBySearchQuery(
            siret,
            "12006",
            wrongLocationId,
          );
        // Assert
        expectToEqual(actualSearchResultDto, undefined);
      });

      it("Returns reconstructed SearchImmersionResultDto for given siret, appellationCode and location id", async () => {
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
        const otherOffer = new OfferEntityBuilder()
          .withRomeCode("H2102")
          .build();
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
          await pgEstablishmentAggregateRepository.getSearchImmersionResultDtoBySearchQuery(
            siret,
            "12006",
            "55555555-5555-4444-5555-555555555555",
          );
        // Assert
        expectToEqual(actualSearchResultDto, {
          rome: boulangerRome,
          romeLabel: "Boulangerie - viennoiserie",
          appellations: [
            {
              appellationLabel: "Chef boulanger / boulangère",
              appellationCode: "12006",
              score: 4.5,
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

  describe("EstablishmentAggregates", () => {
    describe("insertEstablishmentAggregates", () => {
      const siret1 = "11111111111111";
      const siret2 = "22222222222222";

      it("no establishment", async () => {
        expectToEqual(
          await pgEstablishmentAggregateRepository.getAllEstablishmentAggregates(),
          [],
        );
      });

      it("adds the establishment values in `establishments` table when one new establishment is given", async () => {
        const establishment = new EstablishmentAggregateBuilder()
          .withEstablishment(
            new EstablishmentEntityBuilder()
              .withMaxContactsPerMonth(24)
              .withLastInseeCheck(new Date("2020-04-14T12:00:00.000"))
              .build(),
          )
          .build();

        await pgEstablishmentAggregateRepository.insertEstablishmentAggregate(
          establishment,
        );

        expectToEqual(
          await pgEstablishmentAggregateRepository.getAllEstablishmentAggregates(),
          [establishment],
        );
      });

      it("adds the establishment values in `establishments` table and keeps acquisition params", async () => {
        const establishment = new EstablishmentAggregateBuilder()
          .withEstablishment(
            new EstablishmentEntityBuilder()
              .withMaxContactsPerMonth(24)
              .withLastInseeCheck(new Date("2020-04-14T12:00:00.000"))
              .build(),
          )
          .withAcquisition({
            acquisitionKeyword: "acquisition-keyword",
            acquisitionCampaign: "acquisition-campaign",
          })
          .build();

        await pgEstablishmentAggregateRepository.insertEstablishmentAggregate(
          establishment,
        );

        expectToEqual(
          await pgEstablishmentAggregateRepository.getAllEstablishmentAggregates(),
          [establishment],
        );
      });

      it("adds one new row per establishment in `establishments` table when multiple establishments are given", async () => {
        const establishments = [
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
          new EstablishmentAggregateBuilder()
            .withEstablishmentSiret(siret2)
            .withOffers([new OfferEntityBuilder().build()])
            .withGeneratedContactId()
            .build(),
        ];

        for (const establishment of establishments) {
          await pgEstablishmentAggregateRepository.insertEstablishmentAggregate(
            establishment,
          );
        }

        expectToEqual(
          await pgEstablishmentAggregateRepository.getAllEstablishmentAggregates(),
          establishments,
        );
      });

      it("adds a new row in contact table with contact referencing the establishment siret", async () => {
        const establishment = new EstablishmentAggregateBuilder()
          .withEstablishmentSiret(siret1)
          .withContact(
            new ContactEntityBuilder()
              .withId("3ca6e619-d654-4d0d-8fa6-2febefbe953d")
              .withContactMethod("EMAIL")
              .build(),
          )
          .build();

        await pgEstablishmentAggregateRepository.insertEstablishmentAggregate(
          establishment,
        );

        expectToEqual(
          await pgEstablishmentAggregateRepository.getAllEstablishmentAggregates(),
          [establishment],
        );
      });

      it("adds as many row as immersion offers in table `immersion_offers`, each referencing the establishment siret and the contact uuid", async () => {
        const establishment = new EstablishmentAggregateBuilder()
          .withEstablishmentSiret(siret1)
          .withOffers([
            //Normal que la query fonctionne lorsqu'on a une incohérance Code ROME <> Code appellation / OGR ?
            new OfferEntityBuilder()
              .withRomeLabel("Bûcheronnage et élagage")
              .withRomeCode("A1201")
              .withAppellationLabel("Styliste")
              .withAppellationCode("19540")
              .build(),
            new OfferEntityBuilder()
              .withRomeLabel("Conduite d'engins agricoles et forestiers")
              .withRomeCode("A1101")
              .withAppellationCode("19541")
              .withAppellationLabel("Styliste chaussure")
              .build(),
          ])
          .withContactId("3ca6e619-d654-4d0d-8fa6-2febefbe953d")
          .build();

        await pgEstablishmentAggregateRepository.insertEstablishmentAggregate(
          establishment,
        );

        expectToEqual(
          await pgEstablishmentAggregateRepository.getAllEstablishmentAggregates(),
          [establishment],
        );
      });
    });

    describe("updateEstablishmentAggregate", () => {
      const contactEntity = new ContactEntityBuilder().build();
      const updatedAt = new Date();
      const aquisition: WithAcquisition = {
        acquisitionCampaign: "my-campaign",
        acquisitionKeyword: "my-keyword",
      };

      it.each([
        {
          originalEstablishment: new EstablishmentAggregateBuilder()
            .withEstablishmentSiret("78000403200029")
            .withEstablishmentCreatedAt(new Date("2021-01-15"))
            .withContact(contactEntity)
            .build(),
          updatedEstablishment: new EstablishmentAggregateBuilder()
            .withEstablishmentSiret("78000403200029")
            .withEstablishmentCreatedAt(new Date("2021-01-15"))
            .withEstablishmentUpdatedAt(updatedAt)
            .withContact(
              new ContactEntityBuilder(contactEntity)
                .withLastName("new-last-name")
                .withPhone("+33600000000")
                .build(),
            )
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
            .withMaxContactsPerMonth(24)
            .withSearchableBy({
              jobSeekers: true,
              students: false,
            })
            .build(),
          title: "updates the establishment values",
        },
        {
          originalEstablishment: new EstablishmentAggregateBuilder()
            .withEstablishmentCustomizedName("TOTO")
            .build(),
          updatedEstablishment: new EstablishmentAggregateBuilder()
            .withEstablishmentCustomizedName(undefined)
            .withEstablishmentUpdatedAt(updatedAt)
            .build(),
          title: "removes customized name",
        },
        {
          originalEstablishment: new EstablishmentAggregateBuilder()
            .withContact(
              new ContactEntityBuilder().withContactMethod("EMAIL").build(),
            )
            .build(),
          updatedEstablishment: new EstablishmentAggregateBuilder()
            .withContact(
              new ContactEntityBuilder().withContactMethod("IN_PERSON").build(),
            )
            .build(),
          title: "updates an establishment existing contact",
        },
        {
          originalEstablishment: new EstablishmentAggregateBuilder()
            .withEstablishment(
              new EstablishmentEntityBuilder()
                .withAdditionalInformation("my additionnal info")
                .withCustomizedName("my customize name")
                .withFitForDisabledWorkers(true)
                .withIsCommited(true)
                .withLastInseeCheck(new Date())
                .withNextAvailabilityDate(new Date())
                .withUpdatedAt(new Date())
                .withWebsite("www.truc.com")
                .withAcquisition(aquisition)
                .build(),
            )
            .build(),
          updatedEstablishment: new EstablishmentAggregateBuilder()
            .withEstablishment(
              new EstablishmentEntityBuilder(
                new EstablishmentEntityBuilder()
                  .withAdditionalInformation("my additionnal info")
                  .withCustomizedName("my customize name")
                  .withFitForDisabledWorkers(true)
                  .withIsCommited(true)
                  .withLastInseeCheck(new Date())
                  .withNextAvailabilityDate(new Date())
                  .withUpdatedAt(new Date())
                  .withWebsite("www.truc.com")
                  .withAcquisition(aquisition)
                  .build(),
              )
                .withAdditionalInformation("")
                .withCustomizedName(undefined)
                .withFitForDisabledWorkers(undefined)
                .withIsCommited(undefined)
                .withLastInseeCheck(undefined)
                .withNextAvailabilityDate(undefined)
                .withUpdatedAt(updatedAt)
                .withWebsite(undefined)
                .withAcquisition(aquisition)
                .build(),
            )
            .build(),
          title: "remove optional values",
        },
      ] satisfies {
        originalEstablishment: EstablishmentAggregate;
        updatedEstablishment: EstablishmentAggregate;
        title: string;
      }[])(
        "$title",
        async ({ originalEstablishment, updatedEstablishment }) => {
          // Prepare
          await pgEstablishmentAggregateRepository.insertEstablishmentAggregate(
            originalEstablishment,
          );

          expectToEqual(
            await pgEstablishmentAggregateRepository.getAllEstablishmentAggregates(),
            [originalEstablishment],
          );

          await pgEstablishmentAggregateRepository.updateEstablishmentAggregate(
            updatedEstablishment,
            updatedAt,
          );

          expectToEqual(
            await pgEstablishmentAggregateRepository.getAllEstablishmentAggregates(),
            [updatedEstablishment],
          );
        },
      );
    });
  });

  describe("hasEstablishmentFromFormWithSiret", () => {
    const siret = "12345678901234";

    it("returns false if no establishment from form with given siret exists", async () => {
      // Act and assert
      expect(
        await pgEstablishmentAggregateRepository.hasEstablishmentAggregateWithSiret(
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
        await pgEstablishmentAggregateRepository.hasEstablishmentAggregateWithSiret(
          siret,
        ),
      ).toBe(true);
    });
  });

  describe("hasEstablishmentFromFormWithSiret", () => {
    const siret = "12345678901234";

    it("returns false if no establishment from form with given siret exists", async () => {
      // Act and assert
      expectToEqual(
        await pgEstablishmentAggregateRepository.hasEstablishmentAggregateWithSiret(
          siret,
        ),
        false,
      );
    });

    it("returns true if an establishment from form with given siret exists", async () => {
      // Prepare
      await insertEstablishmentAggregate(pgEstablishmentAggregateRepository, {
        siret,
      });

      // Act and assert
      expectToEqual(
        await pgEstablishmentAggregateRepository.hasEstablishmentAggregateWithSiret(
          siret,
        ),
        true,
      );
    });
  });

  describe("getSiretsOfEstablishmentsWithRomeCode", () => {
    it("Returns a list of establishment sirets that have an offer with given rome", async () => {
      // Prepare
      const matchingRomeCode = "A1101";
      const establishmentWithCodeOfferMatching =
        new EstablishmentAggregateBuilder()
          .withEstablishmentSiret("11111111111111")
          .withOffers([
            new OfferEntityBuilder().withRomeCode(matchingRomeCode).build(),
          ])
          .withContactId(uuid())
          .withLocationId(uuid())
          .build();
      const establishmentWithoutCodeOfferMatching =
        new EstablishmentAggregateBuilder()
          .withEstablishmentSiret("22222222222222")
          .withOffers([new OfferEntityBuilder().withRomeCode("A1201").build()])
          .withContactId(uuid())
          .withLocationId(uuid())
          .build();

      await pgEstablishmentAggregateRepository.insertEstablishmentAggregate(
        establishmentWithCodeOfferMatching,
      );
      await pgEstablishmentAggregateRepository.insertEstablishmentAggregate(
        establishmentWithoutCodeOfferMatching,
      );

      // Assert
      expectToEqual(
        await pgEstablishmentAggregateRepository.getSiretsOfEstablishmentsWithRomeCode(
          matchingRomeCode,
        ),
        [establishmentWithCodeOfferMatching.establishment.siret],
      );
    });
  });

  describe("delete establishment aggregate", () => {
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
        await pgEstablishmentAggregateRepository.getAllEstablishmentAggregates(),
        [establishmentAggregate],
      );

      await pgEstablishmentAggregateRepository.delete(
        establishmentAggregate.establishment.siret,
      );

      expectToEqual(
        await pgEstablishmentAggregateRepository.getAllEstablishmentAggregates(),
        [],
      );
    });

    it("Removes only establishment with given siret and its offers and its contacts", async () => {
      // Prepare

      const establishmentToRemove = new EstablishmentAggregateBuilder()
        .withEstablishmentSiret("11111111111111")
        .withOffers([
          new OfferEntityBuilder()
            .withRomeCode("A1401")
            .withRomeLabel("Aide agricole de production fruitière ou viticole")
            .withAppellationCode("10806")
            .withAppellationLabel("Aide agricole en arboriculture")
            .build(),
          new OfferEntityBuilder()
            .withRomeCode("A1405")
            .withRomeLabel("Arboriculture et viticulture")
            .withAppellationCode("12112")
            .withAppellationLabel("Chef de culture arboricole")
            .build(),
        ])
        .withLocationId(uuid())
        .withContactId(uuid())
        .build();
      const establishmentToKeep = new EstablishmentAggregateBuilder()
        .withEstablishmentSiret("22222222222222")
        .withOffers([
          new OfferEntityBuilder()
            .withRomeCode("A1405")
            .withRomeLabel("Arboriculture et viticulture")
            .withAppellationCode("17044")
            .withAppellationLabel("Oléiculteur / Oléicultrice")
            .build(),
        ])
        .withLocationId(uuid())
        .withContactId(uuid())
        .build();

      await pgEstablishmentAggregateRepository.insertEstablishmentAggregate(
        establishmentToRemove,
      );
      await pgEstablishmentAggregateRepository.insertEstablishmentAggregate(
        establishmentToKeep,
      );

      expectToEqual(
        await pgEstablishmentAggregateRepository.getAllEstablishmentAggregates(),
        [establishmentToRemove, establishmentToKeep],
      );

      // Act
      await pgEstablishmentAggregateRepository.delete(
        establishmentToRemove.establishment.siret,
      );

      expectToEqual(
        await pgEstablishmentAggregateRepository.getAllEstablishmentAggregates(),
        [establishmentToKeep],
      );
    });
  });

  describe("getEstablishmentAggregates", () => {
    const email: Email = "existing@email-in-repo.fr";

    const establishmentWithoutEmail = new EstablishmentAggregateBuilder()
      .withEstablishmentSiret("00000000000001")
      .withEstablishmentCreatedAt(new Date())
      .withLocationId(uuid())
      .withContact(
        new ContactEntityBuilder()
          .withId(uuid())
          .withEmail("another@email-in-repo.fr")
          .build(),
      )
      .build();

    const establishmentWithEmail1 = new EstablishmentAggregateBuilder()
      .withEstablishmentSiret("00000000000002")
      .withLocationId(uuid())
      .withContact(
        new ContactEntityBuilder().withId(uuid()).withEmail(email).build(),
      )
      .build();

    const establishmentWithEmail2 = new EstablishmentAggregateBuilder()
      .withEstablishmentSiret("00000000000003")
      .withLocationId(uuid())
      .withContact(
        new ContactEntityBuilder().withId(uuid()).withEmail(email).build(),
      )
      .build();

    beforeEach(async () => {
      await pgEstablishmentAggregateRepository.insertEstablishmentAggregate(
        establishmentWithoutEmail,
      );
      await pgEstablishmentAggregateRepository.insertEstablishmentAggregate(
        establishmentWithEmail1,
      );
      await pgEstablishmentAggregateRepository.insertEstablishmentAggregate(
        establishmentWithEmail2,
      );
    });

    it("return empty list if no establishment matched", async () => {
      expectToEqual(
        await pgEstablishmentAggregateRepository.getEstablishmentAggregatesByFilters(
          {
            contactEmail: "not-existing@email-in-repo.fr",
          },
        ),
        [],
      );
    });

    it("return an establishmentAggregate if matched email", async () => {
      expectToEqual(
        await pgEstablishmentAggregateRepository.getEstablishmentAggregatesByFilters(
          {
            contactEmail: email,
          },
        ),
        [establishmentWithEmail1, establishmentWithEmail2],
      );
    });
  });

  describe("markEstablishmentAsSearchableWhenRecentDiscussionAreUnderMaxContactPerMonth", () => {
    const since = subDays(new Date(), 7);

    const establishmentNotSearchable = new EstablishmentAggregateBuilder()
      .withIsSearchable(false)
      .build();

    const establishmentIsNotSearchableAndMaxContactPerMonth0 =
      new EstablishmentAggregateBuilder(establishmentNotSearchable)
        .withMaxContactsPerMonth(0)
        .build();

    const establishmentIsNotSearchableAndMaxContactPerMonth1 =
      new EstablishmentAggregateBuilder(establishmentNotSearchable)
        .withMaxContactsPerMonth(1)
        .build();

    const establishmentIsNotSearchableAndMaxContactPerMonth2 =
      new EstablishmentAggregateBuilder(establishmentNotSearchable)
        .withMaxContactsPerMonth(2)
        .build();

    const discussionAfterSinceDate = new DiscussionBuilder()
      .withSiret(
        establishmentIsNotSearchableAndMaxContactPerMonth2.establishment.siret,
      )
      .withId(uuid())
      .withCreatedAt(addMilliseconds(since, 1))
      .build();

    const discussionAtSinceDate = new DiscussionBuilder()
      .withSiret(
        establishmentIsNotSearchableAndMaxContactPerMonth2.establishment.siret,
      )
      .withId(uuid())
      .withCreatedAt(since)
      .build();

    describe("update", () => {
      it(`update is searchable for establishments that: 
          - are not searchable
          - have maxContactsPerMonth at 2
          - have 1 discussion since date`, async () => {
        await pgEstablishmentAggregateRepository.insertEstablishmentAggregate(
          establishmentIsNotSearchableAndMaxContactPerMonth2,
        );
        await pgDiscussionRepository.insert(discussionAfterSinceDate);

        await pgEstablishmentAggregateRepository.markEstablishmentAsSearchableWhenRecentDiscussionAreUnderMaxContactPerMonth(
          since,
        );

        expectToEqual(
          await pgEstablishmentAggregateRepository.getAllEstablishmentAggregates(),
          [
            new EstablishmentAggregateBuilder(
              establishmentIsNotSearchableAndMaxContactPerMonth2,
            )
              .withIsSearchable(true)
              .build(),
          ],
        );
      });

      it(`update is searchable for establishments that: 
          - are not searchable
          - have maxContactsPerMonth at 2
          - have no discussion`, async () => {
        await pgEstablishmentAggregateRepository.insertEstablishmentAggregate(
          establishmentIsNotSearchableAndMaxContactPerMonth2,
        );

        await pgEstablishmentAggregateRepository.markEstablishmentAsSearchableWhenRecentDiscussionAreUnderMaxContactPerMonth(
          since,
        );

        expectToEqual(
          await pgEstablishmentAggregateRepository.getAllEstablishmentAggregates(),
          [
            new EstablishmentAggregateBuilder(
              establishmentIsNotSearchableAndMaxContactPerMonth2,
            )
              .withIsSearchable(true)
              .build(),
          ],
        );
      });
      it(`update is searchable for establishments that: 
          - are not searchable
          - have maxContactsPerMonth at 1
          - have 1 discussion before date`, async () => {
        await pgEstablishmentAggregateRepository.insertEstablishmentAggregate(
          establishmentIsNotSearchableAndMaxContactPerMonth1,
        );

        await pgDiscussionRepository.insert(discussionAtSinceDate);

        await pgEstablishmentAggregateRepository.markEstablishmentAsSearchableWhenRecentDiscussionAreUnderMaxContactPerMonth(
          since,
        );

        expectToEqual(
          await pgEstablishmentAggregateRepository.getAllEstablishmentAggregates(),
          [
            new EstablishmentAggregateBuilder(
              establishmentIsNotSearchableAndMaxContactPerMonth1,
            )
              .withIsSearchable(true)
              .build(),
          ],
        );
      });
    });

    describe("do not update", () => {
      it(`do not update is searchable for establishments that: 
          - are not searchable
          - have maxContactsPerMonth at 0
          - have 0 discussion`, async () => {
        await pgEstablishmentAggregateRepository.insertEstablishmentAggregate(
          establishmentIsNotSearchableAndMaxContactPerMonth0,
        );

        await pgEstablishmentAggregateRepository.markEstablishmentAsSearchableWhenRecentDiscussionAreUnderMaxContactPerMonth(
          since,
        );

        expectToEqual(
          await pgEstablishmentAggregateRepository.getAllEstablishmentAggregates(),
          [establishmentIsNotSearchableAndMaxContactPerMonth0],
        );
      });

      it(`do not update is searchable for establishments that: 
          - are not searchable
          - have maxContactsPerMonth at 0
          - have 1 discussion since date`, async () => {
        await pgEstablishmentAggregateRepository.insertEstablishmentAggregate(
          establishmentIsNotSearchableAndMaxContactPerMonth0,
        );
        await pgDiscussionRepository.insert(discussionAfterSinceDate);

        await pgEstablishmentAggregateRepository.markEstablishmentAsSearchableWhenRecentDiscussionAreUnderMaxContactPerMonth(
          since,
        );

        expectToEqual(
          await pgEstablishmentAggregateRepository.getAllEstablishmentAggregates(),
          [establishmentIsNotSearchableAndMaxContactPerMonth0],
        );
      });

      it(`do not update is searchable for establishments that: 
          - are not searchable
          - have maxContactsPerMonth at 1
          - have 1 discussion since date`, async () => {
        await pgEstablishmentAggregateRepository.insertEstablishmentAggregate(
          establishmentIsNotSearchableAndMaxContactPerMonth1,
        );
        await pgDiscussionRepository.insert(discussionAfterSinceDate);

        await pgEstablishmentAggregateRepository.markEstablishmentAsSearchableWhenRecentDiscussionAreUnderMaxContactPerMonth(
          since,
        );

        expectToEqual(
          await pgEstablishmentAggregateRepository.getAllEstablishmentAggregates(),
          [establishmentIsNotSearchableAndMaxContactPerMonth1],
        );
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

const expectArraysToEqualIgnoringOrderAndRoundDistance = (
  actual: TestResult[],
  expected: TestResult[],
) => {
  const roundDistance = (result: TestResult) => ({
    ...result,
    distance_m: result.distance_m && Math.floor(result.distance_m / 100),
  });
  const formattedActual = actual.map(roundDistance);
  const formattedExpected = expected.map(roundDistance);
  expect(formattedActual).toHaveLength(formattedExpected.length);
  expect(formattedActual).toEqual(expect.arrayContaining(formattedExpected));
};

type TestResult = {
  address: string;
  rome: RomeCode;
  distance_m: number | undefined;
};

const cartographeImmersionOffer = new OfferEntityBuilder()
  .withAppellationCode("11704")
  .withAppellationLabel("Cartographe")
  .withRomeCode("M1808")
  .withRomeLabel("Information géographique")
  .build();

const analysteEnGeomatiqueImmersionOffer = new OfferEntityBuilder()
  .withAppellationCode("10946")
  .withAppellationLabel("Analyste en géomatique")
  .withRomeCode("M1808")
  .withRomeLabel("🍖🍖🍖🍖🍖🍖🍖")
  .build();

const hydrographeAppellationAndRome = new OfferEntityBuilder()
  .withRomeCode("M1808")
  .withRomeLabel("Information géographique")
  .withAppellationCode("15504")
  .withAppellationLabel("Hydrographe")
  .build();

const cuvisteOffer = new OfferEntityBuilder()
  .withRomeCode("A1413")
  .withRomeLabel("Fermentation de boissons alcoolisées")
  .withAppellationCode("140927")
  .withAppellationLabel("Cuviste")
  .build();

const groomChevauxOffer = new OfferEntityBuilder()
  .withRomeCode("A1501")
  .withRomeLabel("Aide aux soins animaux")
  .withAppellationCode("140928")
  .withAppellationLabel("Groom chevaux")
  .build();

const artisteCirqueOffer = new OfferEntityBuilder()
  .withRomeCode("L1204")
  .withRomeLabel("Arts du cirque et arts visuels")
  .withAppellationCode("11155")
  .withAppellationLabel("Artiste de cirque")
  .build();

const offer_A1101 = new OfferEntityBuilder()
  .withRomeCode("A1101")
  .withRomeLabel("Conduite d'engins agricoles et forestiers")
  .withAppellationCode("0")
  .withAppellationLabel("")
  .build();

const offer_A1101_11987 = new OfferEntityBuilder(offer_A1101)
  .withAppellationCode("11987")
  .withAppellationLabel("Chauffeur / Chauffeuse de machines agricoles")
  .build();

const offer_A1101_12862 = new OfferEntityBuilder(offer_A1101)
  .withAppellationCode("12862")
  .withAppellationLabel("")
  .build();

const offer_A1101_17751 = new OfferEntityBuilder(offer_A1101)
  .withAppellationCode("17751")
  .withAppellationLabel("Pilote de machines d'abattage")
  .build();

const offer_A1101_20404 = new OfferEntityBuilder(offer_A1101)
  .withAppellationCode("20404")
  .withAppellationLabel("Tractoriste agricole")
  .build();

const bassompierreSaintesLocation: Location = {
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

const portHubleChaniersLocation: Location = {
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

const tourDeLaChaineLaRochelleLocation: Location = {
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

const veauxLocation: Location = {
  id: "33333333-ee70-4c90-b3f4-668d492f7395",
  address: rueJacquardDto,
  position: {
    lat: 45.7636093,
    lon: 4.9209047,
  },
};

const locationOfSearchPosition = new LocationBuilder()
  .withId(uuid())
  .withPosition({ lat: 49, lon: 6 })
  .build();
const locationOfCloseSearchPosition = new LocationBuilder()
  .withId(uuid())
  .withPosition({ lat: 49.001, lon: 6.001 })
  .build();
const locationOfFarFromSearchedPosition = new LocationBuilder()
  .withId(uuid())
  .withPosition({ lat: 32, lon: 89 })
  .build();

const notMatchingRome = "B1805";
const searchMadeDistanceWithoutRome: SearchMade = {
  ...locationOfSearchPosition.position,
  distanceKm: 30,
  sortedBy: "distance",
};
const cartographeSearchMade: SearchMade = {
  ...searchMadeDistanceWithoutRome,
  appellationCodes: [cartographeImmersionOffer.appellationCode],
};

const establishmentWithOfferA1101_AtPosition =
  new EstablishmentAggregateBuilder()
    .withEstablishmentSiret("00000000000001")
    .withLocations([locationOfSearchPosition])
    .withOffers([offer_A1101_11987])
    .withContactId(uuid())
    .build();

const establishmentWithOfferA1101_close = new EstablishmentAggregateBuilder()
  .withEstablishmentSiret("00000000000002")
  .withLocations([locationOfCloseSearchPosition])
  .withOffers([offer_A1101_11987])
  .withContactId(uuid())
  .build();

const establishmentWithOfferA1101_far = new EstablishmentAggregateBuilder()
  .withEstablishmentSiret("00000000000003")
  .withLocations([locationOfFarFromSearchedPosition])
  .withOffers([offer_A1101_11987])
  .withContactId(uuid())
  .build();

const searchableByAllEstablishment = new EstablishmentAggregateBuilder()
  .withEstablishmentSiret("00000000000001")
  .withSearchableBy({ jobSeekers: true, students: true })
  .withOffers([cartographeImmersionOffer])
  .withLocations([
    new LocationBuilder(locationOfSearchPosition).withId(uuid()).build(),
  ])
  .withContactId(uuid())
  .build();
const searchableByStudentsEstablishment = new EstablishmentAggregateBuilder()
  .withEstablishmentSiret("00000000000002")
  .withSearchableBy({ jobSeekers: false, students: true })
  .withOffers([cartographeImmersionOffer])
  .withLocations([
    new LocationBuilder(locationOfSearchPosition).withId(uuid()).build(),
  ])
  .withContactId(uuid())
  .build();
const searchableByJobSeekerEstablishment = new EstablishmentAggregateBuilder()
  .withEstablishmentSiret("00000000000003")
  .withSearchableBy({ jobSeekers: true, students: false })
  .withOffers([cartographeImmersionOffer])
  .withLocations([
    new LocationBuilder(locationOfSearchPosition).withId(uuid()).build(),
  ])
  .withContactId(uuid())
  .build();
