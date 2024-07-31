import { addMilliseconds, subDays } from "date-fns";
import { Pool } from "pg";
import {
  DiscussionBuilder,
  Email,
  GeoPositionDto,
  Location,
  LocationBuilder,
  SearchResultDto,
  WithAcquisition,
  errors,
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
} from "../helpers/EstablishmentBuilders";
import { PgDiscussionRepository } from "./PgDiscussionRepository";
import { PgEstablishmentAggregateRepository } from "./PgEstablishmentAggregateRepository";
import {
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
                .sort(
                  sortSearchResultsByDistanceAndRomeAndSiretOnRandomResults,
                ),
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
                .sort(
                  sortSearchResultsByDistanceAndRomeAndSiretOnRandomResults,
                ),
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
                .sort(
                  sortSearchResultsByDistanceAndRomeAndSiretOnRandomResults,
                ),
            );
          });
        });

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

            // Act
            const results =
              await pgEstablishmentAggregateRepository.searchImmersionResults({
                searchMade: {
                  sortedBy: "date",
                  distanceKm: 100,
                  ...centerOfSaintesGeoPosition,
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

      it("returns open establishments only", async () => {
        const openEstablishment = new EstablishmentAggregateBuilder()
          .withEstablishmentSiret("00000000000001")
          .withOffers([cartographeImmersionOffer])
          .withLocations([locationOfSearchPosition])
          .withEstablishmentOpen(true)
          .build();
        const closedEstablishment = new EstablishmentAggregateBuilder()
          .withOffers([cartographeImmersionOffer])
          .withLocations([locationOfCloseSearchPosition])
          .withContactId(uuid())
          .withEstablishmentOpen(false)
          .build();

        await pgEstablishmentAggregateRepository.insertEstablishmentAggregate(
          openEstablishment,
        );
        await pgEstablishmentAggregateRepository.insertEstablishmentAggregate(
          closedEstablishment,
        );

        // Assert
        expectToEqual(
          await pgEstablishmentAggregateRepository.searchImmersionResults({
            searchMade: cartographeSearchMade,
          }),
          [
            makeExpectedSearchResult({
              establishment: openEstablishment,
              withLocationAndDistance: {
                ...locationOfSearchPosition,
                distance: 0,
              },
              withOffers: [cartographeImmersionOffer],
            }),
          ],
        );
      });

      it("provide also non searchable establishments (so that usecase can prevent LBB results to be shown)", async () => {
        const establishment = new EstablishmentAggregateBuilder()
          .withOffers([cartographeImmersionOffer])
          .withLocations([locationOfSearchPosition])
          .withIsSearchable(false)
          .build();

        await pgEstablishmentAggregateRepository.insertEstablishmentAggregate(
          establishment,
        );

        expectToEqual(
          await pgEstablishmentAggregateRepository.searchImmersionResults({
            searchMade: cartographeSearchMade,
          }),
          [
            makeExpectedSearchResult({
              establishment,
              withLocationAndDistance: {
                ...locationOfSearchPosition,
                distance: 0,
              },
              withOffers: [cartographeImmersionOffer],
            }),
          ],
        );
      });

      it("returns one search DTO by establishment, with offers matching rome and geographical area", async () => {
        const establishmentAtRangeWithRome = new EstablishmentAggregateBuilder()
          .withEstablishmentSiret("00000000000001")
          .withContactId(uuid())
          .withOffers([
            analysteEnGeomatiqueImmersionOffer,
            cartographeImmersionOffer,
          ])
          .withLocations([locationOfSearchPosition])
          .build();

        const establishmentAtRangeWithOtherRome =
          new EstablishmentAggregateBuilder()
            .withEstablishmentSiret("00000000000002")
            .withContactId(uuid())
            .withOffers([artisteCirqueOffer])
            .withLocations([locationOfCloseSearchPosition])
            .build();

        const establishmentOutOfRangeWithRome =
          new EstablishmentAggregateBuilder()
            .withEstablishmentSiret("00000000000003")
            .withContactId(uuid())
            .withOffers([
              cartographeImmersionOffer,
              analysteEnGeomatiqueImmersionOffer,
            ])
            .withLocations([locationOfFarFromSearchedPosition])

            .build();

        await pgEstablishmentAggregateRepository.insertEstablishmentAggregate(
          establishmentAtRangeWithRome,
        );
        await pgEstablishmentAggregateRepository.insertEstablishmentAggregate(
          establishmentAtRangeWithOtherRome,
        );
        await pgEstablishmentAggregateRepository.insertEstablishmentAggregate(
          establishmentOutOfRangeWithRome,
        );

        expectToEqual(
          await pgEstablishmentAggregateRepository.searchImmersionResults({
            searchMade: cartographeSearchMade,
          }),
          [
            makeExpectedSearchResult({
              establishment: establishmentAtRangeWithRome,
              withLocationAndDistance: {
                ...locationOfSearchPosition,
                distance: 0,
              },
              withOffers: establishmentAtRangeWithRome.offers,
            }),
          ],
        );

        expectToEqual(
          await pgEstablishmentAggregateRepository.searchImmersionResults({
            searchMade: { ...cartographeSearchMade, romeCode: "A1010" },
          }),
          [],
        );
      });

      describe("multiple locations", () => {
        beforeEach(async () => {
          await pgEstablishmentAggregateRepository.insertEstablishmentAggregate(
            establishmentCuvisteAtSaintesAndVeaux,
          );

          await pgEstablishmentAggregateRepository.insertEstablishmentAggregate(
            establishmentCuvisteAtChaniersAndLaRochelle,
          );
        });

        it("search results with multiple locations and with matching rome code", async () => {
          expectToEqual(
            await pgEstablishmentAggregateRepository.searchImmersionResults({
              searchMade: {
                sortedBy: "date",
                distanceKm: 50,
                ...centerOfSaintesGeoPosition,
                romeCode: cuvisteOffer.romeCode,
              },
            }),
            [
              makeExpectedSearchResult({
                establishment: establishmentCuvisteAtSaintesAndVeaux,
                withLocationAndDistance: {
                  ...bassompierreSaintesLocation,
                  distance: 7704.55035665,
                },
                withOffers: [cuvisteOffer],
              }),
              makeExpectedSearchResult({
                establishment: establishmentCuvisteAtChaniersAndLaRochelle,
                withLocationAndDistance: {
                  ...portHubleChaniersLocation,
                  distance: 11093.36505388,
                },
                withOffers: [cuvisteOffer],
              }),
            ],
          );
        });

        it("no search results with multiple locations and without matching rome code", async () => {
          expectToEqual(
            await pgEstablishmentAggregateRepository.searchImmersionResults({
              searchMade: {
                sortedBy: "date",
                distanceKm: 100,
                ...centerOfSaintesGeoPosition,
                romeCode: groomChevauxOffer.romeCode,
              },
            }),
            [],
          );
        });
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
            errors.establishment.invalidGeoParams(),
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
            errors.establishment.invalidGeoParams(),
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
            errors.establishment.invalidGeoParams(),
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
            errors.establishment.invalidGeoParams(),
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
            errors.establishment.invalidGeoParams(),
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
            errors.establishment.invalidGeoParams(),
          );
        });
      });
    });

    describe("getOffersAsAppelationDtoForFormEstablishment", () => {
      beforeEach(async () => {
        await pgEstablishmentAggregateRepository.insertEstablishmentAggregate(
          establishmentWithOfferA1101_AtPosition,
        );
      });

      it("returns an empty list if no establishment found with this siret", async () => {
        const siretNotInTable = "11111111111111";

        expectToEqual(
          await pgEstablishmentAggregateRepository.getOffersAsAppellationAndRomeDtosBySiret(
            siretNotInTable,
          ),
          [],
        );
      });

      it("returns a list with offers from offers as AppellationDto of given siret", async () => {
        expectArraysToEqualIgnoringOrder(
          await pgEstablishmentAggregateRepository.getOffersAsAppellationAndRomeDtosBySiret(
            establishmentWithOfferA1101_AtPosition.establishment.siret,
          ),
          establishmentWithOfferA1101_AtPosition.offers.map((offer) => ({
            appellationCode: offer.appellationCode,
            appellationLabel: offer.appellationLabel,
            romeCode: offer.romeCode,
            romeLabel: offer.romeLabel,
          })),
        );
      });
    });

    describe("getSearchImmersionResultDtoBySearchQuery", () => {
      beforeEach(async () => {
        await pgEstablishmentAggregateRepository.insertEstablishmentAggregate(
          establishmentWithOfferA1101_AtPosition,
        );
      });

      it("undefined when missing offer by siret", async () => {
        const missingSiret = "11111111111111";

        expectToEqual(
          await pgEstablishmentAggregateRepository.getSearchImmersionResultDtoBySearchQuery(
            missingSiret,
            establishmentWithOfferA1101_AtPosition.offers[0].appellationCode,
            establishmentWithOfferA1101_AtPosition.establishment.locations[0]
              .id,
          ),
          undefined,
        );
      });

      it("undefined when missing location id", async () => {
        const missingLocationId = "55555555-5555-4444-5555-555555555666";

        expectToEqual(
          await pgEstablishmentAggregateRepository.getSearchImmersionResultDtoBySearchQuery(
            establishmentWithOfferA1101_AtPosition.establishment.siret,
            establishmentWithOfferA1101_AtPosition.offers[0].appellationCode,
            missingLocationId,
          ),
          undefined,
        );
      });

      it("undefined when missing offer appelation code", async () => {
        const missingAppelationCode = artisteCirqueOffer.appellationCode;

        expectToEqual(
          await pgEstablishmentAggregateRepository.getSearchImmersionResultDtoBySearchQuery(
            establishmentWithOfferA1101_AtPosition.establishment.siret,
            missingAppelationCode,
            establishmentWithOfferA1101_AtPosition.establishment.locations[0]
              .id,
          ),
          undefined,
        );
      });

      it("Returns reconstructed SearchImmersionResultDto for given siret, appellationCode and location id", async () => {
        expectToEqual(
          await pgEstablishmentAggregateRepository.getSearchImmersionResultDtoBySearchQuery(
            establishmentWithOfferA1101_AtPosition.establishment.siret,
            establishmentWithOfferA1101_AtPosition.offers[0].appellationCode,
            establishmentWithOfferA1101_AtPosition.establishment.locations[0]
              .id,
          ),
          {
            rome: establishmentWithOfferA1101_AtPosition.offers[0].romeCode,
            romeLabel:
              establishmentWithOfferA1101_AtPosition.offers[0].romeLabel,
            appellations: [
              {
                appellationLabel:
                  establishmentWithOfferA1101_AtPosition.offers[0]
                    .appellationLabel,
                appellationCode:
                  establishmentWithOfferA1101_AtPosition.offers[0]
                    .appellationCode,
                score: establishmentWithOfferA1101_AtPosition.offers[0].score,
              },
            ],
            naf: establishmentWithOfferA1101_AtPosition.establishment.nafDto
              .code,
            nafLabel: "Activités des agences de travail temporaire",
            siret: establishmentWithOfferA1101_AtPosition.establishment.siret,
            name: establishmentWithOfferA1101_AtPosition.establishment.name,
            customizedName:
              establishmentWithOfferA1101_AtPosition.establishment
                .customizedName,
            website:
              establishmentWithOfferA1101_AtPosition.establishment.website,
            additionalInformation:
              establishmentWithOfferA1101_AtPosition.establishment
                .additionalInformation,
            voluntaryToImmersion:
              establishmentWithOfferA1101_AtPosition.establishment
                .voluntaryToImmersion,
            fitForDisabledWorkers:
              establishmentWithOfferA1101_AtPosition.establishment
                .fitForDisabledWorkers,
            numberOfEmployeeRange:
              establishmentWithOfferA1101_AtPosition.establishment
                .numberEmployeesRange,
            contactMode:
              establishmentWithOfferA1101_AtPosition.contact.contactMethod,
            distance_m: undefined,
            address:
              establishmentWithOfferA1101_AtPosition.establishment.locations[0]
                .address,
            position:
              establishmentWithOfferA1101_AtPosition.establishment.locations[0]
                .position,
            locationId:
              establishmentWithOfferA1101_AtPosition.establishment.locations[0]
                .id,
          },
        );
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
    it("returns false if no establishment from form with given siret exists", async () => {
      expectToEqual(
        await pgEstablishmentAggregateRepository.hasEstablishmentAggregateWithSiret(
          establishmentWithOfferA1101_AtPosition.establishment.siret,
        ),
        false,
      );
    });

    it("returns true if an establishment from form with given siret exists", async () => {
      await pgEstablishmentAggregateRepository.insertEstablishmentAggregate(
        establishmentWithOfferA1101_AtPosition,
      );

      expectToEqual(
        await pgEstablishmentAggregateRepository.hasEstablishmentAggregateWithSiret(
          establishmentWithOfferA1101_AtPosition.establishment.siret,
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
        errors.establishment.missingAggregate({ siret: siretNotInTable }),
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
  .withRomeLabel("Information géographique")
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

const centerOfSaintesGeoPosition: GeoPositionDto = {
  lat: 45.7461575,
  lon: -0.728166,
};

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

const establishmentCuvisteAtSaintesAndVeaux =
  new EstablishmentAggregateBuilder()
    .withEstablishmentSiret("78000403200029")
    .withContactId("11111111-1111-4444-1111-111111110001")
    .withOffers([
      new OfferEntityBuilder(cuvisteOffer).withCreatedAt(new Date()).build(),
    ])
    .withLocations([
      bassompierreSaintesLocation,
      veauxLocation, // outside geographical area
    ])
    .build();

const establishmentCuvisteAtChaniersAndLaRochelle =
  new EstablishmentAggregateBuilder()
    .withEstablishmentSiret("78000403200030")
    .withContactId("11111111-1111-4444-1111-111111110002")
    .withOffers([
      new OfferEntityBuilder(cuvisteOffer)
        .withCreatedAt(subDays(new Date(), 1))
        .build(),
    ])
    .withLocations([
      portHubleChaniersLocation,
      tourDeLaChaineLaRochelleLocation, // outside geographical area (52km)
    ])
    .build();
