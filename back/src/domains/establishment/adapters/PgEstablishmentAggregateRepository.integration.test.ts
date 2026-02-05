import { addDays, addMilliseconds, subDays } from "date-fns";
import type { Pool } from "pg";
import {
  arrayFromNumber,
  DiscussionBuilder,
  errors,
  expectArraysToEqual,
  expectArraysToEqualIgnoringOrder,
  expectArraysToMatch,
  expectPromiseToFailWithError,
  expectToEqual,
  type InternalOfferDto,
  LocationBuilder,
  type NafCode,
  type SearchSortedBy,
  UserBuilder,
  type WithAcquisition,
  type WithSort,
} from "shared";
import { v4 as uuid } from "uuid";
import {
  type KyselyDb,
  makeKyselyDb,
} from "../../../config/pg/kysely/kyselyUtils";
import { makeTestPgPool } from "../../../config/pg/pgPool";
import {
  rueBitcheDto,
  rueGuillaumeTellDto,
  rueJacquardDto,
} from "../../core/address/adapters/InMemoryAddressGateway";
import { PgUserRepository } from "../../core/authentication/connected-user/adapters/PgUserRepository";
import type { EstablishmentAggregate } from "../entities/EstablishmentAggregate";
import type { GeoParams } from "../entities/SearchMadeEntity";
import {
  EstablishmentAggregateBuilder,
  EstablishmentEntityBuilder,
  OfferEntityBuilder,
} from "../helpers/EstablishmentBuilders";
import { PgDiscussionRepository } from "./PgDiscussionRepository";
import { PgEstablishmentAggregateRepository } from "./PgEstablishmentAggregateRepository";
import {
  analysteEnGeomatiqueImmersionOffer,
  artisteCirqueOffer,
  bassompierreSaintesLocation,
  cartographeImmersionOffer,
  cartographeSearchMade,
  centerOfSaintesGeoPosition,
  closedEstablishment,
  cuvisteOffer,
  establishment0145Z_A,
  establishment0145Z_B,
  establishment4741Z,
  establishment9900Z,
  establishmentCuvisteAtChaniersAndLaRochelle,
  establishmentCuvisteAtSaintesAndVeaux,
  establishmentWithFitForDisabledWorkersNo,
  establishmentWithFitForDisabledWorkersYesCertified,
  establishmentWithFitForDisabledWorkersYesDeclaredOnly,
  establishmentWithOfferA1101_AtPosition,
  establishmentWithOfferA1101_close,
  establishmentWithOfferA1101_outOfDistanceRange,
  groomChevauxOffer,
  locationOfCloseSearchPosition,
  locationOfSearchPosition,
  locationOutOfAnySearchedPosition,
  makeExpectedSearchResult,
  offer_A1101_11987,
  offer_A1101_12862,
  offer_A1101_17751,
  offer_A1101_20404,
  osefUser,
  osefUserRight,
  portHubleChaniersLocation,
  randomizeTestEstablishmentAggregates,
  searchableByAllEstablishment,
  searchableByJobSeekerEstablishment,
  searchableByStudentsEstablishment,
  searchMadeDistanceWithoutRome,
  sortSearchResultsByDistanceAndRomeAndSiretOnRandomResults,
  tourDeLaChaineLaRochelleLocation,
  veauxLocation,
} from "./PgEstablishmentAggregateRepository.test.helpers";

