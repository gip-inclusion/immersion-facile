import supertest, { SuperTest, Test } from "supertest";
import { SearchImmersionResultPublicV0 } from "../../adapters/primary/routers/DtoAndSchemas/v0/output/SearchImmersionResultPublicV0.dto";
import { SearchImmersionResultPublicV1 } from "../../adapters/primary/routers/DtoAndSchemas/v1/output/SearchImmersionResultPublicV1.dto";
import { createApp } from "../../adapters/primary/server";
import { InMemoryEstablishmentAggregateRepository } from "../../adapters/secondary/immersionOffer/InMemoryEstablishmentAggregateRepository";
import { PgEstablishmentAggregateRepository } from "../../adapters/secondary/pg/PgEstablishmentAggregateRepository";
import { AppConfigBuilder } from "../../_testBuilders/AppConfigBuilder";
import { EstablishmentAggregateBuilder } from "../../_testBuilders/EstablishmentAggregateBuilder";
import { EstablishmentEntityV2Builder } from "../../_testBuilders/EstablishmentEntityV2Builder";
import { ImmersionOfferEntityV2Builder } from "../../_testBuilders/ImmersionOfferEntityV2Builder";

describe("search-immersion route", () => {
  let request: SuperTest<Test>;
  let immersionOfferRepo:
    | InMemoryEstablishmentAggregateRepository
    | PgEstablishmentAggregateRepository;

  beforeEach(async () => {
    const { app, repositories } = await createApp(
      new AppConfigBuilder().build(),
    );
    request = supertest(app);
    immersionOfferRepo = repositories.immersionOffer;
  });

  describe("v0", () => {
    describe("accepts valid requests", () => {
      it("with given rome and location", async () => {
        // Prepare
        await immersionOfferRepo.insertEstablishmentAggregates([
          new EstablishmentAggregateBuilder()
            .withImmersionOffers([
              new ImmersionOfferEntityV2Builder().withRomeCode("A1000").build(),
            ])
            .withEstablishment(
              new EstablishmentEntityV2Builder()
                .withPosition({
                  lat: 48.8531,
                  lon: 2.34999,
                })
                .build(),
            )
            .build(),
        ]);

        // Act and assert
        const expectedResult: SearchImmersionResultPublicV0[] = [
          {
            address: "30 avenue des champs Elysées, 75017 Paris",
            naf: "8539A",
            nafLabel: "test_naf_label",
            name: "Company inside repository",
            rome: "A1000",
            romeLabel: "test_rome_label",
            siret: "78000403200019",
            voluntaryToImmersion: true,
            contactMode: "EMAIL",
            numberOfEmployeeRange: "10-19",
            distance_m: 719436,
            location: { lat: 43.8666, lon: 8.3333 },
            city: "test_city",
            id: "78000403200019-A1000",
          },
        ];
        await request
          .post(`/search-immersion`)
          .send({
            rome: "A1000",
            location: {
              lat: 48.8531,
              lon: 2.34999,
            },
            distance_km: 30,
          })
          .expect(200, expectedResult);
      });
      it("with no specified rome", async () => {
        await request
          .post(`/search-immersion`)
          .send({
            location: {
              lat: 48.8531,
              lon: 2.34999,
            },
            distance_km: 30,
          })
          .expect(200, []);
      });
    });

    // TODO add test which actually recovers data (and one with token, one without)

    it("rejects invalid requests with error code 400", async () => {
      await request
        .post(`/search-immersion`)
        .send({
          rome: "XXXXX", // not a valid rome code
          location: {
            lat: 48.8531,
            lon: 2.34999,
          },
          // eslint-disable-next-line @typescript-eslint/naming-convention
          distance_km: 30,
        })
        .expect(400, /Code ROME incorrect/);
    });
  });
  describe("v1", () => {
    describe("accepts valid requests", () => {
      it("with given rome and location", async () => {
        // Prepare
        await immersionOfferRepo.insertEstablishmentAggregates([
          new EstablishmentAggregateBuilder()
            .withImmersionOffers([
              new ImmersionOfferEntityV2Builder().withRomeCode("A1000").build(),
            ])
            .withEstablishment(
              new EstablishmentEntityV2Builder()
                .withPosition({
                  lat: 48.8531,
                  lon: 2.34999,
                })
                .build(),
            )
            .build(),
        ]);

        // Act and assert
        const expectedResult: SearchImmersionResultPublicV1[] = [
          {
            address: "30 avenue des champs Elysées, 75017 Paris",
            naf: "8539A",
            nafLabel: "test_naf_label",
            name: "Company inside repository",
            rome: "A1000",
            romeLabel: "test_rome_label",
            appellationLabels: ["test_appellation_label"],
            siret: "78000403200019",
            voluntaryToImmersion: true,
            contactMode: "EMAIL",
            numberOfEmployeeRange: "10-19",
            distance_m: 719436,
            location: { lat: 43.8666, lon: 8.3333 },
            city: "test_city",
          },
        ];
        await request
          .post(`/v1/search-immersion`)
          .send({
            rome: "A1000",
            location: {
              lat: 48.8531,
              lon: 2.34999,
            },
            distance_km: 30,
          })
          .expect(200, expectedResult);
      });
      it("with no specified rome", async () => {
        await request
          .post(`/v1/search-immersion`)
          .send({
            location: {
              lat: 48.8531,
              lon: 2.34999,
            },
            distance_km: 30,
          })
          .expect(200, []);
      });
      it("with filter voluntary_to_immersion", async () => {
        await request
          .post(`/v1/search-immersion`)
          .send({
            location: {
              lat: 48.8531,
              lon: 2.34999,
            },
            distance_km: 30,
            voluntary_to_immersion: true,
          })
          .expect(200, []);
      });
    });

    // TODO add test which actually recovers data (and one with token, one without)

    it("rejects invalid requests with error code 400", async () => {
      await request
        .post(`/v1/search-immersion`)
        .send({
          rome: "XXXXX", // not a valid rome code
          location: {
            lat: 48.8531,
            lon: 2.34999,
          },
          // eslint-disable-next-line @typescript-eslint/naming-convention
          distance_km: 30,
        })
        .expect(400, /Code ROME incorrect/);
    });
  });
});
