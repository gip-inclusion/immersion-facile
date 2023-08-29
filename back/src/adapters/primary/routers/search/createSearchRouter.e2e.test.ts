import { type SuperTest, type Test } from "supertest";
import {
  AppellationCode,
  expectToEqual,
  immersionOffersRoute,
  searchImmersionRoutes,
  SearchRoutes,
  SiretDto,
} from "shared";
import { HttpClient } from "shared-routes";
import { createSupertestSharedClient } from "shared-routes/supertest";
import { buildTestApp } from "../../../../_testBuilders/buildTestApp";
import { ContactEntityBuilder } from "../../../../_testBuilders/ContactEntityBuilder";
import {
  EstablishmentAggregateBuilder,
  establishmentAggregateToSearchResultByRome,
} from "../../../../_testBuilders/establishmentAggregate.test.helpers";
import { EstablishmentEntityBuilder } from "../../../../_testBuilders/EstablishmentEntityBuilder";
import { ImmersionOfferEntityV2Builder } from "../../../../_testBuilders/ImmersionOfferEntityV2Builder";
import { stubSearchResult } from "../../../secondary/immersionOffer/InMemoryEstablishmentGroupRepository";
import { InMemoryUnitOfWork } from "../../config/uowConfig";

const makeImmersionOfferUrl = (
  siret: SiretDto | undefined,
  appellationCode: AppellationCode | undefined,
): string =>
  `${searchImmersionRoutes.getSearchResult.url}?siret=${siret}&appellationCode=${appellationCode}`;

const immersionOffer = new ImmersionOfferEntityV2Builder().build();
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
  .withImmersionOffers([immersionOffer])
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
        const immersionOffer = new ImmersionOfferEntityV2Builder()
          .withRomeCode("D1202")
          .withAppellationCode("12694")
          .withAppellationLabel("Coiffeur / Coiffeuse mixte")
          .build();
        const establishmentAgg = new EstablishmentAggregateBuilder()
          .withImmersionOffers([immersionOffer])
          .withEstablishment(
            new EstablishmentEntityBuilder()
              .withPosition({
                lat: 48.8531,
                lon: 2.34999,
              })
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
            appellationCode: immersionOffer.appellationCode,
            distanceKm: 30,
            longitude: 2.34999,
            latitude: 48.8531,
            sortedBy: "distance",
          },
        });

        expectToEqual(result, {
          status: 200,
          body: [
            establishmentAggregateToSearchResultByRome(
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
        expectToEqual(result, {
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

        expectToEqual(result, {
          status: 200,
          body: [],
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
          appellationCode: "XXX",
        },
      });
      expectToEqual(result, {
        status: 400,
        body: {
          status: 400,
          issues: ["appellationCode : Code appellation incorrect"],
          message:
            "Shared-route schema 'queryParamsSchema' was not respected in adapter 'express'.\nRoute: GET /immersion-offers",
        },
      });
    });
  });

  describe("GET getOffersByGroupSlug", () => {
    it("should get the stubbed data", async () => {
      const result = await sharedRequest.getOffersByGroupSlug({
        urlParams: {
          groupSlug: "some-group-slug",
        },
      });
      expectToEqual(result, {
        status: 200,
        body: [stubSearchResult],
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

    it(`200 - route with mandatory params`, async () => {
      await inMemoryUow.establishmentAggregateRepository.insertEstablishmentAggregates(
        [establishmentAggregate],
      );
      const response = await request.get(
        makeImmersionOfferUrl(
          establishmentAggregate.establishment.siret,
          establishmentAggregate.immersionOffers[0].appellationCode,
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

    it(`400 - route without mandatory fields or invalid fields`, async () => {
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

    it(`404 - route with valid mandatory fields but offer not in repo`, async () => {
      const requestedOffer = {
        siret: establishmentAggregate.establishment.siret,
        appellationCode:
          establishmentAggregate.immersionOffers[0].appellationCode,
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

    it(`404 - route with valid mandatory fields and siret in repo but appellation is not found for establishment`, async () => {
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