describe("PgEstablishmentAggregateRepository", () => {
  let pool: Pool;
  let kyselyDb: KyselyDb;
  let pgEstablishmentAggregateRepository: PgEstablishmentAggregateRepository;
  let pgDiscussionRepository: PgDiscussionRepository;
  let pgUserRepository: PgUserRepository;

  beforeAll(() => {
    pool = makeTestPgPool();
    kyselyDb = makeKyselyDb(pool);
  });

  beforeEach(async () => {
    await kyselyDb.deleteFrom("establishments__users").execute();
    await kyselyDb.deleteFrom("immersion_offers").execute();
    await kyselyDb.deleteFrom("discussions").execute();
    await kyselyDb.deleteFrom("establishments_location_infos").execute();
    await kyselyDb.deleteFrom("establishments_location_positions").execute();
    await kyselyDb.deleteFrom("establishments").execute();
    await kyselyDb.deleteFrom("users").execute();

    pgEstablishmentAggregateRepository = new PgEstablishmentAggregateRepository(
      kyselyDb,
    );
    pgDiscussionRepository = new PgDiscussionRepository(kyselyDb);
    pgUserRepository = new PgUserRepository(kyselyDb);

    await pgUserRepository.save(osefUser);
  });

  afterAll(async () => {
    await pool.end();
  });

  describe("Offers", () => {
    const defaultSort: WithSort<SearchSortedBy>["sort"] = {
      by: "date",
      direction: "desc",
    };
    describe("getOffers", () => {
      const baseTestEstablishmentAggregates: EstablishmentAggregate[] = [
        establishmentWithOfferA1101_AtPosition,
        establishmentWithOfferA1101_close,
        establishmentWithOfferA1101_outOfDistanceRange,
        searchableByAllEstablishment,
        searchableByStudentsEstablishment,
        searchableByJobSeekerEstablishment,
      ];
      beforeEach(async () => {
        await kyselyDb.deleteFrom("establishments__users").execute();
        await kyselyDb.deleteFrom("immersion_offers").execute();
        await kyselyDb.deleteFrom("establishments_location_infos").execute();
        await kyselyDb
          .deleteFrom("establishments_location_positions")
          .execute();
        await kyselyDb.deleteFrom("establishments").execute();
      });

      describe("no filters provided", () => {
        it("returns an empty array when repo is empty", async () => {
          expectToEqual(
            await pgEstablishmentAggregateRepository.getOffers({
              pagination: { page: 1, perPage: 20 },
              sort: defaultSort,
              filters: {},
            }),
            {
              pagination: {
                currentPage: 1,
                totalPages: 1,
                numberPerPage: 20,
                totalRecords: 0,
              },
              data: [],
            },
          );
        });
        it("returns all open establishment results when no filters are provided", async () => {
          await Promise.all(
            [...baseTestEstablishmentAggregates, closedEstablishment].map(
              (establishmentAggregate) =>
                pgEstablishmentAggregateRepository.insertEstablishmentAggregate(
                  establishmentAggregate,
                ),
            ),
          );
          const result = await pgEstablishmentAggregateRepository.getOffers({
            pagination: { page: 1, perPage: 20 },
            sort: defaultSort,
            filters: {},
          });

          expectToEqual(result.pagination, {
            currentPage: 1,
            totalPages: 1,
            numberPerPage: 20,
            totalRecords: 6,
          });
          expectToEqual(
            result.data,
            baseTestEstablishmentAggregates.map((establishmentAggregate) =>
              makeExpectedSearchResult({
                establishment: establishmentAggregate,
                withOffers: establishmentAggregate.offers,
                withLocationAndDistance:
                  establishmentAggregate.establishment.locations[0],
                nafLabel: "Activités des agences de travail temporaire",
              }),
            ),
          );
        });
        it("returns all results when no filters are provided (object with keys and values undefined)", async () => {
          await Promise.all(
            baseTestEstablishmentAggregates.map((establishmentAggregate) =>
              pgEstablishmentAggregateRepository.insertEstablishmentAggregate(
                establishmentAggregate,
              ),
            ),
          );
          const result = await pgEstablishmentAggregateRepository.getOffers({
            pagination: { page: 1, perPage: 10 },
            sort: defaultSort,
            filters: {
              searchableBy: undefined,
              nafCodes: undefined,
              locationIds: undefined,
              sirets: undefined,
              fitForDisabledWorkers: undefined,
              appellationCodes: undefined,
            },
          });
          expectToEqual(result, {
            pagination: {
              currentPage: 1,
              totalPages: 1,
              numberPerPage: 10,
              totalRecords: 6,
            },
            data: baseTestEstablishmentAggregates.map(
              (establishmentAggregate) =>
                makeExpectedSearchResult({
                  establishment: establishmentAggregate,
                  withOffers: establishmentAggregate.offers,
                  withLocationAndDistance:
                    establishmentAggregate.establishment.locations[0],
                  nafLabel: "Activités des agences de travail temporaire",
                }),
            ),
          });
        });
        it("also returns non available (according to max contact requests) establishment", async () => {
          const unavailableEstablishment = new EstablishmentAggregateBuilder()
            .withEstablishmentSiret("00000000000027")
            .withIsMaxDiscussionsForPeriodReached(true)
            .withOffers([cartographeImmersionOffer])
            .withLocations([
              new LocationBuilder(locationOfSearchPosition)
                .withId(uuid())
                .build(),
            ])
            .withUserRights([osefUserRight])
            .build();
          const establishmentSetWithUnavailableOne = [
            ...baseTestEstablishmentAggregates,
            unavailableEstablishment,
          ];

          await Promise.all(
            establishmentSetWithUnavailableOne.map((establishmentAggregate) =>
              pgEstablishmentAggregateRepository.insertEstablishmentAggregate(
                establishmentAggregate,
              ),
            ),
          );
          const result = await pgEstablishmentAggregateRepository.getOffers({
            pagination: { page: 1, perPage: 10 },
            sort: defaultSort,
            filters: {
              searchableBy: undefined,
              nafCodes: undefined,
              locationIds: undefined,
              sirets: undefined,
              fitForDisabledWorkers: undefined,
              appellationCodes: undefined,
            },
          });
          expectToEqual(result, {
            pagination: {
              currentPage: 1,
              totalPages: 1,
              numberPerPage: 10,
              totalRecords: 6,
            },
            data: baseTestEstablishmentAggregates.map(
              (establishmentAggregate) =>
                makeExpectedSearchResult({
                  establishment: establishmentAggregate,
                  withOffers: establishmentAggregate.offers,
                  withLocationAndDistance:
                    establishmentAggregate.establishment.locations[0],
                  nafLabel: "Activités des agences de travail temporaire",
                }),
            ),
          });
        });
      });

      describe("filters.searchableBy", () => {
        beforeEach(async () => {
          await Promise.all(
            baseTestEstablishmentAggregates.map((establishmentAggregate) =>
              pgEstablishmentAggregateRepository.insertEstablishmentAggregate(
                establishmentAggregate,
              ),
            ),
          );
        });
        it("returns only establishments searchable by students when searchableBy='students'", async () => {
          const result = await pgEstablishmentAggregateRepository.getOffers({
            pagination: { page: 1, perPage: 10 },
            sort: defaultSort,
            filters: {
              searchableBy: "students",
            },
          });

          expectToEqual(result.pagination, {
            currentPage: 1,
            totalPages: 1,
            numberPerPage: 10,
            totalRecords: 5,
          });
          expectArraysToEqual(
            result.data,
            [
              establishmentWithOfferA1101_AtPosition,
              establishmentWithOfferA1101_close,
              establishmentWithOfferA1101_outOfDistanceRange,
              searchableByAllEstablishment,
              searchableByStudentsEstablishment,
            ].map((establishment) =>
              makeExpectedSearchResult({
                establishment,
                withLocationAndDistance:
                  establishment.establishment.locations[0],
                withOffers: establishment.offers,
                nafLabel: "Activités des agences de travail temporaire",
              }),
            ),
          );
        });

        it("returns only establishments searchable by jobSeekers when searchableBy='jobSeekers'", async () => {
          const result = await pgEstablishmentAggregateRepository.getOffers({
            pagination: { page: 1, perPage: 10 },
            sort: defaultSort,
            filters: {
              searchableBy: "jobSeekers",
            },
          });
          expectToEqual(result.pagination, {
            currentPage: 1,
            totalPages: 1,
            numberPerPage: 10,
            totalRecords: 5,
          });
          expectArraysToEqual(
            result.data,
            [
              establishmentWithOfferA1101_AtPosition,
              establishmentWithOfferA1101_close,
              establishmentWithOfferA1101_outOfDistanceRange,
              searchableByAllEstablishment,
              searchableByJobSeekerEstablishment,
            ].map((establishment) =>
              makeExpectedSearchResult({
                establishment,
                withLocationAndDistance:
                  establishment.establishment.locations[0],
                withOffers: establishment.offers,
                nafLabel: "Activités des agences de travail temporaire",
              }),
            ),
          );
        });
      });

      describe("filters.sirets", () => {
        beforeEach(async () => {
          await Promise.all(
            baseTestEstablishmentAggregates.map((establishmentAggregate) =>
              pgEstablishmentAggregateRepository.insertEstablishmentAggregate(
                establishmentAggregate,
              ),
            ),
          );
        });
        it("doesn't filter by sirets when no sirets are provided (empty array)", async () => {
          const result = await pgEstablishmentAggregateRepository.getOffers({
            pagination: { page: 1, perPage: 10 },
            sort: defaultSort,
            filters: { sirets: [] },
          });
          expectToEqual(result.pagination, {
            currentPage: 1,
            totalPages: 1,
            numberPerPage: 10,
            totalRecords: 6,
          });
          expectToEqual(
            result.data,
            baseTestEstablishmentAggregates.map((establishmentAggregate) =>
              makeExpectedSearchResult({
                establishment: establishmentAggregate,
                withOffers: establishmentAggregate.offers,
                withLocationAndDistance:
                  establishmentAggregate.establishment.locations[0],
                nafLabel: "Activités des agences de travail temporaire",
              }),
            ),
          );
        });
        it("filters by sirets list", async () => {
          const siret = searchableByAllEstablishment.establishment.siret;
          const result = await pgEstablishmentAggregateRepository.getOffers({
            pagination: { page: 1, perPage: 10 },
            sort: defaultSort,
            filters: { sirets: [siret] },
          });

          expectToEqual(result.data, [
            makeExpectedSearchResult({
              establishment: searchableByAllEstablishment,
              withOffers: searchableByAllEstablishment.offers,
              withLocationAndDistance:
                searchableByAllEstablishment.establishment.locations[0],
              nafLabel: "Activités des agences de travail temporaire",
            }),
          ]);
          expectToEqual(result.pagination, {
            currentPage: 1,
            totalPages: 1,
            numberPerPage: 10,
            totalRecords: 1,
          });
        });
      });
      describe("filters.locationIds", () => {
        beforeEach(async () => {
          await Promise.all(
            baseTestEstablishmentAggregates.map((establishmentAggregate) =>
              pgEstablishmentAggregateRepository.insertEstablishmentAggregate(
                establishmentAggregate,
              ),
            ),
          );
        });

        it("doesn't filter by locationIds when no locationIds are provided (empty array)", async () => {
          const result = await pgEstablishmentAggregateRepository.getOffers({
            pagination: { page: 1, perPage: 10 },
            sort: defaultSort,
            filters: { locationIds: [] },
          });
          expectToEqual(result.pagination, {
            currentPage: 1,
            totalPages: 1,
            numberPerPage: 10,
            totalRecords: 6,
          });
          expectToEqual(
            result.data,
            baseTestEstablishmentAggregates.map((establishmentAggregate) =>
              makeExpectedSearchResult({
                establishment: establishmentAggregate,
                withOffers: establishmentAggregate.offers,
                withLocationAndDistance:
                  establishmentAggregate.establishment.locations[0],
                nafLabel: "Activités des agences de travail temporaire",
              }),
            ),
          );
        });
        it("filters by locationIds (single value)", async () => {
          const locId =
            searchableByAllEstablishment.establishment.locations[0].id;
          const result = await pgEstablishmentAggregateRepository.getOffers({
            pagination: { page: 1, perPage: 10 },
            sort: defaultSort,
            filters: { locationIds: [locId] },
          });

          expectToEqual(result.pagination, {
            currentPage: 1,
            totalPages: 1,
            numberPerPage: 10,
            totalRecords: 1,
          });
          expectToEqual(result.data, [
            makeExpectedSearchResult({
              establishment: searchableByAllEstablishment,
              withOffers: searchableByAllEstablishment.offers,
              withLocationAndDistance:
                searchableByAllEstablishment.establishment.locations[0],
              nafLabel: "Activités des agences de travail temporaire",
            }),
          ]);
        });
        it("filters by locationIds (multiple values)", async () => {
          await pgEstablishmentAggregateRepository.insertEstablishmentAggregate(
            establishmentCuvisteAtSaintesAndVeaux,
          );
          const locIds =
            establishmentCuvisteAtSaintesAndVeaux.establishment.locations.map(
              (loc) => loc.id,
            );
          const result = await pgEstablishmentAggregateRepository.getOffers({
            pagination: { page: 1, perPage: 10 },
            sort: defaultSort,
            filters: { locationIds: locIds },
          });
          expectToEqual(result, {
            pagination: {
              currentPage: 1,
              totalPages: 1,
              numberPerPage: 10,
              totalRecords: 2,
            },
            data: [
              makeExpectedSearchResult({
                establishment: establishmentCuvisteAtSaintesAndVeaux,
                withOffers: establishmentCuvisteAtSaintesAndVeaux.offers,
                withLocationAndDistance:
                  establishmentCuvisteAtSaintesAndVeaux.establishment
                    .locations[1],
                nafLabel: "Activités des agences de travail temporaire",
              }),
              makeExpectedSearchResult({
                establishment: establishmentCuvisteAtSaintesAndVeaux,
                withOffers: establishmentCuvisteAtSaintesAndVeaux.offers,
                withLocationAndDistance:
                  establishmentCuvisteAtSaintesAndVeaux.establishment
                    .locations[0],
                nafLabel: "Activités des agences de travail temporaire",
              }),
            ],
          });
        });
        it("filters by locationIds and geoParams", async () => {
          await pgEstablishmentAggregateRepository.insertEstablishmentAggregate(
            establishmentCuvisteAtSaintesAndVeaux,
          );
          const locIds =
            establishmentCuvisteAtSaintesAndVeaux.establishment.locations.map(
              (loc) => loc.id,
            );
          const result = await pgEstablishmentAggregateRepository.getOffers({
            pagination: { page: 1, perPage: 10 },
            sort: defaultSort,
            filters: {
              locationIds: locIds,
              geoParams: {
                lat: establishmentCuvisteAtSaintesAndVeaux.establishment
                  .locations[0].position.lat,
                lon: establishmentCuvisteAtSaintesAndVeaux.establishment
                  .locations[0].position.lon,
                distanceKm: 10,
              },
            },
          });
          expectToEqual(result, {
            pagination: {
              currentPage: 1,
              totalPages: 1,
              numberPerPage: 10,
              totalRecords: 1,
            },
            data: [
              makeExpectedSearchResult({
                establishment: establishmentCuvisteAtSaintesAndVeaux,
                withOffers: establishmentCuvisteAtSaintesAndVeaux.offers,
                withLocationAndDistance: {
                  ...establishmentCuvisteAtSaintesAndVeaux.establishment
                    .locations[0],
                  distance: 0,
                },
                nafLabel: "Activités des agences de travail temporaire",
              }),
            ],
          });
        });
      });
      describe("filters.fitForDisabledWorkers", () => {
        const testEstablishmentAggregates: EstablishmentAggregate[] = [
          establishmentWithFitForDisabledWorkersYesCertified,
          establishmentWithFitForDisabledWorkersYesDeclaredOnly,
          establishmentWithFitForDisabledWorkersNo,
        ];

        beforeEach(async () => {
          await Promise.all(
            testEstablishmentAggregates.map((establishmentAggregate) =>
              pgEstablishmentAggregateRepository.insertEstablishmentAggregate(
                establishmentAggregate,
              ),
            ),
          );
        });
        it("filter on fitForDisabledWorkers with value 'yes-ft-certified'", async () => {
          const result = await pgEstablishmentAggregateRepository.getOffers({
            pagination: { page: 1, perPage: 10 },
            sort: defaultSort,
            filters: { fitForDisabledWorkers: ["yes-ft-certified"] },
          });
          expectToEqual(result, {
            pagination: {
              currentPage: 1,
              totalPages: 1,
              numberPerPage: 10,
              totalRecords: 1,
            },
            data: [
              makeExpectedSearchResult({
                establishment:
                  establishmentWithFitForDisabledWorkersYesCertified,
                withOffers:
                  establishmentWithFitForDisabledWorkersYesCertified.offers,
                withLocationAndDistance:
                  establishmentWithFitForDisabledWorkersYesCertified
                    .establishment.locations[0],
                nafLabel: "Activités des agences de travail temporaire",
              }),
            ],
          });
        });
        it("filter on fitForDisabledWorkers with value 'yes-declared-only'", async () => {
          const result = await pgEstablishmentAggregateRepository.getOffers({
            pagination: { page: 1, perPage: 10 },
            sort: defaultSort,
            filters: { fitForDisabledWorkers: ["yes-declared-only"] },
          });
          expectToEqual(result, {
            pagination: {
              currentPage: 1,
              totalPages: 1,
              numberPerPage: 10,
              totalRecords: 1,
            },
            data: [
              makeExpectedSearchResult({
                establishment:
                  establishmentWithFitForDisabledWorkersYesDeclaredOnly,
                withOffers:
                  establishmentWithFitForDisabledWorkersYesDeclaredOnly.offers,
                withLocationAndDistance:
                  establishmentWithFitForDisabledWorkersYesDeclaredOnly
                    .establishment.locations[0],
                nafLabel: "Activités des agences de travail temporaire",
              }),
            ],
          });
        });
        it("filter on fitForDisabledWorkers with value 'no'", async () => {
          const result = await pgEstablishmentAggregateRepository.getOffers({
            pagination: { page: 1, perPage: 10 },
            sort: defaultSort,
            filters: { fitForDisabledWorkers: ["no"] },
          });
          expectToEqual(result, {
            pagination: {
              currentPage: 1,
              totalPages: 1,
              numberPerPage: 10,
              totalRecords: 1,
            },
            data: [
              makeExpectedSearchResult({
                establishment: establishmentWithFitForDisabledWorkersNo,
                withOffers: establishmentWithFitForDisabledWorkersNo.offers,
                withLocationAndDistance:
                  establishmentWithFitForDisabledWorkersNo.establishment
                    .locations[0],
                nafLabel: "Activités des agences de travail temporaire",
              }),
            ],
          });
        });
      });

      describe("filters.appellationCodes", () => {
        const testEstablishmentAggregates: EstablishmentAggregate[] = [
          ...baseTestEstablishmentAggregates,
          establishmentCuvisteAtSaintesAndVeaux,
          establishmentCuvisteAtChaniersAndLaRochelle,
        ];
        beforeEach(async () => {
          await Promise.all(
            testEstablishmentAggregates.map((establishmentAggregate) =>
              pgEstablishmentAggregateRepository.insertEstablishmentAggregate(
                establishmentAggregate,
              ),
            ),
          );
        });

        it("doesn't filter by appellationCodes when no appellationCodes are provided (empty array)", async () => {
          const result = await pgEstablishmentAggregateRepository.getOffers({
            pagination: { page: 1, perPage: 10 },
            sort: defaultSort,
            filters: { appellationCodes: [] },
          });
          expectToEqual(result, {
            pagination: {
              currentPage: 1,
              totalPages: 1,
              numberPerPage: 10,
              totalRecords: 10,
            },
            data: [
              makeExpectedSearchResult({
                establishment: establishmentWithOfferA1101_AtPosition,
                withOffers: establishmentWithOfferA1101_AtPosition.offers,
                withLocationAndDistance:
                  establishmentWithOfferA1101_AtPosition.establishment
                    .locations[0],
                nafLabel: "Activités des agences de travail temporaire",
              }),
              makeExpectedSearchResult({
                establishment: establishmentWithOfferA1101_close,
                withOffers: establishmentWithOfferA1101_close.offers,
                withLocationAndDistance:
                  establishmentWithOfferA1101_close.establishment.locations[0],
                nafLabel: "Activités des agences de travail temporaire",
              }),
              makeExpectedSearchResult({
                establishment: establishmentWithOfferA1101_outOfDistanceRange,
                withOffers:
                  establishmentWithOfferA1101_outOfDistanceRange.offers,
                withLocationAndDistance:
                  establishmentWithOfferA1101_outOfDistanceRange.establishment
                    .locations[0],
                nafLabel: "Activités des agences de travail temporaire",
              }),
              makeExpectedSearchResult({
                establishment: searchableByAllEstablishment,
                withOffers: searchableByAllEstablishment.offers,
                withLocationAndDistance:
                  searchableByAllEstablishment.establishment.locations[0],
                nafLabel: "Activités des agences de travail temporaire",
              }),
              makeExpectedSearchResult({
                establishment: searchableByStudentsEstablishment,
                withOffers: searchableByStudentsEstablishment.offers,
                withLocationAndDistance:
                  searchableByStudentsEstablishment.establishment.locations[0],
                nafLabel: "Activités des agences de travail temporaire",
              }),
              makeExpectedSearchResult({
                establishment: searchableByJobSeekerEstablishment,
                withOffers: searchableByJobSeekerEstablishment.offers,
                withLocationAndDistance:
                  searchableByJobSeekerEstablishment.establishment.locations[0],
                nafLabel: "Activités des agences de travail temporaire",
              }),
              makeExpectedSearchResult({
                establishment: establishmentCuvisteAtSaintesAndVeaux,
                withOffers: establishmentCuvisteAtSaintesAndVeaux.offers,
                withLocationAndDistance:
                  establishmentCuvisteAtSaintesAndVeaux.establishment
                    .locations[1],
                nafLabel: "Activités des agences de travail temporaire",
              }),
              makeExpectedSearchResult({
                establishment: establishmentCuvisteAtSaintesAndVeaux,
                withOffers: establishmentCuvisteAtSaintesAndVeaux.offers,
                withLocationAndDistance:
                  establishmentCuvisteAtSaintesAndVeaux.establishment
                    .locations[0],
                nafLabel: "Activités des agences de travail temporaire",
              }),
              makeExpectedSearchResult({
                establishment: establishmentCuvisteAtChaniersAndLaRochelle,
                withOffers: establishmentCuvisteAtChaniersAndLaRochelle.offers,
                withLocationAndDistance:
                  establishmentCuvisteAtChaniersAndLaRochelle.establishment
                    .locations[0],
                nafLabel: "Activités des agences de travail temporaire",
              }),
              makeExpectedSearchResult({
                establishment: establishmentCuvisteAtChaniersAndLaRochelle,
                withOffers: establishmentCuvisteAtChaniersAndLaRochelle.offers,
                withLocationAndDistance:
                  establishmentCuvisteAtChaniersAndLaRochelle.establishment
                    .locations[1],
                nafLabel: "Activités des agences de travail temporaire",
              }),
            ],
          });
        });
        it("filters by appellationCodes (single value)", async () => {
          const result = await pgEstablishmentAggregateRepository.getOffers({
            pagination: { page: 1, perPage: 10 },
            sort: defaultSort,
            filters: { appellationCodes: [cuvisteOffer.appellationCode] },
          });

          expectToEqual(result.pagination, {
            currentPage: 1,
            totalPages: 1,
            numberPerPage: 10,
            totalRecords: 4, // 2 establishments carry the cuviste offer; with 2 locations each
          });
          expectToEqual(result.data, [
            makeExpectedSearchResult({
              establishment: establishmentCuvisteAtSaintesAndVeaux,
              withOffers: establishmentCuvisteAtSaintesAndVeaux.offers,
              withLocationAndDistance:
                establishmentCuvisteAtSaintesAndVeaux.establishment
                  .locations[1],
              nafLabel: "Activités des agences de travail temporaire",
            }),
            makeExpectedSearchResult({
              establishment: establishmentCuvisteAtSaintesAndVeaux,
              withOffers: establishmentCuvisteAtSaintesAndVeaux.offers,
              withLocationAndDistance:
                establishmentCuvisteAtSaintesAndVeaux.establishment
                  .locations[0],
              nafLabel: "Activités des agences de travail temporaire",
            }),
            makeExpectedSearchResult({
              establishment: establishmentCuvisteAtChaniersAndLaRochelle,
              withOffers: establishmentCuvisteAtChaniersAndLaRochelle.offers,
              withLocationAndDistance:
                establishmentCuvisteAtChaniersAndLaRochelle.establishment
                  .locations[0],
              nafLabel: "Activités des agences de travail temporaire",
            }),
            makeExpectedSearchResult({
              establishment: establishmentCuvisteAtChaniersAndLaRochelle,
              withOffers: establishmentCuvisteAtChaniersAndLaRochelle.offers,
              withLocationAndDistance:
                establishmentCuvisteAtChaniersAndLaRochelle.establishment
                  .locations[1],
              nafLabel: "Activités des agences de travail temporaire",
            }),
          ]);
        });
        it("filters by appellationCodes (multiple values)", async () => {
          const result = await pgEstablishmentAggregateRepository.getOffers({
            pagination: { page: 1, perPage: 10 },
            sort: defaultSort,
            filters: {
              appellationCodes: [
                cuvisteOffer.appellationCode,
                cartographeImmersionOffer.appellationCode,
              ],
            },
          });
          const expectedSirets = [
            searchableByAllEstablishment.establishment.siret,
            searchableByStudentsEstablishment.establishment.siret,
            searchableByJobSeekerEstablishment.establishment.siret,
            establishmentCuvisteAtSaintesAndVeaux.establishment.siret,
            establishmentCuvisteAtSaintesAndVeaux.establishment.siret,
            establishmentCuvisteAtChaniersAndLaRochelle.establishment.siret,
            establishmentCuvisteAtChaniersAndLaRochelle.establishment.siret,
          ];
          expectArraysToEqual(
            result.data.map((result) => result.siret),
            expectedSirets,
          );
          expectToEqual(result, {
            pagination: {
              currentPage: 1,
              totalPages: 1,
              numberPerPage: 10,
              totalRecords: 7,
            },
            data: [
              makeExpectedSearchResult({
                establishment: searchableByAllEstablishment,
                withOffers: searchableByAllEstablishment.offers,
                withLocationAndDistance:
                  searchableByAllEstablishment.establishment.locations[0],
                nafLabel: "Activités des agences de travail temporaire",
              }),
              makeExpectedSearchResult({
                establishment: searchableByStudentsEstablishment,
                withOffers: searchableByStudentsEstablishment.offers,
                withLocationAndDistance:
                  searchableByStudentsEstablishment.establishment.locations[0],
                nafLabel: "Activités des agences de travail temporaire",
              }),
              makeExpectedSearchResult({
                establishment: searchableByJobSeekerEstablishment,
                withOffers: searchableByJobSeekerEstablishment.offers,
                withLocationAndDistance:
                  searchableByJobSeekerEstablishment.establishment.locations[0],
                nafLabel: "Activités des agences de travail temporaire",
              }),
              makeExpectedSearchResult({
                establishment: establishmentCuvisteAtSaintesAndVeaux,
                withOffers: establishmentCuvisteAtSaintesAndVeaux.offers,
                withLocationAndDistance:
                  establishmentCuvisteAtSaintesAndVeaux.establishment
                    .locations[1],
                nafLabel: "Activités des agences de travail temporaire",
              }),
              makeExpectedSearchResult({
                establishment: establishmentCuvisteAtSaintesAndVeaux,
                withOffers: establishmentCuvisteAtSaintesAndVeaux.offers,
                withLocationAndDistance:
                  establishmentCuvisteAtSaintesAndVeaux.establishment
                    .locations[0],
                nafLabel: "Activités des agences de travail temporaire",
              }),
              makeExpectedSearchResult({
                establishment: establishmentCuvisteAtChaniersAndLaRochelle,
                withOffers: establishmentCuvisteAtChaniersAndLaRochelle.offers,
                withLocationAndDistance:
                  establishmentCuvisteAtChaniersAndLaRochelle.establishment
                    .locations[0],
                nafLabel: "Activités des agences de travail temporaire",
              }),

              makeExpectedSearchResult({
                establishment: establishmentCuvisteAtChaniersAndLaRochelle,
                withOffers: establishmentCuvisteAtChaniersAndLaRochelle.offers,
                withLocationAndDistance:
                  establishmentCuvisteAtChaniersAndLaRochelle.establishment
                    .locations[1],
                nafLabel: "Activités des agences de travail temporaire",
              }),
            ],
          });
        });
      });

      describe("filters.nafCodes", () => {
        const testEstablishmentAggregates: EstablishmentAggregate[] = [
          ...baseTestEstablishmentAggregates,
          establishment0145Z_A,
          establishment0145Z_B,
          establishment4741Z,
        ];
        beforeEach(async () => {
          await Promise.all(
            testEstablishmentAggregates.map((establishmentAggregate) =>
              pgEstablishmentAggregateRepository.insertEstablishmentAggregate(
                establishmentAggregate,
              ),
            ),
          );
        });

        it("doesn't filter by nafCodes when no nafCodes are provided (empty array)", async () => {
          const result = await pgEstablishmentAggregateRepository.getOffers({
            pagination: { page: 1, perPage: 10 },
            sort: defaultSort,
            filters: { nafCodes: [] },
          });
          const nafLabelByNafCode: Record<NafCode, string> = {
            "0145Z": "Élevage d'ovins et de caprins",
            "4741Z":
              "Commerce de détail d'ordinateurs, d'unités périphériques et de logiciels en magasin spécialisé",
          };

          expectToEqual(result, {
            pagination: {
              currentPage: 1,
              totalPages: 1,
              numberPerPage: 10,
              totalRecords: 9,
            },
            data: testEstablishmentAggregates.map((establishmentAggregate) =>
              makeExpectedSearchResult({
                establishment: establishmentAggregate,
                withOffers: establishmentAggregate.offers,
                withLocationAndDistance:
                  establishmentAggregate.establishment.locations[0],
                nafLabel:
                  nafLabelByNafCode[
                    establishmentAggregate.establishment.nafDto.code
                  ] ?? "Activités des agences de travail temporaire",
              }),
            ),
          });
        });
        it("filters by nafCodes (single value)", async () => {
          const result = await pgEstablishmentAggregateRepository.getOffers({
            pagination: { page: 1, perPage: 10 },
            sort: defaultSort,
            filters: { nafCodes: ["0145Z"] },
          });

          const expectedEstablishments = [
            establishment0145Z_A,
            establishment0145Z_B,
          ];

          expectToEqual(result, {
            pagination: {
              currentPage: 1,
              totalPages: 1,
              numberPerPage: 10,
              totalRecords: 2,
            },
            data: expectedEstablishments.map((establishment) =>
              makeExpectedSearchResult({
                establishment,
                withOffers: establishment.offers,
                withLocationAndDistance:
                  establishment.establishment.locations[0],
                nafLabel: "Élevage d'ovins et de caprins",
              }),
            ),
          });
        });
        it("filters by nafCodes (multiple values)", async () => {
          const result = await pgEstablishmentAggregateRepository.getOffers({
            pagination: { page: 1, perPage: 10 },
            sort: defaultSort,
            filters: { nafCodes: ["0145Z", "4741Z"] },
          });
          const expectedEstablishments = [
            establishment0145Z_A,
            establishment0145Z_B,
            establishment4741Z,
          ];
          expectToEqual(result, {
            pagination: {
              currentPage: 1,
              totalPages: 1,
              numberPerPage: 10,
              totalRecords: 3,
            },
            data: expectedEstablishments.map((establishment) =>
              makeExpectedSearchResult({
                establishment,
                withOffers: establishment.offers,
                withLocationAndDistance:
                  establishment.establishment.locations[0],
                nafLabel:
                  establishment.establishment.nafDto.code === "0145Z"
                    ? "Élevage d'ovins et de caprins"
                    : "Commerce de détail d'ordinateurs, d'unités périphériques et de logiciels en magasin spécialisé",
              }),
            ),
          });
        });
      });

      describe("filters.remoteWorkModes", () => {
        const offerNoRemote = new OfferEntityBuilder()
          .withRomeCode("A1101")
          .withAppellationLabel("Chauffeur / Chauffeuse de machines agricoles")
          .withAppellationCode("11987")
          .withRomeLabel("Conduite d'engins agricoles et forestiers")
          .withRemoteWorkMode("ON_SITE")
          .build();

        const offerHybrid = new OfferEntityBuilder()
          .withRomeCode("I1307")
          .withRomeLabel(
            "Installation et maintenance télécoms et courants faibles",
          )
          .withAppellationLabel(
            "Technicien / Technicienne d'installation en domotique",
          )
          .withAppellationCode("19999")
          .withRemoteWorkMode("HYBRID")
          .build();

        const offerFullRemote = new OfferEntityBuilder()
          .withRomeCode("I1307")
          .withRomeLabel(
            "Installation et maintenance télécoms et courants faibles",
          )
          .withAppellationLabel(
            "Technicien / Technicienne d'installation en courants faibles",
          )
          .withAppellationCode("19998")
          .withRemoteWorkMode("FULL_REMOTE")
          .build();

        const establishmentWithNoRemoteOffer =
          new EstablishmentAggregateBuilder()
            .withEstablishmentSiret("11111111111111")
            .withOffers([offerNoRemote])
            .withLocationId(uuid())
            .withUserRights([osefUserRight])
            .build();

        const establishmentWithHybridOffer = new EstablishmentAggregateBuilder()
          .withEstablishmentSiret("22222222222222")
          .withOffers([offerHybrid])
          .withLocationId(uuid())
          .withUserRights([osefUserRight])
          .build();

        const establishmentWithFullRemoteOffer =
          new EstablishmentAggregateBuilder()
            .withEstablishmentSiret("33333333333333")
            .withOffers([offerFullRemote])
            .withLocationId(uuid())
            .withUserRights([osefUserRight])
            .build();

        const establishmentWithMixedRemoteOffers =
          new EstablishmentAggregateBuilder()
            .withEstablishmentSiret("44444444444444")
            .withOffers([offerFullRemote, offerHybrid])
            .withLocationId(uuid())
            .withUserRights([osefUserRight])
            .build();

        const testEstablishmentAggregates: EstablishmentAggregate[] = [
          establishmentWithNoRemoteOffer,
          establishmentWithHybridOffer,
          establishmentWithFullRemoteOffer,
          establishmentWithMixedRemoteOffers,
        ];

        beforeEach(async () => {
          await Promise.all(
            testEstablishmentAggregates.map((establishmentAggregate) =>
              pgEstablishmentAggregateRepository.insertEstablishmentAggregate(
                establishmentAggregate,
              ),
            ),
          );
        });

        it("doesn't filter by remoteWorkModes when no remoteWorkModes are provided (empty array)", async () => {
          const result = await pgEstablishmentAggregateRepository.getOffers({
            pagination: { page: 1, perPage: 10 },
            sort: defaultSort,
            filters: { remoteWorkModes: [] },
          });

          expectToEqual(result.pagination, {
            currentPage: 1,
            totalPages: 1,
            numberPerPage: 10,
            totalRecords: 5, // 1 per establishment except establishmentWithMixedRemoteOffers which has 2 (grouped by siret + rome + location + remoteWorkMode)
          });
        });

        it("filters by remoteWorkModes (single value: ON_SITE)", async () => {
          const result = await pgEstablishmentAggregateRepository.getOffers({
            pagination: { page: 1, perPage: 10 },
            sort: defaultSort,
            filters: { remoteWorkModes: ["ON_SITE"] },
          });

          expectToEqual(result.pagination, {
            currentPage: 1,
            totalPages: 1,
            numberPerPage: 10,
            totalRecords: 1,
          });

          expectToEqual(result.data, [
            makeExpectedSearchResult({
              establishment: establishmentWithNoRemoteOffer,
              withOffers: establishmentWithNoRemoteOffer.offers,
              withLocationAndDistance:
                establishmentWithNoRemoteOffer.establishment.locations[0],
              nafLabel: "Activités des agences de travail temporaire",
            }),
          ]);
        });

        it("filters by remoteWorkModes (single value: HYBRID)", async () => {
          const result = await pgEstablishmentAggregateRepository.getOffers({
            pagination: { page: 1, perPage: 10 },
            sort: defaultSort,
            filters: { remoteWorkModes: ["HYBRID"] },
          });

          expectToEqual(result.pagination, {
            currentPage: 1,
            totalPages: 1,
            numberPerPage: 10,
            totalRecords: 2, // establishmentWithHybridOffer + establishmentWithMixedRemoteOffers
          });

          expectToEqual(result.data, [
            makeExpectedSearchResult({
              establishment: establishmentWithHybridOffer,
              withOffers: establishmentWithHybridOffer.offers,
              withLocationAndDistance:
                establishmentWithHybridOffer.establishment.locations[0],
              nafLabel: "Activités des agences de travail temporaire",
              remoteWorkMode: "HYBRID",
            }),
            makeExpectedSearchResult({
              establishment: establishmentWithMixedRemoteOffers,
              withOffers: establishmentWithMixedRemoteOffers.offers,
              withLocationAndDistance:
                establishmentWithMixedRemoteOffers.establishment.locations[0],
              nafLabel: "Activités des agences de travail temporaire",
              remoteWorkMode: "HYBRID",
            }),
          ]);
        });

        it("filters by remoteWorkModes (single value: FULL_REMOTE)", async () => {
          const result = await pgEstablishmentAggregateRepository.getOffers({
            pagination: { page: 1, perPage: 10 },
            sort: defaultSort,
            filters: { remoteWorkModes: ["FULL_REMOTE"] },
          });

          expectToEqual(result.pagination, {
            currentPage: 1,
            totalPages: 1,
            numberPerPage: 10,
            totalRecords: 2, // establishmentWithFullRemoteOffer + 1 of establishmentWithMixedRemoteOffers
          });

          expectToEqual(result.data, [
            makeExpectedSearchResult({
              establishment: establishmentWithFullRemoteOffer,
              withOffers: establishmentWithFullRemoteOffer.offers,
              withLocationAndDistance:
                establishmentWithFullRemoteOffer.establishment.locations[0],
              nafLabel: "Activités des agences de travail temporaire",
              remoteWorkMode: "FULL_REMOTE",
            }),
            makeExpectedSearchResult({
              establishment: establishmentWithMixedRemoteOffers,
              withOffers: establishmentWithMixedRemoteOffers.offers,
              withLocationAndDistance:
                establishmentWithMixedRemoteOffers.establishment.locations[0],
              nafLabel: "Activités des agences de travail temporaire",
              remoteWorkMode: "FULL_REMOTE",
            }),
          ]);
        });

        it("filters by remoteWorkModes (multiple values)", async () => {
          const result = await pgEstablishmentAggregateRepository.getOffers({
            pagination: { page: 1, perPage: 10 },
            sort: defaultSort,
            filters: { remoteWorkModes: ["HYBRID", "FULL_REMOTE"] },
          });

          expectToEqual(result.pagination, {
            currentPage: 1,
            totalPages: 1,
            numberPerPage: 10,
            totalRecords: 4, // 1 from establishmentWithHybridOffer + 1 from establishmentWithFullRemoteOffer + 2 from establishmentWithMixedRemoteOffers (one for each remoteWorkMode)
          });

          expectToEqual(result.data, [
            makeExpectedSearchResult({
              establishment: establishmentWithHybridOffer,
              withOffers: establishmentWithHybridOffer.offers,
              withLocationAndDistance:
                establishmentWithHybridOffer.establishment.locations[0],
              nafLabel: "Activités des agences de travail temporaire",
              remoteWorkMode: "HYBRID",
            }),
            makeExpectedSearchResult({
              establishment: establishmentWithFullRemoteOffer,
              withOffers: establishmentWithFullRemoteOffer.offers,
              withLocationAndDistance:
                establishmentWithFullRemoteOffer.establishment.locations[0],
              nafLabel: "Activités des agences de travail temporaire",
              remoteWorkMode: "FULL_REMOTE",
            }),
            makeExpectedSearchResult({
              establishment: establishmentWithMixedRemoteOffers,
              withOffers: establishmentWithMixedRemoteOffers.offers,
              withLocationAndDistance:
                establishmentWithMixedRemoteOffers.establishment.locations[0],
              nafLabel: "Activités des agences de travail temporaire",
              remoteWorkMode: "FULL_REMOTE",
            }),
            makeExpectedSearchResult({
              establishment: establishmentWithMixedRemoteOffers,
              withOffers: establishmentWithMixedRemoteOffers.offers,
              withLocationAndDistance:
                establishmentWithMixedRemoteOffers.establishment.locations[0],
              nafLabel: "Activités des agences de travail temporaire",
              remoteWorkMode: "HYBRID",
            }),
          ]);
        });
      });

      describe("filters.geoParams", () => {
        const testEstablishmentAggregates: EstablishmentAggregate[] = [
          establishmentWithOfferA1101_AtPosition,
          establishmentWithOfferA1101_close,
          establishmentWithOfferA1101_outOfDistanceRange,
        ];
        beforeEach(async () => {
          await Promise.all(
            testEstablishmentAggregates.map((establishmentAggregate) =>
              pgEstablishmentAggregateRepository.insertEstablishmentAggregate(
                establishmentAggregate,
              ),
            ),
          );
        });
        it("should throw on a search made with sortedBy distance and no geo params are provided", async () => {
          // Assert
          await expectPromiseToFailWithError(
            pgEstablishmentAggregateRepository.getOffers({
              pagination: { page: 1, perPage: 10 },
              sort: { by: "distance", direction: "asc" },
              filters: {},
            }),
            errors.establishment.invalidGeoParams(),
          );
        });

        it("should throw if all geo params value is 0 and sorted by distance", async () => {
          // Assert
          await expectPromiseToFailWithError(
            pgEstablishmentAggregateRepository.getOffers({
              pagination: { page: 1, perPage: 10 },
              sort: { by: "distance", direction: "asc" },
              filters: {
                geoParams: {
                  lat: 0,
                  lon: 0,
                  distanceKm: 0,
                },
              },
            }),
            errors.establishment.invalidGeoParams(),
          );
        });

        it("should throw if lat / lon are 0 but distanceKm is provided and not 0 and sorted by distance", async () => {
          // Assert
          await expectPromiseToFailWithError(
            pgEstablishmentAggregateRepository.getOffers({
              pagination: { page: 1, perPage: 10 },
              sort: { by: "distance", direction: "asc" },
              filters: {
                geoParams: {
                  lat: 0,
                  lon: 0,
                  distanceKm: 10,
                },
              },
            }),
            errors.establishment.invalidGeoParams(),
          );
        });
        it("should throw if one of the geo params value is 0", async () => {
          // Assert
          await expectPromiseToFailWithError(
            pgEstablishmentAggregateRepository.getOffers({
              pagination: { page: 1, perPage: 10 },
              sort: { by: "distance", direction: "asc" },
              filters: {
                geoParams: {
                  lat: 0,
                  lon: 45,
                  distanceKm: 10,
                },
              },
            }),
            errors.establishment.invalidGeoParams(),
          );
        });
        it("filters by geoParams", async () => {
          const result = await pgEstablishmentAggregateRepository.getOffers({
            pagination: { page: 1, perPage: 10 },
            sort: { by: "distance", direction: "asc" },
            filters: {
              geoParams: {
                lat: locationOfSearchPosition.position.lat,
                lon: locationOfSearchPosition.position.lon,
                distanceKm: 10,
              },
            },
          });
          expectToEqual(result, {
            pagination: {
              currentPage: 1,
              totalPages: 1,
              numberPerPage: 10,
              totalRecords: 2,
            },
            data: [
              makeExpectedSearchResult({
                establishment: establishmentWithOfferA1101_AtPosition,
                withOffers: [offer_A1101_11987],
                withLocationAndDistance: {
                  ...locationOfSearchPosition,
                  distance: 0,
                },
                nafLabel: "Activités des agences de travail temporaire",
              }),
              makeExpectedSearchResult({
                establishment: establishmentWithOfferA1101_close,
                withOffers: [offer_A1101_11987],
                withLocationAndDistance: {
                  ...locationOfCloseSearchPosition,
                  distance: 133.12254555,
                },
                nafLabel: "Activités des agences de travail temporaire",
              }),
            ],
          });
        });
      });

      describe("sorting and pagination", () => {
        const testEstablishmentAggregates: EstablishmentAggregate[] = [
          establishmentWithOfferA1101_close,
          establishmentWithOfferA1101_AtPosition,
          establishmentWithOfferA1101_outOfDistanceRange,
        ];
        beforeEach(async () => {
          await Promise.all(
            testEstablishmentAggregates.map((establishmentAggregate) =>
              pgEstablishmentAggregateRepository.insertEstablishmentAggregate(
                establishmentAggregate,
              ),
            ),
          );
        });

        it("sorts by distance and paginates results", async () => {
          const expectedResults = [
            makeExpectedSearchResult({
              establishment: establishmentWithOfferA1101_AtPosition,
              withOffers: [offer_A1101_11987],
              withLocationAndDistance: {
                ...locationOfSearchPosition,
                distance: 0,
              },
              nafLabel: "Activités des agences de travail temporaire",
            }),
            makeExpectedSearchResult({
              establishment: establishmentWithOfferA1101_close,
              withOffers: [offer_A1101_11987],
              withLocationAndDistance: {
                ...locationOfCloseSearchPosition,
                distance: 133.12254555,
              },
              nafLabel: "Activités des agences de travail temporaire",
            }),
          ];
          const allResults = await pgEstablishmentAggregateRepository.getOffers(
            {
              pagination: { page: 1, perPage: 10 },
              sort: { by: "distance", direction: "asc" },
              filters: {
                geoParams: {
                  lat: locationOfSearchPosition.position.lat,
                  lon: locationOfSearchPosition.position.lon,
                  distanceKm: 20,
                },
              },
            },
          );
          expectToEqual(allResults, {
            pagination: {
              currentPage: 1,
              totalPages: 1,
              numberPerPage: 10,
              totalRecords: 2,
            },
            data: expectedResults,
          });

          const resultPage1 =
            await pgEstablishmentAggregateRepository.getOffers({
              pagination: { page: 1, perPage: 1 },
              sort: { by: "distance", direction: "asc" },
              filters: {
                geoParams: {
                  lat: locationOfSearchPosition.position.lat,
                  lon: locationOfSearchPosition.position.lon,
                  distanceKm: 20,
                },
              },
            });

          expectToEqual(resultPage1, {
            pagination: {
              currentPage: 1,
              totalPages: 2,
              numberPerPage: 1,
              totalRecords: 2,
            },
            data: [expectedResults[0]],
          });

          const resultPage2 =
            await pgEstablishmentAggregateRepository.getOffers({
              pagination: { page: 2, perPage: 1 },
              sort: { by: "distance", direction: "asc" },
              filters: {
                geoParams: {
                  lat: locationOfSearchPosition.position.lat,
                  lon: locationOfSearchPosition.position.lon,
                  distanceKm: 20,
                },
              },
            });

          expectToEqual(resultPage2, {
            pagination: {
              currentPage: 2,
              totalPages: 2,
              numberPerPage: 1,
              totalRecords: 2,
            },
            data: [expectedResults[1]],
          });
        });

        it("provides totalPages=1 when there are zero results", async () => {
          const result = await pgEstablishmentAggregateRepository.getOffers({
            pagination: { page: 1, perPage: 5 },
            sort: { by: "date", direction: "desc" },
            filters: { sirets: ["NO_SUCH_SIRET"] },
          });

          expectToEqual(result, {
            pagination: {
              currentPage: 1,
              totalPages: 1,
              numberPerPage: 5,
              totalRecords: 0,
            },
            data: [],
          });
        });
      });

      describe("sorting.date", () => {
        const testEstablishmentAggregates: EstablishmentAggregate[] =
          baseTestEstablishmentAggregates
            .map((establishmentAggregate, index) => {
              return {
                ...establishmentAggregate,
                establishment: {
                  ...establishmentAggregate.establishment,
                  updatedAt: subDays(new Date(), index),
                },
              };
            })
            .sort(randomizeTestEstablishmentAggregates);

        beforeEach(async () => {
          await Promise.all(
            testEstablishmentAggregates.map((establishmentAggregate) =>
              pgEstablishmentAggregateRepository.insertEstablishmentAggregate(
                establishmentAggregate,
              ),
            ),
          );
        });
        it("sorts by date:asc", async () => {
          const result = await pgEstablishmentAggregateRepository.getOffers({
            pagination: { page: 1, perPage: 10 },
            sort: { by: "date", direction: "asc" },
            filters: {},
          });
          const expectedSortedResults = [
            ...testEstablishmentAggregates.sort(
              (a, b) =>
                a.establishment.updatedAt.getTime() -
                b.establishment.updatedAt.getTime(),
            ),
          ];

          const expectedResultsSiretsAndDate = expectedSortedResults.map(
            (establishmentAggregate) => {
              return {
                siret: establishmentAggregate.establishment.siret,
                updatedAt:
                  establishmentAggregate.establishment.updatedAt.toISOString(),
              };
            },
          );

          expectArraysToEqual(
            result.data.map((result) => ({
              siret: result.siret,
              updatedAt: result.updatedAt,
            })),
            expectedResultsSiretsAndDate,
          );
          expectToEqual(result, {
            pagination: {
              currentPage: 1,
              totalPages: 1,
              numberPerPage: 10,
              totalRecords: 6,
            },
            data: expectedSortedResults.map((establishmentAggregate) =>
              makeExpectedSearchResult({
                establishment: establishmentAggregate,
                withOffers: establishmentAggregate.offers,
                withLocationAndDistance:
                  establishmentAggregate.establishment.locations[0],
                nafLabel: "Activités des agences de travail temporaire",
              }),
            ),
          });
        });
        it("sorts by date:desc", async () => {
          const result = await pgEstablishmentAggregateRepository.getOffers({
            pagination: { page: 1, perPage: 10 },
            sort: { by: "date", direction: "desc" },
            filters: {},
          });

          expectToEqual(result, {
            pagination: {
              currentPage: 1,
              totalPages: 1,
              numberPerPage: 10,
              totalRecords: 6,
            },
            data: testEstablishmentAggregates
              .sort(
                (a, b) =>
                  b.establishment.updatedAt.getTime() -
                  a.establishment.updatedAt.getTime(),
              )
              .map((establishmentAggregate) =>
                makeExpectedSearchResult({
                  establishment: establishmentAggregate,
                  withOffers: establishmentAggregate.offers,
                  withLocationAndDistance:
                    establishmentAggregate.establishment.locations[0],
                  nafLabel: "Activités des agences de travail temporaire",
                }),
              ),
          });
        });
      });
      describe("sorting.score", () => {
        const testEstablishmentAggregates: EstablishmentAggregate[] =
          baseTestEstablishmentAggregates
            .map((establishmentAggregate, index) => {
              return {
                ...establishmentAggregate,
                establishment: {
                  ...establishmentAggregate.establishment,
                  score: index,
                },
              };
            })
            .sort(randomizeTestEstablishmentAggregates);

        beforeEach(async () => {
          await Promise.all(
            testEstablishmentAggregates.map((establishmentAggregate) =>
              pgEstablishmentAggregateRepository.insertEstablishmentAggregate(
                establishmentAggregate,
              ),
            ),
          );
        });
        it("sorts by score:asc", async () => {
          const result = await pgEstablishmentAggregateRepository.getOffers({
            pagination: { page: 1, perPage: 10 },
            sort: { by: "score", direction: "asc" },
            filters: {},
          });

          expectToEqual(result, {
            pagination: {
              currentPage: 1,
              totalPages: 1,
              numberPerPage: 10,
              totalRecords: 6,
            },
            data: testEstablishmentAggregates
              .sort((a, b) => a.establishment.score - b.establishment.score)
              .map((establishmentAggregate) =>
                makeExpectedSearchResult({
                  establishment: establishmentAggregate,
                  withOffers: establishmentAggregate.offers,
                  withLocationAndDistance:
                    establishmentAggregate.establishment.locations[0],
                  nafLabel: "Activités des agences de travail temporaire",
                }),
              ),
          });
        });
        it("sorts by score:desc", async () => {
          const result = await pgEstablishmentAggregateRepository.getOffers({
            pagination: { page: 1, perPage: 10 },
            sort: { by: "score", direction: "desc" },
            filters: {},
          });
          expectToEqual(result, {
            pagination: {
              currentPage: 1,
              totalPages: 1,
              numberPerPage: 10,
              totalRecords: 6,
            },
            data: testEstablishmentAggregates
              .sort((a, b) => b.establishment.score - a.establishment.score)
              .map((establishmentAggregate) =>
                makeExpectedSearchResult({
                  establishment: establishmentAggregate,
                  withOffers: establishmentAggregate.offers,
                  withLocationAndDistance:
                    establishmentAggregate.establishment.locations[0],
                  nafLabel: "Activités des agences de travail temporaire",
                }),
              ),
          });
        });
      });

      describe("tricky tests", () => {
        beforeEach(async () => {
          await Promise.all(
            [
              establishmentWithOfferA1101_AtPosition,
              establishmentWithOfferA1101_close,
              searchableByAllEstablishment,
              searchableByStudentsEstablishment,
              searchableByJobSeekerEstablishment,
            ].map((establishmentAggregate) =>
              pgEstablishmentAggregateRepository.insertEstablishmentAggregate(
                establishmentAggregate,
              ),
            ),
          );
        });
        it("should return same number of results regardless of the sortedBy parameter", async () => {
          const expectedTotalRecords = 5;
          const geoParams: GeoParams = {
            ...locationOfSearchPosition.position,
            distanceKm: 100,
          };
          const resultsByDateDesc =
            await pgEstablishmentAggregateRepository.getOffers({
              pagination: { page: 1, perPage: 10 },
              sort: { by: "date", direction: "desc" },
              filters: {},
            });
          const resultsByDateAsc =
            await pgEstablishmentAggregateRepository.getOffers({
              pagination: { page: 1, perPage: 10 },
              sort: { by: "date", direction: "asc" },
              filters: {},
            });
          const resultsByScoreDesc =
            await pgEstablishmentAggregateRepository.getOffers({
              pagination: { page: 1, perPage: 10 },
              sort: { by: "score", direction: "desc" },
              filters: {},
            });
          const resultsByScoreAsc =
            await pgEstablishmentAggregateRepository.getOffers({
              pagination: { page: 1, perPage: 10 },
              sort: { by: "score", direction: "asc" },
              filters: {},
            });
          const resultsByDistanceDesc =
            await pgEstablishmentAggregateRepository.getOffers({
              pagination: { page: 1, perPage: 10 },
              sort: { by: "distance", direction: "desc" },
              filters: {
                geoParams,
              },
            });
          const resultsByDistanceAsc =
            await pgEstablishmentAggregateRepository.getOffers({
              pagination: { page: 1, perPage: 10 },
              sort: { by: "distance", direction: "asc" },
              filters: {
                geoParams,
              },
            });
          expectToEqual(
            {
              resultsByDateDesc: resultsByDateDesc.pagination.totalRecords,
              resultsByDateAsc: resultsByDateAsc.pagination.totalRecords,
              resultsByScoreDesc: resultsByScoreDesc.pagination.totalRecords,
              resultsByScoreAsc: resultsByScoreAsc.pagination.totalRecords,
              resultsByDistanceDesc:
                resultsByDistanceDesc.pagination.totalRecords,
              resultsByDistanceAsc:
                resultsByDistanceAsc.pagination.totalRecords,
            },
            {
              resultsByDateDesc: expectedTotalRecords,
              resultsByDateAsc: expectedTotalRecords,
              resultsByScoreDesc: expectedTotalRecords,
              resultsByScoreAsc: expectedTotalRecords,
              resultsByDistanceDesc: expectedTotalRecords,
              resultsByDistanceAsc: expectedTotalRecords,
            },
          );
        });

        it("combo : filter by appellationCodes and localization", async () => {
          await pgEstablishmentAggregateRepository.insertEstablishmentAggregate(
            establishmentCuvisteAtSaintesAndVeaux,
          );

          await pgEstablishmentAggregateRepository.insertEstablishmentAggregate(
            establishmentCuvisteAtChaniersAndLaRochelle,
          );
          const result = await pgEstablishmentAggregateRepository.getOffers({
            pagination: { page: 1, perPage: 10 },
            sort: { by: "distance", direction: "asc" },
            filters: {
              appellationCodes: [
                cuvisteOffer.appellationCode,
                artisteCirqueOffer.appellationCode,
              ],
              geoParams: {
                lat: establishmentCuvisteAtSaintesAndVeaux.establishment
                  .locations[0].position.lat,
                lon: establishmentCuvisteAtSaintesAndVeaux.establishment
                  .locations[0].position.lon,
                distanceKm: 100,
              },
            },
          });
          expectToEqual(result, {
            pagination: {
              currentPage: 1,
              totalPages: 1,
              numberPerPage: 10,
              totalRecords: 3,
            },
            data: [
              makeExpectedSearchResult({
                establishment: establishmentCuvisteAtSaintesAndVeaux,
                withOffers: establishmentCuvisteAtSaintesAndVeaux.offers,
                withLocationAndDistance: {
                  ...establishmentCuvisteAtSaintesAndVeaux.establishment
                    .locations[0],
                  distance: 0,
                },
                nafLabel: "Activités des agences de travail temporaire",
              }),
              makeExpectedSearchResult({
                establishment: establishmentCuvisteAtChaniersAndLaRochelle,
                withOffers: establishmentCuvisteAtChaniersAndLaRochelle.offers,
                withLocationAndDistance: {
                  ...establishmentCuvisteAtChaniersAndLaRochelle.establishment
                    .locations[0],
                  distance: 3573.85964781,
                },
                nafLabel: "Activités des agences de travail temporaire",
              }),
              makeExpectedSearchResult({
                establishment: establishmentCuvisteAtChaniersAndLaRochelle,
                withOffers: establishmentCuvisteAtChaniersAndLaRochelle.offers,
                withLocationAndDistance: {
                  ...establishmentCuvisteAtChaniersAndLaRochelle.establishment
                    .locations[1],
                  distance: 61349.82542741,
                },
                nafLabel: "Activités des agences de travail temporaire",
              }),
            ],
          });
        });
      });
    });
    describe("legacySearchImmersionResults", () => {
      describe("with `maxResults` parameter", () => {
        beforeEach(async () => {
          await pgEstablishmentAggregateRepository.insertEstablishmentAggregate(
            establishmentWithOfferA1101_AtPosition,
          );
          await pgEstablishmentAggregateRepository.insertEstablishmentAggregate(
            establishmentWithOfferA1101_close,
          );
          await pgEstablishmentAggregateRepository.insertEstablishmentAggregate(
            establishmentWithOfferA1101_outOfDistanceRange,
          );
        });

        it("returns 1 closest establishment with `maxResults` at 1", async () => {
          expectToEqual(
            await pgEstablishmentAggregateRepository.legacySearchImmersionResults(
              {
                searchMade: searchMadeDistanceWithoutRome,
                maxResults: 1,
              },
            ),
            [
              makeExpectedSearchResult({
                establishment: establishmentWithOfferA1101_AtPosition,
                withOffers: [offer_A1101_11987],
                withLocationAndDistance: {
                  ...locationOfSearchPosition,
                  distance: 0,
                },
                nafLabel: "Activités des agences de travail temporaire",
              }),
            ],
          );
        });

        it("returns 2 closest establishments with `maxResults` at 2", async () => {
          expectToEqual(
            await pgEstablishmentAggregateRepository.legacySearchImmersionResults(
              {
                searchMade: searchMadeDistanceWithoutRome,
                maxResults: 2,
              },
            ),
            [
              makeExpectedSearchResult({
                establishment: establishmentWithOfferA1101_AtPosition,
                withOffers: [offer_A1101_11987],
                withLocationAndDistance: {
                  ...locationOfSearchPosition,
                  distance: 0,
                },
                nafLabel: "Activités des agences de travail temporaire",
              }),
              makeExpectedSearchResult({
                establishment: establishmentWithOfferA1101_close,
                withOffers: [offer_A1101_11987],
                withLocationAndDistance: {
                  ...locationOfCloseSearchPosition,
                  distance: 133.12254555,
                },
                nafLabel: "Activités des agences de travail temporaire",
              }),
            ],
          );
        });

        it("returns 2 closest establishments with `maxResults` at 3 without too far establishment", async () => {
          expectArraysToMatch(
            await pgEstablishmentAggregateRepository.legacySearchImmersionResults(
              {
                searchMade: searchMadeDistanceWithoutRome,
                maxResults: 3,
              },
            ),
            [
              makeExpectedSearchResult({
                establishment: establishmentWithOfferA1101_AtPosition,
                withOffers: [offer_A1101_11987],
                withLocationAndDistance: {
                  ...locationOfSearchPosition,
                  distance: 0,
                },
                nafLabel: "Activités des agences de travail temporaire",
              }),
              makeExpectedSearchResult({
                establishment: establishmentWithOfferA1101_close,
                withOffers: [offer_A1101_11987],
                withLocationAndDistance: {
                  ...locationOfCloseSearchPosition,
                  distance: 133.12254555,
                },
                nafLabel: "Activités des agences de travail temporaire",
              }),
            ],
          );
        });
        it("should always return the same number of results regardless of the sortedBy parameter", async () => {
          await kyselyDb.deleteFrom("establishments__users").execute();
          await kyselyDb.deleteFrom("immersion_offers").execute();
          await kyselyDb.deleteFrom("discussions").execute();
          await kyselyDb.deleteFrom("establishments_location_infos").execute();
          await kyselyDb
            .deleteFrom("establishments_location_positions")
            .execute();
          await kyselyDb.deleteFrom("establishments").execute();

          const INDEX_OF_UNSEARCHABLE_ESTABLISHMENT = 2;
          const INDEX_OF_CURRENTLY_UNAVAILABLE_ESTABLISHMENT = 3;
          const establishmentAggregatesByDateAndScoreDescending: EstablishmentAggregate[] =
            arrayFromNumber(10).map((i) => ({
              ...searchableByAllEstablishment,
              establishment: {
                ...searchableByAllEstablishment.establishment,
                siret: `9999999999999${i}`,
                updatedAt: addDays(new Date(), -i),
                isMaxDiscussionsForPeriodReached:
                  i === INDEX_OF_UNSEARCHABLE_ESTABLISHMENT,
                score: 10 - i,
                nextAvailabilityDate:
                  i === INDEX_OF_CURRENTLY_UNAVAILABLE_ESTABLISHMENT
                    ? addDays(new Date(), i).toISOString()
                    : undefined,
                locations: [
                  {
                    ...searchableByAllEstablishment.establishment.locations[0],
                    id: uuid(),
                  },
                ],
              },
            }));
          const displayedResults = [0, 1, 4, 5, 6];

          const expectedResults = displayedResults.map((i) =>
            makeExpectedSearchResult({
              establishment: establishmentAggregatesByDateAndScoreDescending[i],
              withOffers:
                establishmentAggregatesByDateAndScoreDescending[i].offers,
              withLocationAndDistance: {
                ...establishmentAggregatesByDateAndScoreDescending[i]
                  .establishment.locations[0],
                distance: 0,
              },
              nafLabel: "Activités des agences de travail temporaire",
            }),
          );

          await Promise.all(
            establishmentAggregatesByDateAndScoreDescending.map(
              (establishmentAggregate) =>
                pgEstablishmentAggregateRepository.insertEstablishmentAggregate(
                  establishmentAggregate,
                ),
            ),
          );

          const sortedByDateResults =
            await pgEstablishmentAggregateRepository.legacySearchImmersionResults(
              {
                searchMade: {
                  ...searchMadeDistanceWithoutRome,
                  sortedBy: "date",
                },
                maxResults: 5,
              },
            );

          expectArraysToEqual(sortedByDateResults, expectedResults);

          const sortedByScoreResults =
            await pgEstablishmentAggregateRepository.legacySearchImmersionResults(
              {
                searchMade: {
                  ...searchMadeDistanceWithoutRome,
                  sortedBy: "score",
                },
                maxResults: 5,
              },
            );
          expectArraysToEqual(sortedByScoreResults, expectedResults);

          const sortedByDistanceResults =
            await pgEstablishmentAggregateRepository.legacySearchImmersionResults(
              {
                searchMade: {
                  ...searchMadeDistanceWithoutRome,
                  sortedBy: "distance",
                },
                maxResults: 5,
              },
            );
          expectArraysToEqual(sortedByDistanceResults, expectedResults);
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
              await pgEstablishmentAggregateRepository.legacySearchImmersionResults(
                {
                  searchMade: {
                    ...cartographeSearchMade,
                    establishmentSearchableBy: "students",
                  },
                },
              );

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
                    nafLabel: "Activités des agences de travail temporaire",
                  }),
                )
                .sort(
                  sortSearchResultsByDistanceAndRomeAndSiretOnRandomResults,
                ),
            );
          });

          it(`with "establishmentSearchableBy:'jobSeekers'" return only establishments SearchImmersionResults searchable by jobseekers`, async () => {
            const results =
              await pgEstablishmentAggregateRepository.legacySearchImmersionResults(
                {
                  searchMade: {
                    ...cartographeSearchMade,
                    establishmentSearchableBy: "jobSeekers",
                  },
                },
              );

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
                    nafLabel: "Activités des agences de travail temporaire",
                  }),
                )
                .sort(
                  sortSearchResultsByDistanceAndRomeAndSiretOnRandomResults,
                ),
            );
          });

          it('with"establishmentSearchableBy" not defined return all establishment SearchImmersionResults', async () => {
            const results =
              await pgEstablishmentAggregateRepository.legacySearchImmersionResults(
                {
                  searchMade: cartographeSearchMade,
                },
              );

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
                    nafLabel: "Activités des agences de travail temporaire",
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
              new EstablishmentAggregateBuilder(
                establishmentWithOfferA1101_outOfDistanceRange,
              )
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
              await pgEstablishmentAggregateRepository.legacySearchImmersionResults(
                {
                  searchMade: searchMadeDistanceWithoutRome,
                },
              ),
              [
                makeExpectedSearchResult({
                  establishment: establishmentCloseWithA1101Offers,
                  withOffers: [offer_A1101_17751, offer_A1101_20404],
                  withLocationAndDistance: {
                    ...locationOfSearchPosition,
                    distance: 0,
                  },
                  nafLabel: "Activités des agences de travail temporaire",
                }),
              ],
            );
          });

          it("returns only offers with locations within geographical area without rome code given", async () => {
            const establishmentAggregateAtSaintesAndVeaux =
              new EstablishmentAggregateBuilder()
                .withEstablishmentSiret("78000403200029")
                .withOffers([cuvisteOffer, artisteCirqueOffer])
                .withLocations([
                  bassompierreSaintesLocation,
                  veauxLocation, // outside geographical area
                ])
                .withUserRights([osefUserRight])
                .build();

            const establishmentAggregateAtChaniersAndLaRochelle =
              new EstablishmentAggregateBuilder()
                .withEstablishmentSiret("78000403200030")
                .withOffers([
                  cartographeImmersionOffer,
                  cuvisteOffer,
                  groomChevauxOffer,
                ])
                .withLocations([
                  portHubleChaniersLocation,
                  tourDeLaChaineLaRochelleLocation,
                ])
                .withUserRights([osefUserRight])
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
              await pgEstablishmentAggregateRepository.legacySearchImmersionResults(
                {
                  searchMade: {
                    sortedBy: "date",
                    distanceKm: 100,
                    ...centerOfSaintesGeoPosition,
                  },
                },
              );

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
                    nafLabel: "Activités des agences de travail temporaire",
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
                    nafLabel: "Activités des agences de travail temporaire",
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
                    nafLabel: "Activités des agences de travail temporaire",
                  }),
                ),
              ].sort(sortSearchResultsByDistanceAndRomeAndSiretOnRandomResults),
            );
          });
        });

        describe("'nafCodes' SearchMade param", () => {
          beforeEach(async () => {
            await pgEstablishmentAggregateRepository.insertEstablishmentAggregate(
              establishment0145Z_A,
            );
            await pgEstablishmentAggregateRepository.insertEstablishmentAggregate(
              establishment0145Z_B,
            );
            await pgEstablishmentAggregateRepository.insertEstablishmentAggregate(
              establishment9900Z,
            );
            await pgEstablishmentAggregateRepository.insertEstablishmentAggregate(
              establishment4741Z,
            );
          });

          it("establishments with all naf when naf filter is not provided", async () => {
            const results =
              await pgEstablishmentAggregateRepository.legacySearchImmersionResults(
                {
                  searchMade: {},
                },
              );

            expectToEqual(
              results.sort(
                sortSearchResultsByDistanceAndRomeAndSiretOnRandomResults,
              ),
              [
                makeExpectedSearchResult({
                  establishment: establishment0145Z_A,
                  withLocationAndDistance: {
                    ...establishment0145Z_A.establishment.locations[0],
                    distance: undefined,
                  },
                  withOffers: establishment0145Z_A.offers,
                  nafLabel: "Élevage d'ovins et de caprins",
                }),
                makeExpectedSearchResult({
                  establishment: establishment0145Z_B,
                  withLocationAndDistance: {
                    ...establishment0145Z_B.establishment.locations[0],
                    distance: undefined,
                  },
                  withOffers: establishment0145Z_B.offers,
                  nafLabel: "Élevage d'ovins et de caprins",
                }),
                makeExpectedSearchResult({
                  establishment: establishment4741Z,
                  withLocationAndDistance: {
                    ...establishment4741Z.establishment.locations[0],
                    distance: undefined,
                  },
                  withOffers: establishment4741Z.offers,
                  nafLabel:
                    "Commerce de détail d'ordinateurs, d'unités périphériques et de logiciels en magasin spécialisé",
                }),
                makeExpectedSearchResult({
                  establishment: establishment9900Z,
                  withLocationAndDistance: {
                    ...establishment9900Z.establishment.locations[0],
                    distance: undefined,
                  },
                  withOffers: establishment9900Z.offers,
                  nafLabel:
                    "Activités des organisations et organismes extraterritoriaux",
                }),
              ].sort(sortSearchResultsByDistanceAndRomeAndSiretOnRandomResults),
            );
          });

          it("establishments with all naf when naf filter is empty", async () => {
            const results =
              await pgEstablishmentAggregateRepository.legacySearchImmersionResults(
                {
                  searchMade: { nafCodes: [] },
                },
              );

            expectToEqual(
              results.sort(
                sortSearchResultsByDistanceAndRomeAndSiretOnRandomResults,
              ),
              [
                makeExpectedSearchResult({
                  establishment: establishment0145Z_A,
                  withLocationAndDistance: {
                    ...establishment0145Z_A.establishment.locations[0],
                    distance: undefined,
                  },
                  withOffers: establishment0145Z_A.offers,
                  nafLabel: "Élevage d'ovins et de caprins",
                }),
                makeExpectedSearchResult({
                  establishment: establishment0145Z_B,
                  withLocationAndDistance: {
                    ...establishment0145Z_B.establishment.locations[0],
                    distance: undefined,
                  },
                  withOffers: establishment0145Z_B.offers,
                  nafLabel: "Élevage d'ovins et de caprins",
                }),
                makeExpectedSearchResult({
                  establishment: establishment4741Z,
                  withLocationAndDistance: {
                    ...establishment4741Z.establishment.locations[0],
                    distance: undefined,
                  },
                  withOffers: establishment4741Z.offers,
                  nafLabel:
                    "Commerce de détail d'ordinateurs, d'unités périphériques et de logiciels en magasin spécialisé",
                }),
                makeExpectedSearchResult({
                  establishment: establishment9900Z,
                  withLocationAndDistance: {
                    ...establishment9900Z.establishment.locations[0],
                    distance: undefined,
                  },
                  withOffers: establishment9900Z.offers,
                  nafLabel:
                    "Activités des organisations et organismes extraterritoriaux",
                }),
              ].sort(sortSearchResultsByDistanceAndRomeAndSiretOnRandomResults),
            );
          });

          it("establishments with naf when naf filter is provided with one value", async () => {
            const results =
              await pgEstablishmentAggregateRepository.legacySearchImmersionResults(
                {
                  searchMade: {
                    nafCodes: [establishment0145Z_A.establishment.nafDto.code],
                  },
                },
              );

            expectToEqual(
              results.sort(
                sortSearchResultsByDistanceAndRomeAndSiretOnRandomResults,
              ),
              [establishment0145Z_A, establishment0145Z_B]
                .map((establishment) =>
                  makeExpectedSearchResult({
                    establishment: establishment,
                    withLocationAndDistance: {
                      ...establishment.establishment.locations[0],
                      distance: undefined,
                    },
                    withOffers: establishment.offers,
                    nafLabel: "Élevage d'ovins et de caprins",
                  }),
                )
                .sort(
                  sortSearchResultsByDistanceAndRomeAndSiretOnRandomResults,
                ),
            );
          });

          it("establishments with different naf when naf filter is provided with multiple values", async () => {
            const results =
              await pgEstablishmentAggregateRepository.legacySearchImmersionResults(
                {
                  searchMade: {
                    nafCodes: [
                      establishment0145Z_A.establishment.nafDto.code,
                      establishment4741Z.establishment.nafDto.code,
                    ],
                  },
                },
              );

            expectToEqual(
              results.sort(
                sortSearchResultsByDistanceAndRomeAndSiretOnRandomResults,
              ),
              [
                makeExpectedSearchResult({
                  establishment: establishment0145Z_A,
                  withLocationAndDistance: {
                    ...establishment0145Z_A.establishment.locations[0],
                    distance: undefined,
                  },
                  withOffers: establishment0145Z_A.offers,
                  nafLabel: "Élevage d'ovins et de caprins",
                }),
                makeExpectedSearchResult({
                  establishment: establishment0145Z_B,
                  withLocationAndDistance: {
                    ...establishment0145Z_B.establishment.locations[0],
                    distance: undefined,
                  },
                  withOffers: establishment0145Z_B.offers,
                  nafLabel: "Élevage d'ovins et de caprins",
                }),
                makeExpectedSearchResult({
                  establishment: establishment4741Z,
                  withLocationAndDistance: {
                    ...establishment4741Z.establishment.locations[0],
                    distance: undefined,
                  },
                  withOffers: establishment4741Z.offers,
                  nafLabel:
                    "Commerce de détail d'ordinateurs, d'unités périphériques et de logiciels en magasin spécialisé",
                }),
              ].sort(sortSearchResultsByDistanceAndRomeAndSiretOnRandomResults),
            );
          });
        });
      });

      describe("fitForDisabledWorkers param", () => {
        const offer = new OfferEntityBuilder().build();

        const notFitForDisabledWorkers = new EstablishmentAggregateBuilder()
          .withEstablishmentSiret("00000000000001")
          .withFitForDisabledWorkers("no")
          .withLocationId(uuid())
          .withOffers([offer])
          .withUserRights([osefUserRight])
          .build();

        const fitForDisabledWorkers = new EstablishmentAggregateBuilder()
          .withEstablishmentSiret("00000000000002")
          .withFitForDisabledWorkers("yes-ft-certified")
          .withLocationId(uuid())
          .withOffers([offer])
          .withUserRights([osefUserRight])
          .build();

        beforeEach(async () => {
          await Promise.all(
            [notFitForDisabledWorkers, fitForDisabledWorkers].map(
              (establishment) =>
                pgEstablishmentAggregateRepository.insertEstablishmentAggregate(
                  establishment,
                ),
            ),
          );
        });

        it("without param", async () => {
          const results =
            await pgEstablishmentAggregateRepository.legacySearchImmersionResults(
              {
                searchMade: {
                  distanceKm: 10,
                  lat: fitForDisabledWorkers.establishment.locations[0].position
                    .lat,
                  lon: fitForDisabledWorkers.establishment.locations[0].position
                    .lon,
                },
              },
            );
          expectToEqual(results, [
            makeExpectedSearchResult({
              establishment: notFitForDisabledWorkers,
              withOffers: [offer],
              withLocationAndDistance: {
                ...notFitForDisabledWorkers.establishment.locations[0],
                distance: 0,
              },
              nafLabel: "Activités des agences de travail temporaire",
            }),
            makeExpectedSearchResult({
              establishment: fitForDisabledWorkers,
              withOffers: [offer],
              withLocationAndDistance: {
                ...fitForDisabledWorkers.establishment.locations[0],
                distance: 0,
              },
              nafLabel: "Activités des agences de travail temporaire",
            }),
          ]);
        });

        it("with param false", async () => {
          const results =
            await pgEstablishmentAggregateRepository.legacySearchImmersionResults(
              {
                searchMade: {
                  distanceKm: 10,
                  lat: fitForDisabledWorkers.establishment.locations[0].position
                    .lat,
                  lon: fitForDisabledWorkers.establishment.locations[0].position
                    .lon,
                },
                fitForDisabledWorkers: false,
              },
            );
          expectToEqual(results, [
            makeExpectedSearchResult({
              establishment: notFitForDisabledWorkers,
              withOffers: [offer],
              withLocationAndDistance: {
                ...notFitForDisabledWorkers.establishment.locations[0],
                distance: 0,
              },
              nafLabel: "Activités des agences de travail temporaire",
            }),
          ]);
        });

        it("with param true", async () => {
          const results =
            await pgEstablishmentAggregateRepository.legacySearchImmersionResults(
              {
                searchMade: {
                  distanceKm: 10,
                  lat: fitForDisabledWorkers.establishment.locations[0].position
                    .lat,
                  lon: fitForDisabledWorkers.establishment.locations[0].position
                    .lon,
                },
                fitForDisabledWorkers: true,
              },
            );
          expectToEqual(results, [
            makeExpectedSearchResult({
              establishment: fitForDisabledWorkers,
              withOffers: [offer],
              withLocationAndDistance: {
                ...fitForDisabledWorkers.establishment.locations[0],
                distance: 0,
              },
              nafLabel: "Activités des agences de travail temporaire",
            }),
          ]);
        });
      });

      it("returns empty list when repo is empty", async () => {
        expectToEqual(
          await pgEstablishmentAggregateRepository.legacySearchImmersionResults(
            {
              searchMade: cartographeSearchMade,
            },
          ),
          [],
        );
      });

      it("no location but keys provided in params - case occured from usecase without location", async () => {
        await pgEstablishmentAggregateRepository.insertEstablishmentAggregate(
          establishmentWithOfferA1101_AtPosition,
        );

        expectToEqual(
          await pgEstablishmentAggregateRepository.legacySearchImmersionResults(
            {
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
            },
          ),
          [
            makeExpectedSearchResult({
              establishment: establishmentWithOfferA1101_AtPosition,
              withOffers: [offer_A1101_11987],
              withLocationAndDistance: {
                ...locationOfSearchPosition,
                distance: undefined,
              },
              nafLabel: "Activités des agences de travail temporaire",
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
          .withUserRights([osefUserRight])
          .build();

        await pgEstablishmentAggregateRepository.insertEstablishmentAggregate(
          openEstablishment,
        );
        await pgEstablishmentAggregateRepository.insertEstablishmentAggregate(
          closedEstablishment,
        );

        // Assert
        expectToEqual(
          await pgEstablishmentAggregateRepository.legacySearchImmersionResults(
            {
              searchMade: cartographeSearchMade,
            },
          ),
          [
            makeExpectedSearchResult({
              establishment: openEstablishment,
              withLocationAndDistance: {
                ...locationOfSearchPosition,
                distance: 0,
              },
              withOffers: [cartographeImmersionOffer],
              nafLabel: "Activités des agences de travail temporaire",
            }),
          ],
        );
      });

      it("returns one search DTO by establishment, with offers matching rome and geographical area", async () => {
        const establishmentAtRangeWithRome = new EstablishmentAggregateBuilder()
          .withEstablishmentSiret("00000000000001")
          .withOffers([
            analysteEnGeomatiqueImmersionOffer,
            cartographeImmersionOffer,
          ])
          .withLocations([locationOfSearchPosition])
          .withUserRights([osefUserRight])
          .build();

        const establishmentAtRangeWithOtherRome =
          new EstablishmentAggregateBuilder()
            .withEstablishmentSiret("00000000000002")
            .withOffers([artisteCirqueOffer])
            .withLocations([locationOfCloseSearchPosition])
            .withUserRights([osefUserRight])
            .build();

        const establishmentOutOfRangeWithRome =
          new EstablishmentAggregateBuilder()
            .withEstablishmentSiret("00000000000003")
            .withOffers([
              cartographeImmersionOffer,
              analysteEnGeomatiqueImmersionOffer,
            ])
            .withLocations([locationOutOfAnySearchedPosition])
            .withUserRights([osefUserRight])
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
          await pgEstablishmentAggregateRepository.legacySearchImmersionResults(
            {
              searchMade: cartographeSearchMade,
            },
          ),
          [
            makeExpectedSearchResult({
              establishment: establishmentAtRangeWithRome,
              withLocationAndDistance: {
                ...locationOfSearchPosition,
                distance: 0,
              },
              withOffers: establishmentAtRangeWithRome.offers,
              nafLabel: "Activités des agences de travail temporaire",
            }),
          ],
        );

        expectToEqual(
          await pgEstablishmentAggregateRepository.legacySearchImmersionResults(
            {
              searchMade: { ...cartographeSearchMade, romeCode: "A1010" },
            },
          ),
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
            await pgEstablishmentAggregateRepository.legacySearchImmersionResults(
              {
                searchMade: {
                  sortedBy: "date",
                  distanceKm: 50,
                  ...centerOfSaintesGeoPosition,
                  romeCode: cuvisteOffer.romeCode,
                },
              },
            ),
            [
              makeExpectedSearchResult({
                establishment: establishmentCuvisteAtSaintesAndVeaux,
                withLocationAndDistance: {
                  ...bassompierreSaintesLocation,
                  distance: 7704.55035665,
                },
                withOffers: [cuvisteOffer],
                nafLabel: "Activités des agences de travail temporaire",
              }),
              makeExpectedSearchResult({
                establishment: establishmentCuvisteAtChaniersAndLaRochelle,
                withLocationAndDistance: {
                  ...portHubleChaniersLocation,
                  distance: 11093.36505388,
                },
                withOffers: [cuvisteOffer],
                nafLabel: "Activités des agences de travail temporaire",
              }),
            ],
          );
        });

        it("no search results with multiple locations and without matching rome code", async () => {
          expectToEqual(
            await pgEstablishmentAggregateRepository.legacySearchImmersionResults(
              {
                searchMade: {
                  sortedBy: "date",
                  distanceKm: 100,
                  ...centerOfSaintesGeoPosition,
                  romeCode: groomChevauxOffer.romeCode,
                },
              },
            ),
            [],
          );
        });
      });

      describe("sorting", () => {
        it("if sorted=distance, returns closest establishments in first", async () => {
          const closeEstablishment = new EstablishmentAggregateBuilder()
            .withEstablishmentSiret("00000000000001")
            .withOffers([cartographeImmersionOffer])
            .withLocations([
              new LocationBuilder(locationOfSearchPosition)
                .withId(uuid())
                .build(),
            ])
            .withUserRights([osefUserRight])
            .build();

          const farEstablishment = new EstablishmentAggregateBuilder()
            .withEstablishmentSiret("00000000000002")
            .withOffers([cartographeImmersionOffer])
            .withLocations([
              new LocationBuilder(locationOfSearchPosition)

                .withPosition({
                  lat: locationOfSearchPosition.position.lat + 0.001,
                  lon: locationOfSearchPosition.position.lon + 0.001,
                })
                .withId(uuid())
                .build(),
            ])
            .withUserRights([osefUserRight])
            .build();

          await pgEstablishmentAggregateRepository.insertEstablishmentAggregate(
            closeEstablishment,
          );
          await pgEstablishmentAggregateRepository.insertEstablishmentAggregate(
            farEstablishment,
          );

          // Act
          const searchResult =
            await pgEstablishmentAggregateRepository.legacySearchImmersionResults(
              {
                searchMade: { ...cartographeSearchMade, sortedBy: "distance" },
                maxResults: 2,
              },
            );

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
            .withUserRights([osefUserRight])
            .build();

          const olderOfferEstablishment = new EstablishmentAggregateBuilder()
            .withEstablishmentSiret("00000000000002")
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
            .withUserRights([osefUserRight])
            .build();

          await pgEstablishmentAggregateRepository.insertEstablishmentAggregate(
            recentOfferEstablishment,
          );
          await pgEstablishmentAggregateRepository.insertEstablishmentAggregate(
            olderOfferEstablishment,
          );

          // Act
          const searchResult =
            await pgEstablishmentAggregateRepository.legacySearchImmersionResults(
              {
                searchMade: { ...cartographeSearchMade, sortedBy: "date" },
                maxResults: 2,
              },
            );

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
              .withScore(10)
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
                new OfferEntityBuilder(cartographeImmersionOffer).build(),
                new OfferEntityBuilder(
                  analysteEnGeomatiqueImmersionOffer,
                ).build(),
              ])
              .withUserRights([osefUserRight])
              .build();

          const establishmentWithMediumScores =
            new EstablishmentAggregateBuilder()
              .withEstablishmentSiret("00000000000002")
              .withScore(6)
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
                new OfferEntityBuilder(cartographeImmersionOffer).build(),
                new OfferEntityBuilder(
                  analysteEnGeomatiqueImmersionOffer,
                ).build(),
              ])
              .withUserRights([osefUserRight])
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
            await pgEstablishmentAggregateRepository.legacySearchImmersionResults(
              {
                searchMade: { ...cartographeSearchMade, sortedBy: "score" },
              },
            );
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
        const mostRecentDate = new Date("2022-05-05");
        const establishmentWithMostRecentOffer =
          new EstablishmentAggregateBuilder()
            .withEstablishmentUpdatedAt(mostRecentDate)
            .withOffers([
              new OfferEntityBuilder(cartographeImmersionOffer)
                .withCreatedAt(mostRecentDate)
                .build(),
            ])
            .withEstablishmentSiret("99000403200029")
            .withLocations([
              new LocationBuilder(locationOfSearchPosition)
                .withId(uuid())
                .build(),
            ])
            .withUserRights([osefUserRight])
            .build();

        const olderDate = new Date("2022-05-02");
        const establishmentWithMostOlderOffer =
          new EstablishmentAggregateBuilder()
            .withEstablishmentUpdatedAt(olderDate)
            .withOffers([
              new OfferEntityBuilder(analysteEnGeomatiqueImmersionOffer)
                .withCreatedAt(olderDate)
                .build(),
            ])
            .withEstablishmentSiret("11000403200029")
            .withLocations([
              new LocationBuilder(locationOfSearchPosition)
                .withId(uuid())
                .build(),
            ])
            .withUserRights([osefUserRight])
            .build();

        await pgEstablishmentAggregateRepository.insertEstablishmentAggregate(
          establishmentWithMostRecentOffer,
        );
        await pgEstablishmentAggregateRepository.insertEstablishmentAggregate(
          establishmentWithMostOlderOffer,
        );

        // Act
        const searchResult =
          await pgEstablishmentAggregateRepository.legacySearchImmersionResults(
            {
              searchMade: {
                ...cartographeSearchMade,
                sortedBy: "date",
                appellationCodes: [
                  cartographeImmersionOffer.appellationCode,
                  analysteEnGeomatiqueImmersionOffer.appellationCode,
                ],
              },
            },
          );

        // Assert
        expectToEqual(
          searchResult.map(({ siret }) => siret),
          [
            establishmentWithMostRecentOffer,
            establishmentWithMostOlderOffer,
          ].map(({ establishment }) => establishment.siret),
        );
      });

      it("provide next availability date, update_date and created_at on result", async () => {
        const recentDate = new Date("2023-12-02");
        const aggregateWithOptionalValues = new EstablishmentAggregateBuilder()
          .withLocations([
            new LocationBuilder(portHubleChaniersLocation)
              .withId(uuid())
              .build(),
          ])
          .withOffers([
            new OfferEntityBuilder().withCreatedAt(recentDate).build(),
          ])
          .withEstablishmentNextAvailabilityDate(new Date())
          .withEstablishmentUpdatedAt(recentDate)
          .withUserRights([osefUserRight])
          .build();

        const olderDate = new Date("2023-12-01");
        const aggregateWithoutOptionalValues =
          new EstablishmentAggregateBuilder()
            .withLocations([
              new LocationBuilder(portHubleChaniersLocation)
                .withId(uuid())
                .build(),
            ])
            .withOffers([
              new OfferEntityBuilder().withCreatedAt(olderDate).build(),
            ])
            .withEstablishmentSiret("12341234123412")
            .withEstablishmentNextAvailabilityDate(undefined)
            .withEstablishmentUpdatedAt(olderDate)
            .withUserRights([osefUserRight])
            .build();

        await pgEstablishmentAggregateRepository.insertEstablishmentAggregate(
          aggregateWithOptionalValues,
        );
        await pgEstablishmentAggregateRepository.insertEstablishmentAggregate(
          aggregateWithoutOptionalValues,
        );

        const searchResults =
          await pgEstablishmentAggregateRepository.legacySearchImmersionResults(
            {
              searchMade: {
                ...aggregateWithOptionalValues.establishment.locations[0]
                  .position,
                appellationCodes: [
                  aggregateWithOptionalValues.offers[0].appellationCode,
                ],
                distanceKm: 0,
                sortedBy: "date",
              },
              maxResults: 2,
            },
          );

        expectToEqual(
          searchResults.map(
            ({ siret, nextAvailabilityDate, updatedAt, createdAt }) => ({
              siret,
              nextAvailabilityDate,
              updatedAt,
              createdAt,
            }),
          ),
          [
            {
              siret: aggregateWithOptionalValues.establishment.siret,
              nextAvailabilityDate:
                aggregateWithOptionalValues.establishment.nextAvailabilityDate,
              updatedAt:
                aggregateWithOptionalValues.establishment.updatedAt.toISOString(),
              createdAt:
                aggregateWithOptionalValues.establishment.createdAt.toISOString(),
            },
            {
              siret: aggregateWithoutOptionalValues.establishment.siret,
              nextAvailabilityDate: undefined,
              updatedAt:
                aggregateWithoutOptionalValues.establishment.updatedAt.toISOString(),
              createdAt:
                aggregateWithoutOptionalValues.establishment.createdAt.toISOString(),
            },
          ],
        );
      });
      it("should return immersion offers even without lat/lon/distanceKm search", async () => {
        const establishmentAggregate = new EstablishmentAggregateBuilder()
          .withEstablishmentSiret("78000403200029")
          .withOffers([cuvisteOffer, artisteCirqueOffer])
          .withLocations([bassompierreSaintesLocation, veauxLocation])
          .withUserRights([osefUserRight])
          .build();

        // Prepare
        await pgEstablishmentAggregateRepository.insertEstablishmentAggregate(
          establishmentAggregate,
        );

        // Act
        const searchResults: InternalOfferDto[] =
          await pgEstablishmentAggregateRepository.legacySearchImmersionResults(
            {
              searchMade: {
                sortedBy: "date",
              },
            },
          );
        const readableResults = searchResults.map(toReadableSearchResult);

        // Assert
        expect(readableResults).toHaveLength(4);
      });

      describe("Wrong paths", () => {
        it("should throw on a search made with sortedBy distance and no geo params are provided", async () => {
          // Assert
          await expectPromiseToFailWithError(
            pgEstablishmentAggregateRepository.legacySearchImmersionResults({
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
            pgEstablishmentAggregateRepository.legacySearchImmersionResults({
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
            pgEstablishmentAggregateRepository.legacySearchImmersionResults({
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

        it("should throw if lat / lon are 0 but distanceKm is provided and not 0 and sorted by distance", async () => {
          // Assert
          await expectPromiseToFailWithError(
            pgEstablishmentAggregateRepository.legacySearchImmersionResults({
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
            pgEstablishmentAggregateRepository.legacySearchImmersionResults({
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

    describe("getOffersAsAppellationDtoForFormEstablishment", () => {
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

    describe("getSearchResultBySearchQuery", () => {
      beforeEach(async () => {
        await pgEstablishmentAggregateRepository.insertEstablishmentAggregate(
          establishmentWithOfferA1101_AtPosition,
        );
      });

      it("undefined when missing offer by siret", async () => {
        const missingSiret = "11111111111111";

        expectToEqual(
          await pgEstablishmentAggregateRepository.getSearchResultBySearchQuery(
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
          await pgEstablishmentAggregateRepository.getSearchResultBySearchQuery(
            establishmentWithOfferA1101_AtPosition.establishment.siret,
            establishmentWithOfferA1101_AtPosition.offers[0].appellationCode,
            missingLocationId,
          ),
          undefined,
        );
      });

      it("undefined when missing offer appellation code", async () => {
        const missingAppellationCode = artisteCirqueOffer.appellationCode;

        expectToEqual(
          await pgEstablishmentAggregateRepository.getSearchResultBySearchQuery(
            establishmentWithOfferA1101_AtPosition.establishment.siret,
            missingAppellationCode,
            establishmentWithOfferA1101_AtPosition.establishment.locations[0]
              .id,
          ),
          undefined,
        );
      });

      it("Returns reconstructed SearchImmersionResultDto for given siret, appellationCode and location id", async () => {
        expectToEqual(
          await pgEstablishmentAggregateRepository.getSearchResultBySearchQuery(
            establishmentWithOfferA1101_AtPosition.establishment.siret,
            establishmentWithOfferA1101_AtPosition.offers[0].appellationCode,
            establishmentWithOfferA1101_AtPosition.establishment.locations[0]
              .id,
          ),
          {
            rome: establishmentWithOfferA1101_AtPosition.offers[0].romeCode,
            romeLabel:
              establishmentWithOfferA1101_AtPosition.offers[0].romeLabel,
            establishmentScore:
              establishmentWithOfferA1101_AtPosition.establishment.score,
            appellations: [
              {
                appellationLabel:
                  establishmentWithOfferA1101_AtPosition.offers[0]
                    .appellationLabel,
                appellationCode:
                  establishmentWithOfferA1101_AtPosition.offers[0]
                    .appellationCode,
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
              establishmentWithOfferA1101_AtPosition.establishment.contactMode,
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
            createdAt:
              establishmentWithOfferA1101_AtPosition.establishment.createdAt.toISOString(),
            updatedAt:
              establishmentWithOfferA1101_AtPosition.establishment.updatedAt.toISOString(),
            remoteWorkMode:
              establishmentWithOfferA1101_AtPosition.offers[0].remoteWorkMode,
            isAvailable: true,
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
          await pgEstablishmentAggregateRepository.getAllEstablishmentAggregatesForTest(),
          [],
        );
      });

      it("adds the establishment values in `establishments` table when one new establishment is given", async () => {
        const establishmentAggregate = new EstablishmentAggregateBuilder()
          .withEstablishment(
            new EstablishmentEntityBuilder()
              .withMaxContactsPerMonth(24)
              .withLastInseeCheck(new Date("2020-04-14T12:00:00.000"))
              .build(),
          )
          .withUserRights([osefUserRight])
          .build();

        await pgEstablishmentAggregateRepository.insertEstablishmentAggregate(
          establishmentAggregate,
        );

        expectToEqual(
          await pgEstablishmentAggregateRepository.getAllEstablishmentAggregatesForTest(),
          [establishmentAggregate],
        );
      });

      it("adds the establishment values in `establishments` table with welcome address", async () => {
        const establishmentAggregate = new EstablishmentAggregateBuilder()
          .withEstablishment(
            new EstablishmentEntityBuilder()
              .withMaxContactsPerMonth(24)
              .withLastInseeCheck(new Date("2020-04-14T12:00:00.000"))
              .withContactMode("IN_PERSON")
              .withWelcomeAddress({
                address: {
                  streetNumberAndAddress: "127 rue de Grenelle",
                  postcode: "75007",
                  city: "Paris",
                  departmentCode: "75",
                },
                position: { lat: 48.8566, lon: 2.3522 },
              })
              .build(),
          )
          .withUserRights([osefUserRight])
          .build();

        await pgEstablishmentAggregateRepository.insertEstablishmentAggregate(
          establishmentAggregate,
        );

        expectToEqual(
          await pgEstablishmentAggregateRepository.getAllEstablishmentAggregatesForTest(),
          [establishmentAggregate],
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
          .withUserRights([osefUserRight])
          .build();

        await pgEstablishmentAggregateRepository.insertEstablishmentAggregate(
          establishment,
        );

        expectToEqual(
          await pgEstablishmentAggregateRepository.getAllEstablishmentAggregatesForTest(),
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
            .withUserRights([osefUserRight])
            .build(),
          new EstablishmentAggregateBuilder()
            .withEstablishmentSiret(siret2)
            .withOffers([new OfferEntityBuilder().build()])
            .withUserRights([osefUserRight])
            .build(),
        ];

        for (const establishment of establishments) {
          await pgEstablishmentAggregateRepository.insertEstablishmentAggregate(
            establishment,
          );
        }

        expectToEqual(
          await pgEstablishmentAggregateRepository.getAllEstablishmentAggregatesForTest(),
          establishments,
        );
      });

      it("adds a new row in contact table with contact referencing the establishment siret", async () => {
        const establishment = new EstablishmentAggregateBuilder()
          .withEstablishmentSiret(siret1)
          .withContactMode("EMAIL")
          .withUserRights([osefUserRight])
          .build();

        await pgEstablishmentAggregateRepository.insertEstablishmentAggregate(
          establishment,
        );

        expectToEqual(
          await pgEstablishmentAggregateRepository.getAllEstablishmentAggregatesForTest(),
          [establishment],
        );
      });

      it("adds as many row as immersion offers in table `immersion_offers`, each referencing the establishment siret and the contact uuid", async () => {
        const establishment = new EstablishmentAggregateBuilder()
          .withEstablishmentSiret(siret1)
          .withOffers([
            new OfferEntityBuilder()
              .withRomeLabel("Stylisme")
              .withRomeCode("B1805")
              .withAppellationLabel("Styliste")
              .withAppellationCode("19540")
              .build(),
            new OfferEntityBuilder()
              .withRomeLabel("Stylisme")
              .withRomeCode("B1805")
              .withAppellationCode("19541")
              .withAppellationLabel("Styliste chaussure")
              .build(),
          ])
          .withUserRights([osefUserRight])
          .build();

        await pgEstablishmentAggregateRepository.insertEstablishmentAggregate(
          establishment,
        );

        expectToEqual(
          await pgEstablishmentAggregateRepository.getAllEstablishmentAggregatesForTest(),
          [establishment],
        );
      });
      it("adds a new row in immersion_offers table with remote work mode", async () => {
        const offer = new OfferEntityBuilder()
          .withRemoteWorkMode("FULL_REMOTE")
          .build();
        const establishment = new EstablishmentAggregateBuilder()
          .withEstablishmentSiret(siret1)
          .withOffers([offer])
          .withUserRights([osefUserRight])
          .build();
        await pgEstablishmentAggregateRepository.insertEstablishmentAggregate(
          establishment,
        );

        expectToEqual(
          await pgEstablishmentAggregateRepository.getAllEstablishmentAggregatesForTest(),
          [establishment],
        );
      });
    });

    describe("updateEstablishmentAggregate", () => {
      const user = new UserBuilder()
        .withId(uuid())
        .withEmail("email@mail.com")
        .build();

      const user2 = new UserBuilder()
        .withId(uuid())
        .withEmail("email2@mail.com")
        .build();

      const updatedAt = new Date();
      const aquisition: WithAcquisition = {
        acquisitionCampaign: "my-campaign",
        acquisitionKeyword: "my-keyword",
      };
      const analysteEnGeomatiqueImmersionOfferRemote = new OfferEntityBuilder()
        .withRomeLabel("Information géographique")
        .withRomeCode("M1808")
        .withAppellationLabel("Analyste en géomatique")
        .withAppellationCode("10946")
        .withRemoteWorkMode("FULL_REMOTE")
        .build();

      beforeEach(async () => {
        await pgUserRepository.save(user);
        await pgUserRepository.save(user2);
      });

      it.each([
        {
          originalEstablishment: new EstablishmentAggregateBuilder()
            .withEstablishmentSiret("78000403200029")
            .withEstablishmentCreatedAt(new Date("2021-01-15"))
            .withUserRights([
              {
                role: "establishment-admin",
                job: "aaaaaaaaaaaaa",
                phone: "+33600000000",
                userId: user.id,
                shouldReceiveDiscussionNotifications: true,
                isMainContactByPhone: false,
              },
              {
                role: "establishment-contact",
                job: "aaaaaaaaaaaaa",
                phone: "+33600000000",
                userId: user2.id,
                shouldReceiveDiscussionNotifications: true,
              },
            ])
            .withOffers([analysteEnGeomatiqueImmersionOffer, cuvisteOffer])
            .build(),
          updatedEstablishment: new EstablishmentAggregateBuilder()
            .withEstablishmentSiret("78000403200029")
            .withEstablishmentCreatedAt(new Date("2021-01-15"))
            .withUserRights([
              {
                role: "establishment-admin",
                job: "aaaaaaaaaaaaa",
                phone: "+33600000000",
                userId: user.id,
                shouldReceiveDiscussionNotifications: true,
                isMainContactByPhone: false,
              },
              {
                role: "establishment-contact",
                job: "bbbbbbbbbb",
                phone: "+33600000099",
                userId: user2.id,
                shouldReceiveDiscussionNotifications: false,
              },
            ])
            .withOffers([
              analysteEnGeomatiqueImmersionOfferRemote,
              artisteCirqueOffer,
              cuvisteOffer,
            ])
            .build(),
          title: "add immersion offer on establishment",
        },
        {
          originalEstablishment: new EstablishmentAggregateBuilder()
            .withEstablishmentSiret("78000403200029")
            .withEstablishmentCreatedAt(new Date("2021-01-15"))
            .withUserRights([
              {
                role: "establishment-admin",
                job: "aaaaaaaaaaaaa",
                phone: "+33600000000",
                userId: user.id,
                shouldReceiveDiscussionNotifications: true,
                isMainContactByPhone: false,
              },
              {
                role: "establishment-contact",
                job: "bbbbbbbbbbbbb",
                phone: "+33600000099",
                userId: user2.id,
                shouldReceiveDiscussionNotifications: false,
              },
            ])
            .build(),
          updatedEstablishment: new EstablishmentAggregateBuilder()
            .withEstablishmentSiret("78000403200029")
            .withEstablishmentCreatedAt(new Date("2021-01-15"))
            .withEstablishmentUpdatedAt(updatedAt)
            .withUserRights([
              {
                role: "establishment-admin",
                job: "sdlm!fjsdlfkjsdmlfj",
                phone: "+33666887744",
                userId: user.id,
                shouldReceiveDiscussionNotifications: true,
                isMainContactByPhone: false,
              },
            ])
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
            .withEstablishmentCustomizedName(
              "Activités des agences de travail temporaire",
            )
            .withUserRights([osefUserRight])
            .build(),
          updatedEstablishment: new EstablishmentAggregateBuilder()
            .withEstablishmentCustomizedName(undefined)
            .withUserRights([osefUserRight])
            .withEstablishmentUpdatedAt(updatedAt)
            .build(),
          title: "removes customized name",
        },
        {
          originalEstablishment: new EstablishmentAggregateBuilder()
            .withContactMode("EMAIL")
            .withUserRights([osefUserRight])
            .build(),
          updatedEstablishment: new EstablishmentAggregateBuilder()
            .withContactMode("IN_PERSON")
            .withEstablishmentWelcomeAddress({
              address: {
                streetNumberAndAddress: "127 rue de Grenelle",
                postcode: "75007",
                city: "Paris",
                departmentCode: "75",
              },
              position: { lat: 48.8566, lon: 2.3522 },
            })
            .withUserRights([osefUserRight])
            .withEstablishmentUpdatedAt(updatedAt)
            .build(),
          title: "updates an establishment existing contact",
        },
        {
          originalEstablishment: new EstablishmentAggregateBuilder()
            .withEstablishment(
              new EstablishmentEntityBuilder()
                .withAdditionalInformation("my additionnal info")
                .withCustomizedName("my customize name")
                .withContactMode("IN_PERSON")
                .withFitForDisabledWorkers("yes-ft-certified")
                .withIsCommited(true)
                .withLastInseeCheck(new Date())
                .withNextAvailabilityDate(new Date())
                .withMaxContactsPerMonth(2)
                .withUpdatedAt(new Date())
                .withWelcomeAddress({
                  address: {
                    streetNumberAndAddress: "127 rue de Grenelle",
                    postcode: "75007",
                    city: "Paris",
                    departmentCode: "75",
                  },
                  position: { lat: 48.8566, lon: 2.3522 },
                })
                .withWebsite("https://www.truc.com")
                .withAcquisition(aquisition)
                .build(),
            )
            .withUserRights([osefUserRight])
            .build(),
          updatedEstablishment: new EstablishmentAggregateBuilder()
            .withEstablishment(
              new EstablishmentEntityBuilder(
                new EstablishmentEntityBuilder()
                  .withAdditionalInformation("my additionnal info")
                  .withCustomizedName("my customize name")
                  .withFitForDisabledWorkers("yes-ft-certified")
                  .withIsCommited(true)
                  .withContactMode("EMAIL")
                  .withLastInseeCheck(new Date())
                  .withNextAvailabilityDate(new Date())
                  .withMaxContactsPerMonth(5)
                  .withUpdatedAt(new Date())
                  .withWebsite("https://www.truc.com")
                  .withAcquisition(aquisition)
                  .build(),
              )
                .withAdditionalInformation("")
                .withCustomizedName(undefined)
                .withIsCommited(undefined)
                .withLastInseeCheck(undefined)
                .withNextAvailabilityDate(undefined)
                .withUpdatedAt(updatedAt)
                .withWebsite(undefined)
                .withAcquisition(aquisition)
                .build(),
            )
            .withUserRights([osefUserRight])
            .build(),
          title: "remove optional values",
        },
      ] satisfies {
        originalEstablishment: EstablishmentAggregate;
        updatedEstablishment: EstablishmentAggregate;
        title: string;
      }[])("$title", async ({
        originalEstablishment,
        updatedEstablishment,
      }) => {
        // Prepare
        await pgEstablishmentAggregateRepository.insertEstablishmentAggregate(
          originalEstablishment,
        );

        expectToEqual(
          await pgEstablishmentAggregateRepository.getAllEstablishmentAggregatesForTest(),
          [originalEstablishment],
        );

        await pgEstablishmentAggregateRepository.updateEstablishmentAggregate(
          updatedEstablishment,
          updatedAt,
        );

        expectToEqual(
          await pgEstablishmentAggregateRepository.getAllEstablishmentAggregatesForTest(),
          [updatedEstablishment],
        );
      });
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
            new OfferEntityBuilder()
              .withAppellationCode("11987")
              .withRomeCode(matchingRomeCode)
              .build(),
          ])
          .withLocationId(uuid())
          .withUserRights([osefUserRight])
          .build();
      const establishmentWithoutCodeOfferMatching =
        new EstablishmentAggregateBuilder()
          .withEstablishmentSiret("22222222222222")
          .withOffers([new OfferEntityBuilder().withRomeCode("A1201").build()])
          .withLocationId(uuid())
          .withUserRights([osefUserRight])
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
        errors.establishment.notFound({ siret: siretNotInTable }),
      );
    });

    it("Delete aggregate including establishment, immersion offers, immersion contacts", async () => {
      const establishmentAggregate = new EstablishmentAggregateBuilder()
        .withSearchableBy({
          students: false,
          jobSeekers: false,
        })
        .withUserRights([osefUserRight])
        .build();

      await pgEstablishmentAggregateRepository.insertEstablishmentAggregate(
        establishmentAggregate,
      );

      expectToEqual(
        await pgEstablishmentAggregateRepository.getAllEstablishmentAggregatesForTest(),
        [establishmentAggregate],
      );

      await pgEstablishmentAggregateRepository.delete(
        establishmentAggregate.establishment.siret,
      );

      expectToEqual(
        await pgEstablishmentAggregateRepository.getAllEstablishmentAggregatesForTest(),
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
        .withUserRights([osefUserRight])
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
        .withUserRights([osefUserRight])
        .build();

      await pgEstablishmentAggregateRepository.insertEstablishmentAggregate(
        establishmentToRemove,
      );
      await pgEstablishmentAggregateRepository.insertEstablishmentAggregate(
        establishmentToKeep,
      );

      expectToEqual(
        await pgEstablishmentAggregateRepository.getAllEstablishmentAggregatesForTest(),
        [establishmentToRemove, establishmentToKeep],
      );

      // Act
      await pgEstablishmentAggregateRepository.delete(
        establishmentToRemove.establishment.siret,
      );

      expectToEqual(
        await pgEstablishmentAggregateRepository.getAllEstablishmentAggregatesForTest(),
        [establishmentToKeep],
      );
    });
  });

  describe("getEstablishmentAggregates", () => {
    const user1 = new UserBuilder()
      .withId(uuid())
      .withEmail("existing@email-in-repo.fr")
      .build();
    const user2 = new UserBuilder()
      .withId(uuid())
      .withEmail("another@email-in-repo.fr")
      .build();

    const establishmentWithoutEmail = new EstablishmentAggregateBuilder()
      .withEstablishmentSiret("00000000000001")
      .withEstablishmentCreatedAt(new Date())
      .withLocationId(uuid())
      .withUserRights([
        {
          role: "establishment-admin",
          job: "doing stuff",
          phone: "+336887875544",
          userId: user1.id,
          shouldReceiveDiscussionNotifications: true,
          isMainContactByPhone: false,
        },
      ])
      .build();

    const establishmentWithUserId1 = new EstablishmentAggregateBuilder()
      .withEstablishmentSiret("00000000000002")
      .withLocationId(uuid())
      .withUserRights([
        {
          role: "establishment-admin",
          job: "doing other stuff",
          phone: "+33688445577",
          userId: user2.id,
          shouldReceiveDiscussionNotifications: true,
          isMainContactByPhone: false,
        },
      ])
      .build();

    const establishmentWithUserId2 = new EstablishmentAggregateBuilder()
      .withEstablishmentSiret("00000000000003")
      .withLocationId(uuid())
      .withUserRights([
        {
          role: "establishment-admin",
          job: "doing other stuffffffffffffff",
          phone: "+33688445566",
          userId: user2.id,
          shouldReceiveDiscussionNotifications: true,
          isMainContactByPhone: false,
        },
      ])
      .build();

    beforeEach(async () => {
      await pgUserRepository.save(user1);
      await pgUserRepository.save(user2);
      await pgEstablishmentAggregateRepository.insertEstablishmentAggregate(
        establishmentWithoutEmail,
      );
      await pgEstablishmentAggregateRepository.insertEstablishmentAggregate(
        establishmentWithUserId1,
      );
      await pgEstablishmentAggregateRepository.insertEstablishmentAggregate(
        establishmentWithUserId2,
      );
    });

    it("return empty list if no establishment matched", async () => {
      expectToEqual(
        await pgEstablishmentAggregateRepository.getEstablishmentAggregatesByFilters(
          {
            userId: uuid(),
          },
        ),
        [],
      );
    });

    it("return an establishmentAggregate if matched email", async () => {
      expectToEqual(
        await pgEstablishmentAggregateRepository.getEstablishmentAggregatesByFilters(
          {
            userId: user2.id,
          },
        ),
        [establishmentWithUserId1, establishmentWithUserId2],
      );
    });
  });

  describe("markEstablishmentAsSearchableWhenRecentDiscussionAreUnderMaxContactPerMonth", () => {
    const now = new Date();
    const sinceOneWeekAgo = subDays(now, 7);
    const sinceOneMonthAgo = subDays(now, 30);

    const establishmentNotSearchable = new EstablishmentAggregateBuilder()
      .withUserRights([osefUserRight])
      .withIsMaxDiscussionsForPeriodReached(true)
      .build();

    const createEstablishmentAggregateWithMaxContactPerMonth = (
      maxContactsPerMonth: number,
    ) =>
      new EstablishmentAggregateBuilder(establishmentNotSearchable)
        .withMaxContactsPerMonth(maxContactsPerMonth)
        .withUserRights([osefUserRight])
        .build();

    const establishmentIsNotSearchableAndMaxContactPerMonth0 =
      createEstablishmentAggregateWithMaxContactPerMonth(0);
    const establishmentIsNotSearchableAndMaxContactPerMonth1 =
      createEstablishmentAggregateWithMaxContactPerMonth(1);
    const establishmentIsNotSearchableAndMaxContactPerMonth2 =
      createEstablishmentAggregateWithMaxContactPerMonth(2);
    const establishmentIsNotSearchableAndMaxContactPerMonth4 =
      createEstablishmentAggregateWithMaxContactPerMonth(4);
    const establishmentIsNotSearchableAndMaxContactPerMonth8 =
      createEstablishmentAggregateWithMaxContactPerMonth(8);

    const discussionAfterSinceOneMonthDate = new DiscussionBuilder()
      .withSiret(
        establishmentIsNotSearchableAndMaxContactPerMonth2.establishment.siret,
      )
      .withId(uuid())
      .withCreatedAt(addMilliseconds(sinceOneMonthAgo, 1))
      .build();
    const discussionAfterSinceAWeekDate = new DiscussionBuilder()
      .withSiret(
        establishmentIsNotSearchableAndMaxContactPerMonth2.establishment.siret,
      )
      .withId(uuid())
      .withCreatedAt(addMilliseconds(sinceOneWeekAgo, 1))
      .build();

    const discussionAtOneMonthSinceDate = new DiscussionBuilder()
      .withSiret(
        establishmentIsNotSearchableAndMaxContactPerMonth2.establishment.siret,
      )
      .withId(uuid())
      .withCreatedAt(sinceOneMonthAgo)
      .build();

    describe("update", () => {
      it(`update is searchable for establishments that: 
          - are not searchable
          - have maxContactsPerMonth at 8
          - have 1 discussion since date`, async () => {
        await pgEstablishmentAggregateRepository.insertEstablishmentAggregate(
          establishmentIsNotSearchableAndMaxContactPerMonth8,
        );

        // Create a discussion for the establishment with maxContactsPerMonth=8
        const discussionForEstablishment8 = new DiscussionBuilder()
          .withSiret(
            establishmentIsNotSearchableAndMaxContactPerMonth8.establishment
              .siret,
          )
          .withId(uuid())
          .withCreatedAt(addMilliseconds(sinceOneMonthAgo, 1))
          .build();

        await pgDiscussionRepository.insert(discussionForEstablishment8);

        await pgEstablishmentAggregateRepository.markEstablishmentAsSearchableWhenRecentDiscussionAreUnderMaxContactPerMonth(
          now,
        );

        // The establishment should be made searchable again because 1 < Math.ceil(8/4) = 2
        expectToEqual(
          await pgEstablishmentAggregateRepository.getAllEstablishmentAggregatesForTest(),
          [
            new EstablishmentAggregateBuilder(
              establishmentIsNotSearchableAndMaxContactPerMonth8,
            )
              .withIsMaxDiscussionsForPeriodReached(false)
              .withFitForDisabledWorkers("no")
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
          now,
        );

        expectToEqual(
          await pgEstablishmentAggregateRepository.getAllEstablishmentAggregatesForTest(),
          [
            new EstablishmentAggregateBuilder(
              establishmentIsNotSearchableAndMaxContactPerMonth2,
            )
              .withIsMaxDiscussionsForPeriodReached(false)
              .withFitForDisabledWorkers("no")
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

        await pgDiscussionRepository.insert(discussionAtOneMonthSinceDate);

        await pgEstablishmentAggregateRepository.markEstablishmentAsSearchableWhenRecentDiscussionAreUnderMaxContactPerMonth(
          now,
        );

        expectToEqual(
          await pgEstablishmentAggregateRepository.getAllEstablishmentAggregatesForTest(),
          [
            new EstablishmentAggregateBuilder(
              establishmentIsNotSearchableAndMaxContactPerMonth1,
            )
              .withIsMaxDiscussionsForPeriodReached(false)
              .withFitForDisabledWorkers("no")
              .build(),
          ],
        );
      });
      it(`update is searchable for establishments that: 
        - are not searchable
        - have maxContactsPerMonth at 8
        - have 4 discussion since date (2 first week, 2 second week)`, async () => {
        await pgEstablishmentAggregateRepository.insertEstablishmentAggregate(
          establishmentIsNotSearchableAndMaxContactPerMonth8,
        );

        const sinceFourWeeksAgo = subDays(new Date(), 28);
        const sinceThreeWeeksAgo = subDays(new Date(), 21);
        // Create a discussion for the establishment with maxContactsPerMonth=8
        const discussion1ForEstablishment8 = new DiscussionBuilder()
          .withSiret(
            establishmentIsNotSearchableAndMaxContactPerMonth8.establishment
              .siret,
          )
          .withId(uuid())
          .withCreatedAt(addMilliseconds(sinceFourWeeksAgo, 1))
          .build();

        const discussion2ForEstablishment8 = new DiscussionBuilder()
          .withSiret(
            establishmentIsNotSearchableAndMaxContactPerMonth8.establishment
              .siret,
          )
          .withId(uuid())
          .withCreatedAt(addMilliseconds(sinceFourWeeksAgo, 10))
          .build();

        const discussion3ForEstablishment8 = new DiscussionBuilder()
          .withSiret(
            establishmentIsNotSearchableAndMaxContactPerMonth8.establishment
              .siret,
          )
          .withId(uuid())
          .withCreatedAt(addMilliseconds(sinceThreeWeeksAgo, 1))
          .build();

        const discussion4ForEstablishment8 = new DiscussionBuilder()
          .withSiret(
            establishmentIsNotSearchableAndMaxContactPerMonth8.establishment
              .siret,
          )
          .withId(uuid())
          .withCreatedAt(addMilliseconds(sinceThreeWeeksAgo, 10))
          .build();

        await pgDiscussionRepository.insert(discussion1ForEstablishment8);
        await pgDiscussionRepository.insert(discussion2ForEstablishment8);
        await pgDiscussionRepository.insert(discussion3ForEstablishment8);
        await pgDiscussionRepository.insert(discussion4ForEstablishment8);

        await pgEstablishmentAggregateRepository.markEstablishmentAsSearchableWhenRecentDiscussionAreUnderMaxContactPerMonth(
          now,
        );

        // The establishment should be made searchable again because 1 < Math.ceil(8/4) = 2
        expectToEqual(
          await pgEstablishmentAggregateRepository.getAllEstablishmentAggregatesForTest(),
          [
            new EstablishmentAggregateBuilder(
              establishmentIsNotSearchableAndMaxContactPerMonth8,
            )
              .withIsMaxDiscussionsForPeriodReached(false)
              .withFitForDisabledWorkers("no")
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
          now,
        );

        expectToEqual(
          await pgEstablishmentAggregateRepository.getAllEstablishmentAggregatesForTest(),
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
        await pgDiscussionRepository.insert(discussionAfterSinceOneMonthDate);

        await pgEstablishmentAggregateRepository.markEstablishmentAsSearchableWhenRecentDiscussionAreUnderMaxContactPerMonth(
          now,
        );

        expectToEqual(
          await pgEstablishmentAggregateRepository.getAllEstablishmentAggregatesForTest(),
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
        await pgDiscussionRepository.insert(discussionAfterSinceAWeekDate);

        await pgEstablishmentAggregateRepository.markEstablishmentAsSearchableWhenRecentDiscussionAreUnderMaxContactPerMonth(
          now,
        );

        expectToEqual(
          await pgEstablishmentAggregateRepository.getAllEstablishmentAggregatesForTest(),
          [establishmentIsNotSearchableAndMaxContactPerMonth1],
        );
      });

      it(`do not update is searchable for establishments that: 
          - are not searchable
          - have maxContactsPerMonth at 4
          - have 1 discussion since a week (which is under monthly max but at weekly max)`, async () => {
        await pgEstablishmentAggregateRepository.insertEstablishmentAggregate(
          establishmentIsNotSearchableAndMaxContactPerMonth4,
        );

        const discussionForEstablishment4 = new DiscussionBuilder()
          .withSiret(
            establishmentIsNotSearchableAndMaxContactPerMonth4.establishment
              .siret,
          )
          .withId(uuid())
          .withCreatedAt(addMilliseconds(sinceOneWeekAgo, 1))
          .build();

        await pgDiscussionRepository.insert(discussionForEstablishment4);
        await pgEstablishmentAggregateRepository.markEstablishmentAsSearchableWhenRecentDiscussionAreUnderMaxContactPerMonth(
          now,
        );

        expectToEqual(
          await pgEstablishmentAggregateRepository.getAllEstablishmentAggregatesForTest(),
          [establishmentIsNotSearchableAndMaxContactPerMonth4],
        );
      });
    });
  });
  describe("getSiretsInRepoFromSiretList", () => {
    const existingSirets = [
      "00000000000001",
      "00000000000002",
      "00000000000003",
    ];
    const notExistingSirets = [
      "00000000000004",
      "00000000000005",
      "00000000000006",
    ];

    beforeEach(async () => {
      await Promise.all(
        existingSirets.map((siret) =>
          pgEstablishmentAggregateRepository.insertEstablishmentAggregate(
            new EstablishmentAggregateBuilder()
              .withEstablishmentSiret(siret)
              .withUserRights([osefUserRight])
              .withLocations([
                {
                  ...locationOfSearchPosition,
                  id: uuid(),
                },
              ])
              .build(),
          ),
        ),
      );
    });
    it("returns the sirets in the repo", async () => {
      expectArraysToEqualIgnoringOrder(
        await pgEstablishmentAggregateRepository.getSiretsInRepoFromSiretList([
          existingSirets[0],
          ...notExistingSirets,
          existingSirets[1],
          existingSirets[2],
        ]),
        existingSirets,
      );
    });
    it("returns an empty array if the sirets are not in the repo", async () => {
      expectToEqual(
        await pgEstablishmentAggregateRepository.getSiretsInRepoFromSiretList(
          notExistingSirets,
        ),
        [],
      );
    });
    it("returns an empty array if an empty array is provided", async () => {
      expectToEqual(
        await pgEstablishmentAggregateRepository.getSiretsInRepoFromSiretList(
          [],
        ),
        [],
      );
    });
  });
});

const toReadableSearchResult = ({
  address,
  rome,
  distance_m,
}: InternalOfferDto) => ({
  address: `${address?.streetNumberAndAddress} ${address?.postcode} ${address?.city}`,
  rome,
  distance_m,
});
