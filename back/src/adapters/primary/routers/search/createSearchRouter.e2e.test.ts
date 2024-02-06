import {
  AppellationCode,
  Group,
  SearchResultDto,
  SearchRoutes,
  SiretDto,
  expectHttpResponseToEqual,
  expectToEqual,
  immersionOffersRoute,
  searchImmersionRoutes,
} from "shared";
import { HttpClient } from "shared-routes";
import { createSupertestSharedClient } from "shared-routes/supertest";
import { type SuperTest, type Test } from "supertest";
import { GroupEntity } from "../../../../domain/offer/entities/GroupEntity";
import { OfferEntity } from "../../../../domain/offer/entities/OfferEntity";
import { buildTestApp } from "../../../../utils/buildTestApp";
import { avenueChampsElyseesDto } from "../../../secondary/addressGateway/InMemoryAddressGateway";
import {
  ContactEntityBuilder,
  EstablishmentAggregateBuilder,
  EstablishmentEntityBuilder,
  OfferEntityBuilder,
  defaultNafCode,
  establishmentAggregateToSearchResultByRomeForFirstLocation,
} from "../../../secondary/offer/InMemoryEstablishmentAggregateRepository";
import { stubSearchResult } from "../../../secondary/offer/InMemoryGroupRepository";
import { InMemoryUnitOfWork } from "../../config/uowConfig";

const makeImmersionOfferUrl = (
  siret: SiretDto | undefined,
  appellationCode: AppellationCode | undefined,
): string =>
  `${searchImmersionRoutes.getSearchResult.url}?siret=${siret}&appellationCode=${appellationCode}`;

const immersionOffer = new OfferEntityBuilder().build();
const establishmentAggregate = new EstablishmentAggregateBuilder()
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

