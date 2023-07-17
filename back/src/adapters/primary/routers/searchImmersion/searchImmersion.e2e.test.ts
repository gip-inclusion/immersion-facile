import { SuperTest, Test } from "supertest";
import { expectToEqual, immersionOffersRoute, searchTargets } from "shared";
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
  let request: SuperTest<Test>;
  let inMemoryUow: InMemoryUnitOfWork;

  beforeEach(async () => {
    ({ request, inMemoryUow } = await buildTestApp());
  });

  describe(`from front - /${immersionOffersRoute}`, () => {
    describe("accepts valid requests", () => {
      it("with given rome and position", async () => {
        const immersionOffer = new ImmersionOfferEntityV2Builder()
          .withRomeCode("A1000")
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
        const result = await request.get(
          `/${immersionOffersRoute}?rome=A1000&distanceKm=30&longitude=2.34999&latitude=48.8531&sortedBy=distance`,
        );
        expectToEqual(result.body, [
          establishmentAggregateToSearchResultByRome(
            establishmentAgg,
            immersionOffer.romeCode,
            0,
          ),
        ]);
        expectToEqual(result.statusCode, 200);
      });
      it("with no specified rome", async () => {
        await request
          .get(
            `/${immersionOffersRoute}?distanceKm=30&longitude=2.34999&latitude=48.8531&sortedBy=distance`,
          )
          .expect(200, []);
      });
      it("with filter voluntaryToImmersion", async () => {
        await request
          .get(
            `/${immersionOffersRoute}?distanceKm=30&longitude=2.34999&latitude=48.8531&voluntaryToImmersion=true&sortedBy=distance`,
          )
          .expect(200, []);
      });
    });

    // TODO add test which actually recovers data (and one with token, one without)

    it("rejects invalid requests with error code 400", async () => {
      await request
        .get(
          `/${immersionOffersRoute}?appellationCode=XXXXX&distanceKm=30&longitude=2.34999&latitude=48.8531&sortedBy=distance`,
        )
        .expect(400, /Code ROME incorrect/);
    });
  });

  describe("GET getOffersByGroupSlug", () => {
    it("should get the stubbed data", async () => {
      const response = await request.get(
        searchTargets.getOffersByGroupSlug.url.replace(
          ":slug",
          "some-group-slug",
        ),
      );
      expect(response.status).toBe(200);
      expectToEqual(response.body, [stubSearchResult]);
    });
  });
});
