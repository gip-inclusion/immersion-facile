import {
  Group,
  SearchQueryParamsWithGeoParams,
  SearchResultDto,
  SearchRoutes,
  SiretDto,
  errors,
  expectHttpResponseToEqual,
  searchImmersionRoutes,
} from "shared";
import { HttpClient } from "shared-routes";
import { createSupertestSharedClient } from "shared-routes/supertest";
import { InMemoryUnitOfWork } from "../../../../domains/core/unit-of-work/adapters/createInMemoryUow";
import { establishmentAggregateToSearchResultByRomeForFirstLocation } from "../../../../domains/establishment/adapters/InMemoryEstablishmentAggregateRepository";
import { stubSearchResult } from "../../../../domains/establishment/adapters/InMemoryGroupRepository";
import { EstablishmentEntity } from "../../../../domains/establishment/entities/EstablishmentEntity";
import { GroupEntity } from "../../../../domains/establishment/entities/GroupEntity";
import { OfferEntity } from "../../../../domains/establishment/entities/OfferEntity";
import {
  ContactEntityBuilder,
  EstablishmentAggregateBuilder,
  EstablishmentEntityBuilder,
  OfferEntityBuilder,
  defaultLocation,
  defaultNafCode,
} from "../../../../domains/establishment/helpers/EstablishmentBuilders";
import { buildTestApp } from "../../../../utils/buildTestApp";

const siret1 = "12345678901234";
const siret2 = "11111111111111";
const siret3 = "12341234123455";

const defaultUpdatedAt = new Date("2024-08-10");

const toSearchImmersionResults = (
  params: {
    siret: SiretDto;
    offer: OfferEntity;
    establishment: EstablishmentEntity;
  }[],
  withDistance: number | false,
): SearchResultDto[] =>
  params.map(({ siret, offer, establishment }) => ({
    naf: defaultNafCode,
    nafLabel: "NAFRev2",
    name: "Company inside repository",
    website: "www.jobs.fr",
    additionalInformation: "",
    rome: offer.romeCode,
    romeLabel: "test_rome_label",
    appellations: [
      {
        appellationLabel: offer.appellationLabel,
        appellationCode: offer.appellationCode,
        score: 4.5,
      },
    ],
    siret,
    voluntaryToImmersion: true,
    contactMode: "EMAIL",
    numberOfEmployeeRange: "10-19",
    address: defaultLocation.address,
    position: defaultLocation.position,
    locationId: defaultLocation.id,
    ...(withDistance !== false ? { distance_m: withDistance } : {}),
    updatedAt: defaultUpdatedAt.toISOString(),
    createdAt: establishment.createdAt.toISOString(),
  }));

const offer1 = new OfferEntityBuilder()
  .withRomeCode("A1409")
  .withAppellationCode("14704")
  .build();

const offer2 = new OfferEntityBuilder()
  .withRomeCode("A1203")
  .withAppellationCode("16067")
  .build();

const establishment = new EstablishmentEntityBuilder().build();

const immersionOffer = new OfferEntityBuilder().build();
const establishmentAggregate1 = new EstablishmentAggregateBuilder()
  .withEstablishment(
    new EstablishmentEntityBuilder().withSiret("11112222333344").build(),
  )
  .withContact(
    new ContactEntityBuilder()
      .withId("theContactId")
      .withContactMethod("EMAIL")
      .build(),
  )
  .withOffers([immersionOffer])
  .build();

const establishmentAggregate2 = new EstablishmentAggregateBuilder()
  .withOffers([immersionOffer])
  .withEstablishment(
    new EstablishmentEntityBuilder()
      .withLocations([
        {
          position: {
            lat: 48.8531,
            lon: 2.34999,
          },
          address: {
            streetNumberAndAddress: "30 avenue des champs Elysées",
            city: "Paris",
            postcode: "75017",
            departmentCode: "75",
          },
          id: "1",
        },
      ])
      .withWebsite("www.jobs.fr")
      .build(),
  )
  .build();

