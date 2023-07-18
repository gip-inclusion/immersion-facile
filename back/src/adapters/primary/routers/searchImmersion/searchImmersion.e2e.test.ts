import {
  expectToEqual,
  immersionOffersRoute,
  SearchImmersionRoutes,
  searchImmersionRoutes,
} from "shared";
import { HttpClient } from "shared-routes";
import { createSupertestSharedClient } from "shared-routes/supertest";
import { buildTestApp } from "../../../../_testBuilders/buildTestApp";
import {
  EstablishmentAggregateBuilder,
  establishmentAggregateToSearchResultByRome,
} from "../../../../_testBuilders/establishmentAggregate.test.helpers";
import { EstablishmentEntityBuilder } from "../../../../_testBuilders/EstablishmentEntityBuilder";
import { ImmersionOfferEntityV2Builder } from "../../../../_testBuilders/ImmersionOfferEntityV2Builder";
import { stubSearchResult } from "../../../secondary/immersionOffer/inMemoryEstablishmentGroupRepository";
import { InMemoryUnitOfWork } from "../../config/uowConfig";

describe("search-immersion route", () => {
  let inMemoryUow: InMemoryUnitOfWork;
  let sharedRequest: HttpClient<SearchImmersionRoutes>;

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
        const result = await sharedRequest.searchImmersion({
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
        const result = await sharedRequest.searchImmersion({
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
        const result = await sharedRequest.searchImmersion({
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
      const result = await sharedRequest.searchImmersion({
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
          issues: ["appellationCode : Code ROME incorrect"],
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
});