describe("search-immersion route", () => {
  let inMemoryUow: InMemoryUnitOfWork;
  let sharedRequest: HttpClient<SearchRoutes>;

  beforeEach(async () => {
    const testAppAndDeps = await buildTestApp();
    inMemoryUow = testAppAndDeps.inMemoryUow;
    sharedRequest = createSupertestSharedClient(
      searchImmersionRoutes,
      testAppAndDeps.request,
    );
  });

  describe(`from front - /${immersionOffersRoute}`, () => {
    describe("accepts valid requests", () => {
      it("with given appellationCode and position", async () => {
        const immersionOffer = new OfferEntityBuilder()
          .withRomeCode("D1202")
          .withAppellationCode("12694")
          .withAppellationLabel("Coiffeur / Coiffeuse mixte")
          .build();
        const establishmentAgg = new EstablishmentAggregateBuilder()
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

        // Prepare
        await inMemoryUow.establishmentAggregateRepository.insertEstablishmentAggregates(
          [establishmentAgg],
        );

        // Act and assert
        const result = await sharedRequest.search({
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
              establishmentAgg,
              immersionOffer.romeCode,
              0,
            ),
          ],
        });
      });

      it("with no specified appellationCode", async () => {
        const result = await sharedRequest.search({
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
        const result = await sharedRequest.search({
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
    });

    describe("with filter establishmentSearchableBy", () => {
      const siret1 = "12345678901234";
      const siret2 = "11111111111111";
      const siret3 = "12341234123455";

      const toSearchImmersionResults = (
        params: { siret: SiretDto; offer: OfferEntity }[],
      ): SearchResultDto[] =>
        params.map(({ siret, offer }, index) => ({
          address: avenueChampsElyseesDto,
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
            },
          ],
          siret,
          voluntaryToImmersion: true,
          contactMode: "EMAIL",
          numberOfEmployeeRange: "10-19",
          distance_m: 0,
          position: { lat: 48.8531, lon: 2.34999 },
          locationId: `${index}`,
        }));

      const offer1 = new OfferEntityBuilder()
        .withRomeCode("A1409")
        .withAppellationCode("14704")
        .build();

      const offer2 = new OfferEntityBuilder()
        .withRomeCode("A1203")
        .withAppellationCode("16067")
        .build();

      beforeEach(async () => {
        await inMemoryUow.establishmentAggregateRepository.insertEstablishmentAggregates(
          [
            new EstablishmentAggregateBuilder()
              .withEstablishmentSiret(siret1)
              .withOffers([offer1])
              .withEstablishment(
                new EstablishmentEntityBuilder()
                  .withSiret(siret1)
                  .withLocations([
                    {
                      position: {
                        lat: 48.8531,
                        lon: 2.34999,
                      },
                      address: {
                        streetNumberAndAddress: "24 rue des bouchers",
                        city: "Strasbourg",
                        postcode: "67000",
                        departmentCode: "67",
                      },
                      id: "1",
                    },
                  ])
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
                  .withLocations([
                    {
                      position: {
                        lat: 48.8531,
                        lon: 2.34999,
                      },
                      address: {
                        streetNumberAndAddress: "24 rue des bouchers",
                        city: "Strasbourg",
                        postcode: "67000",
                        departmentCode: "67",
                      },
                      id: "1",
                    },
                  ])
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
                  .withLocations([
                    {
                      position: {
                        lat: 48.8531,
                        lon: 2.34999,
                      },
                      address: {
                        streetNumberAndAddress: "24 rue des bouchers",
                        city: "Strasbourg",
                        postcode: "67000",
                        departmentCode: "67",
                      },
                      id: "1",
                    },
                  ])
                  .withWebsite("www.jobs.fr")
                  .withSearchableBy({ students: false, jobSeekers: true })
                  .build(),
              )
              .build(),
          ],
        );
      });

      it("with filter establishmentSearchableBy defined to students", async () => {
        const result = await sharedRequest.search({
          queryParams: {
            appellationCodes: [offer1.appellationCode, offer2.appellationCode],
            distanceKm: 30,
            longitude: 2.34999,
            latitude: 48.8531,
            sortedBy: "distance",
            establishmentSearchableBy: "students",
          },
        });
        expectHttpResponseToEqual(result, {
          status: 200,
          body: toSearchImmersionResults([
            { siret: siret1, offer: offer1 },
            { siret: siret2, offer: offer2 },
          ]),
        });
      });

      it("with filter establishmentSearchableBy defined to jobSeekers", async () => {
        const result = await sharedRequest.search({
          queryParams: {
            appellationCodes: [offer1.appellationCode, offer2.appellationCode],
            distanceKm: 30,
            longitude: 2.34999,
            latitude: 48.8531,
            sortedBy: "distance",
            establishmentSearchableBy: "jobSeekers",
          },
        });

        expectHttpResponseToEqual(result, {
          status: 200,
          body: toSearchImmersionResults([
            { siret: siret1, offer: offer1 },
            { siret: siret3, offer: offer1 },
          ]),
        });
      });

      it("with filter establishmentSearchableBy not defined", async () => {
        const result = await sharedRequest.search({
          queryParams: {
            appellationCodes: [offer1.appellationCode, offer2.appellationCode],
            distanceKm: 30,
            longitude: 2.34999,
            latitude: 48.8531,
            sortedBy: "distance",
          },
        });

        expectHttpResponseToEqual(result, {
          status: 200,
          body: toSearchImmersionResults([
            { siret: siret1, offer: offer1 },
            { siret: siret2, offer: offer2 },
            { siret: siret3, offer: offer1 },
          ]),
        });
      });
    });

    it("rejects invalid requests with error code 400", async () => {
      const result = await sharedRequest.search({
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
      const result = await sharedRequest.getGroupBySlug({
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
    let request: SuperTest<Test>;
    let inMemoryUow: InMemoryUnitOfWork;

    beforeEach(async () => {
      const testAppAndDeps = await buildTestApp();
      request = testAppAndDeps.request;
      inMemoryUow = testAppAndDeps.inMemoryUow;
    });

    it("200 - route with mandatory params", async () => {
      await inMemoryUow.establishmentAggregateRepository.insertEstablishmentAggregates(
        [establishmentAggregate],
      );
      const response = await request.get(
        makeImmersionOfferUrl(
          establishmentAggregate.establishment.siret,
          establishmentAggregate.offers[0].appellationCode,
        ),
      );

      expect(response.status).toBe(200);
      expectToEqual(response.body, {
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
        website: "www.jobs.fr",
      });
    });

    it("400 - route without mandatory fields or invalid fields", async () => {
      const response = await request.get(
        makeImmersionOfferUrl("my-fake-siret", undefined),
      );

      expect(response.status).toBe(400);
      expectToEqual(response.body, {
        issues: [
          "appellationCode : Code appellation incorrect",
          "siret : SIRET doit être composé de 14 chiffres",
        ],
        message: `Shared-route schema 'queryParamsSchema' was not respected in adapter 'express'.
Route: GET /search-result`,
        status: 400,
      });
    });

    it("404 - route with valid mandatory fields but offer not in repo", async () => {
      const requestedOffer = {
        siret: establishmentAggregate.establishment.siret,
        appellationCode: establishmentAggregate.offers[0].appellationCode,
      };
      const response = await request.get(
        makeImmersionOfferUrl(
          requestedOffer.siret,
          requestedOffer.appellationCode,
        ),
      );

      expect(response.status).toBe(404);
      expectToEqual(response.body, {
        errors: `No offer found for siret ${requestedOffer.siret} and appellation code ${requestedOffer.appellationCode}`,
      });
    });

    it("404 - route with valid mandatory fields and siret in repo but appellation is not found for establishment", async () => {
      await inMemoryUow.establishmentAggregateRepository.insertEstablishmentAggregates(
        [establishmentAggregate],
      );
      const appellationCodeNotFoundForEstablishment = "54321";
      const requestedOffer = {
        siret: establishmentAggregate.establishment.siret,
        appellationCode: appellationCodeNotFoundForEstablishment,
      };

      const response = await request.get(
        makeImmersionOfferUrl(
          requestedOffer.siret,
          requestedOffer.appellationCode,
        ),
      );

      expect(response.status).toBe(404);
      expectToEqual(response.body, {
        errors: `No offer found for siret ${requestedOffer.siret} and appellation code ${requestedOffer.appellationCode}`,
      });
    });
  });
});