describe("search-immersion route", () => {
  let inMemoryUow: InMemoryUnitOfWork;
  let httpClient: HttpClient<SearchRoutes>;

  beforeEach(async () => {
    const testAppAndDeps = await buildTestApp();
    inMemoryUow = testAppAndDeps.inMemoryUow;
    httpClient = createSupertestSharedClient(
      searchImmersionRoutes,
      testAppAndDeps.request,
    );
  });

  describe("from front - /immersion-offers", () => {
    describe("accepts valid requests", () => {
      it("with given appellationCode and position", async () => {
        const immersionOffer = new OfferEntityBuilder()
          .withRomeCode(establishmentAggregate2.offers[0].romeCode)
          .withAppellationCode(
            establishmentAggregate2.offers[0].appellationCode,
          )
          .withAppellationLabel("Coiffeur / Coiffeuse mixte")
          .build();

        // Prepare
        await inMemoryUow.establishmentAggregateRepository.insertEstablishmentAggregate(
          establishmentAggregate2,
        );

        // Act and assert
        const result = await httpClient.search({
          queryParams: {
            appellationCodes: [immersionOffer.appellationCode],
            distanceKm: 30,
            longitude: 2.34999,
            latitude: 48.8531,
            sortedBy: "distance",
          },
        });

        expectHttpResponseToEqual(result, {
          status: 200,
          body: [
            establishmentAggregateToSearchResultByRomeForFirstLocation(
              establishmentAggregate2,
              immersionOffer.romeCode,
              0,
            ),
          ],
        });
      });

      it("with no specified appellationCode", async () => {
        const result = await httpClient.search({
          queryParams: {
            distanceKm: 30,
            longitude: 2.34999,
            latitude: 48.8531,
            sortedBy: "distance",
          },
        });
        expectHttpResponseToEqual(result, {
          status: 200,
          body: [],
        });
      });

      it("with filter voluntaryToImmersion", async () => {
        const result = await httpClient.search({
          queryParams: {
            distanceKm: 30,
            longitude: 2.34999,
            latitude: 48.8531,
            voluntaryToImmersion: true,
            sortedBy: "distance",
          },
        });

        expectHttpResponseToEqual(result, {
          status: 200,
          body: [],
        });
      });

      it("sortedBy score supported", async () => {
        const immersionOffer = new OfferEntityBuilder()
          .withRomeCode(establishmentAggregate2.offers[0].romeCode)
          .withAppellationCode(
            establishmentAggregate2.offers[0].appellationCode,
          )
          .withAppellationLabel("Coiffeur / Coiffeuse mixte")
          .build();

        await inMemoryUow.establishmentAggregateRepository.insertEstablishmentAggregate(
          establishmentAggregate2,
        );

        const result = await httpClient.search({
          queryParams: {
            appellationCodes: [immersionOffer.appellationCode],
            distanceKm: 30,
            longitude: 2.34999,
            latitude: 48.8531,
            voluntaryToImmersion: true,
            sortedBy: "score",
          },
        });

        expectHttpResponseToEqual(result, {
          status: 200,
          body: [
            establishmentAggregateToSearchResultByRomeForFirstLocation(
              establishmentAggregate2,
              immersionOffer.romeCode,
              0,
            ),
          ],
        });
      });
    });

    describe("with filter establishmentSearchableBy", () => {
      beforeEach(async () => {
        inMemoryUow.establishmentAggregateRepository.establishmentAggregates = [
          new EstablishmentAggregateBuilder()
            .withEstablishmentSiret(siret1)
            .withOffers([offer1])
            .withEstablishment(
              new EstablishmentEntityBuilder()
                .withSiret(siret1)
                .withWebsite("www.jobs.fr")
                .build(),
            )
            .build(),
          new EstablishmentAggregateBuilder()
            .withEstablishmentSiret(siret2)
            .withOffers([offer2])
            .withEstablishment(
              new EstablishmentEntityBuilder()
                .withSiret(siret2)
                .withWebsite("www.jobs.fr")
                .withSearchableBy({ students: true, jobSeekers: false })
                .build(),
            )
            .build(),
          new EstablishmentAggregateBuilder()
            .withEstablishmentSiret(siret3)
            .withOffers([offer1])
            .withEstablishment(
              new EstablishmentEntityBuilder()
                .withSiret(siret3)
                .withWebsite("www.jobs.fr")
                .withSearchableBy({ students: false, jobSeekers: true })
                .build(),
            )
            .build(),
        ];
      });

      it("with filter establishmentSearchableBy defined to students", async () => {
        const result = await httpClient.search({
          queryParams: {
            appellationCodes: [offer1.appellationCode, offer2.appellationCode],
            distanceKm: 30,
            longitude: defaultLocation.position.lon,
            latitude: defaultLocation.position.lat,
            sortedBy: "distance",
            establishmentSearchableBy: "students",
          },
        });

        expectHttpResponseToEqual(result, {
          status: 200,
          body: toSearchImmersionResults(
            [
              { siret: siret1, offer: offer1, establishment },
              { siret: siret2, offer: offer2, establishment },
            ],
            0,
          ),
        });
      });

      it("with filter establishmentSearchableBy defined to jobSeekers", async () => {
        const result = await httpClient.search({
          queryParams: {
            appellationCodes: [offer1.appellationCode, offer2.appellationCode],
            distanceKm: 30,
            longitude: defaultLocation.position.lon,
            latitude: defaultLocation.position.lat,
            sortedBy: "distance",
            establishmentSearchableBy: "jobSeekers",
          },
        });

        expectHttpResponseToEqual(result, {
          status: 200,
          body: toSearchImmersionResults(
            [
              { siret: siret1, offer: offer1, establishment },
              { siret: siret3, offer: offer1, establishment },
            ],
            0,
          ),
        });
      });

      it("with filter establishmentSearchableBy not defined", async () => {
        const result = await httpClient.search({
          queryParams: {
            appellationCodes: [offer1.appellationCode, offer2.appellationCode],
            distanceKm: 30,
            longitude: defaultLocation.position.lon,
            latitude: defaultLocation.position.lat,
            sortedBy: "distance",
          },
        });

        expectHttpResponseToEqual(result, {
          status: 200,
          body: toSearchImmersionResults(
            [
              { siret: siret1, offer: offer1, establishment },
              { siret: siret2, offer: offer2, establishment },
              { siret: siret3, offer: offer1, establishment },
            ],
            0,
          ),
        });
      });
    });

    it("rejects invalid requests with error code 400", async () => {
      const result = await httpClient.search({
        queryParams: {
          distanceKm: 30,
          longitude: 2.34999,
          latitude: 48.8531,
          sortedBy: "distance",
          appellationCodes: ["XXX"],
        },
      });
      expectHttpResponseToEqual(result, {
        status: 400,
        body: {
          status: 400,
          issues: ["appellationCodes.0 : Code appellation incorrect"],
          message:
            "Shared-route schema 'queryParamsSchema' was not respected in adapter 'express'.\nRoute: GET /immersion-offers",
        },
      });
    });
    describe("without geo params", () => {
      beforeEach(async () => {
        inMemoryUow.establishmentAggregateRepository.establishmentAggregates = [
          new EstablishmentAggregateBuilder()
            .withEstablishmentSiret(siret1)
            .withOffers([offer1])
            .withEstablishment(
              new EstablishmentEntityBuilder()
                .withSiret(siret1)
                .withWebsite("www.jobs.fr")
                .build(),
            )
            .build(),
          new EstablishmentAggregateBuilder()
            .withEstablishmentSiret(siret2)
            .withOffers([offer2])
            .withEstablishment(
              new EstablishmentEntityBuilder()
                .withSiret(siret2)
                .withWebsite("www.jobs.fr")
                .withSearchableBy({ students: true, jobSeekers: false })
                .build(),
            )
            .build(),
          new EstablishmentAggregateBuilder()
            .withEstablishmentSiret(siret3)
            .withOffers([offer1])
            .withEstablishment(
              new EstablishmentEntityBuilder()
                .withSiret(siret3)
                .withWebsite("www.jobs.fr")
                .withSearchableBy({ students: false, jobSeekers: true })
                .build(),
            )
            .build(),
        ];
      });
      it("should return 400 if distance is supplied but no lat/lon/distanceKm", async () => {
        const result = await httpClient.search({
          queryParams: {
            appellationCodes: ["14704"],
            sortedBy: "distance",
          } as unknown as SearchQueryParamsWithGeoParams, // forcing the type to check the error
        });
        expectHttpResponseToEqual(result, {
          status: 400,
          body: {
            status: 400,
            issues: [
              "latitude : Expected number, received nan",
              "longitude : Expected number, received nan",
              "distanceKm : Expected number, received nan",
            ],
            message:
              "Shared-route schema 'queryParamsSchema' was not respected in adapter 'express'.\nRoute: GET /immersion-offers",
          },
        });
      });
      it("should return 400 if distance is supplied but only lat", async () => {
        const result = await httpClient.search({
          queryParams: {
            appellationCodes: ["14704"],
            sortedBy: "distance",
            latitude: 48.8531,
          } as unknown as SearchQueryParamsWithGeoParams, // forcing the type to check the error
        });
        expectHttpResponseToEqual(result, {
          status: 400,
          body: {
            status: 400,
            issues: [
              "longitude : Expected number, received nan",
              "distanceKm : Expected number, received nan",
            ],
            message:
              "Shared-route schema 'queryParamsSchema' was not respected in adapter 'express'.\nRoute: GET /immersion-offers",
          },
        });
      });
      it("should return results if no geo params are set and no appellations", async () => {
        const results = await httpClient.search({
          queryParams: {
            sortedBy: "score",
          },
        });

        expectHttpResponseToEqual(results, {
          status: 200,
          body: toSearchImmersionResults(
            [
              { siret: siret1, offer: offer1, establishment },
              { siret: siret2, offer: offer2, establishment },
              { siret: siret3, offer: offer1, establishment },
            ],
            false,
          ),
        });
      });
      it("should return results if no geo params are set but appellations are supplied", async () => {
        const results = await httpClient.search({
          queryParams: {
            sortedBy: "date",
            appellationCodes: [offer1.appellationCode],
          },
        });

        expectHttpResponseToEqual(results, {
          status: 200,
          body: toSearchImmersionResults(
            [
              { siret: siret1, offer: offer1, establishment },
              { siret: siret3, offer: offer1, establishment },
            ],
            false,
          ),
        });
      });
    });
  });

  describe("GET getGroupBySlug", () => {
    it("should get the stubbed data", async () => {
      const group: Group = {
        name: "Décathlon",
        slug: "decathlon",
        options: {
          heroHeader: {
            title: "Décathlon de ouf",
            description: "À fond la forme",
            logoUrl: "https://logo-decathlon.com",
          },
          tintColor: "red",
        },
      };
      const groupEntity: GroupEntity = {
        ...group,
        sirets: [stubSearchResult.siret],
      };

      inMemoryUow.groupRepository.groupEntities = [groupEntity];
      const result = await httpClient.getGroupBySlug({
        urlParams: {
          groupSlug: groupEntity.slug,
        },
      });
      expectHttpResponseToEqual(result, {
        status: 200,
        body: {
          group,
          results: [stubSearchResult],
        },
      });
    });
  });

  describe(`${searchImmersionRoutes.getSearchResult.method} ${searchImmersionRoutes.getSearchResult.url}`, () => {
    let inMemoryUow: InMemoryUnitOfWork;

    beforeEach(async () => {
      const testAppAndDeps = await buildTestApp();
      const request = testAppAndDeps.request;
      httpClient = createSupertestSharedClient(searchImmersionRoutes, request);
      inMemoryUow = testAppAndDeps.inMemoryUow;
    });

    it("200 - route with mandatory params", async () => {
      inMemoryUow.establishmentAggregateRepository.establishmentAggregates = [
        establishmentAggregate2,
        establishmentAggregate1,
      ];

      const response = await httpClient.getSearchResult({
        queryParams: {
          siret: establishmentAggregate1.establishment.siret,
          appellationCode: establishmentAggregate1.offers[0].appellationCode,
          locationId: defaultLocation.id,
        },
      });

      expectHttpResponseToEqual(response, {
        status: 200,
        body: {
          additionalInformation: "",
          address: {
            city: "Paris",
            departmentCode: "75",
            postcode: "75017",
            streetNumberAndAddress: "30 avenue des champs Elysées",
          },
          appellations: [
            {
              appellationCode: "19540",
              appellationLabel: "Styliste",
              score: 4.5,
            },
          ],
          contactMode: "EMAIL",
          naf: "7820Z",
          nafLabel: "NAFRev2",
          name: "Company inside repository",
          numberOfEmployeeRange: "10-19",
          position: {
            lat: 48.866667,
            lon: 2.333333,
          },
          rome: "B1805",
          romeLabel: "test_rome_label",
          siret: "11112222333344",
          voluntaryToImmersion: true,
          website: "",
          locationId: defaultLocation.id,
          updatedAt: defaultUpdatedAt.toISOString(),
          createdAt: new Date("2024-08-08").toISOString(),
        },
      });
    });

    it("400 - route without mandatory fields or invalid fields", async () => {
      const response = await httpClient.getSearchResult({
        queryParams: {
          siret: "my-fake-siret",
          appellationCode: "",
          locationId: defaultLocation.id,
        },
      });

      expectHttpResponseToEqual(response, {
        status: 400,
        body: {
          issues: [
            "appellationCode : Code appellation incorrect",
            "siret : SIRET doit être composé de 14 chiffres",
          ],
          message: `Shared-route schema 'queryParamsSchema' was not respected in adapter 'express'.\nRoute: GET /search-result`,
          status: 400,
        },
      });
    });

    it("404 - route with valid mandatory fields but offer not in repo", async () => {
      const requestedOffer = {
        siret: establishmentAggregate1.establishment.siret,
        appellationCode: establishmentAggregate1.offers[0].appellationCode,
      };

      const response = await httpClient.getSearchResult({
        queryParams: {
          siret: requestedOffer.siret,
          appellationCode: requestedOffer.appellationCode,
          locationId: defaultLocation.id,
        },
      });

      expectHttpResponseToEqual(response, {
        status: 404,
        body: {
          status: 404,
          message: errors.establishment.offerMissing({
            siret: requestedOffer.siret,
            appellationCode: requestedOffer.appellationCode,
            mode: "not found",
          }).message,
        },
      });
    });

    it("404 - route with valid mandatory fields and siret in repo but appellation is not found for establishment", async () => {
      inMemoryUow.establishmentAggregateRepository.establishmentAggregates = [
        establishmentAggregate2,
        establishmentAggregate1,
      ];
      const appellationCodeNotFoundForEstablishment = "54321";
      const requestedOffer = {
        siret: establishmentAggregate1.establishment.siret,
        appellationCode: appellationCodeNotFoundForEstablishment,
      };

      const response = await httpClient.getSearchResult({
        queryParams: {
          siret: requestedOffer.siret,
          appellationCode: requestedOffer.appellationCode,
          locationId: defaultLocation.id,
        },
      });

      expectHttpResponseToEqual(response, {
        status: 404,
        body: {
          status: 404,
          message: errors.establishment.offerMissing({
            siret: requestedOffer.siret,
            appellationCode: requestedOffer.appellationCode,
            mode: "not found",
          }).message,
        },
      });
    });
  });
});
