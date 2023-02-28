import {
  SearchImmersionResultDto,
  searchImmersionRoute__v0,
  immersionOffersRoute,
} from "shared";
import { SuperTest, Test } from "supertest";
import { GenerateApiConsumerJtw } from "../../../../domain/auth/jwt";
import {
  avenueChampsElysees,
  avenueChampsElyseesDto,
} from "../../../../_testBuilders/addressDtos";
import { buildTestApp } from "../../../../_testBuilders/buildTestApp";
import { EstablishmentAggregateBuilder } from "../../../../_testBuilders/EstablishmentAggregateBuilder";
import { EstablishmentEntityBuilder } from "../../../../_testBuilders/EstablishmentEntityBuilder";
import { ImmersionOfferEntityV2Builder } from "../../../../_testBuilders/ImmersionOfferEntityV2Builder";
import { InMemoryEstablishmentAggregateRepository } from "../../../secondary/immersionOffer/InMemoryEstablishmentAggregateRepository";
import { SearchImmersionResultPublicV0 } from "../DtoAndSchemas/v0/output/SearchImmersionResultPublicV0.dto";
import { SearchImmersionResultPublicV1 } from "../DtoAndSchemas/v1/output/SearchImmersionResultPublicV1.dto";

describe("search-immersion route", () => {
  let request: SuperTest<Test>;
  let establishmentAggregateRepository: InMemoryEstablishmentAggregateRepository;

  let generateApiJwt: GenerateApiConsumerJtw;

  beforeEach(async () => {
    const {
      request: testAppRequest,
      generateApiJwt: testAppGenerateApiJwt,
      inMemoryUow,
    } = await buildTestApp();
    request = testAppRequest;
    establishmentAggregateRepository =
      inMemoryUow.establishmentAggregateRepository;
    generateApiJwt = testAppGenerateApiJwt;
  });

  describe(`v0 - /${searchImmersionRoute__v0}`, () => {
    describe("accepts valid requests", () => {
      it("with given rome and location", async () => {
        // Prepare
        await establishmentAggregateRepository.insertEstablishmentAggregates([
          new EstablishmentAggregateBuilder()
            .withImmersionOffers([
              new ImmersionOfferEntityV2Builder().withRomeCode("A1000").build(),
            ])
            .withEstablishment(
              new EstablishmentEntityBuilder()
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
            address: avenueChampsElysees,
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
            city: avenueChampsElyseesDto.city,
            id: "78000403200019-A1000",
          },
        ];
        await request
          .post(`/${searchImmersionRoute__v0}`)
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
          .post(`/${searchImmersionRoute__v0}`)
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
        .post(`/${searchImmersionRoute__v0}`)
        .send({
          rome: "XXXXX", // not a valid rome code
          location: {
            lat: 48.8531,
            lon: 2.34999,
          },
          distance_km: 30,
        })
        .expect(400, /Code ROME incorrect/);
    });
  });
  describe(`v1 - /v1/${immersionOffersRoute}`, () => {
    describe("verify consumer is authenticated and authorized", () => {
      it("rejects unauthenticated requests", async () => {
        await request
          .get(
            `/v1/${immersionOffersRoute}?rome=XXXXX&distance_km=30&longitude=2.34999&latitude=48.8531&sortedBy=distance`,
          )
          .expect(401, { error: "forbidden: unauthenticated" });
      });
      it("rejects unauthorized consumer", async () => {
        await request
          .get(
            `/v1/${immersionOffersRoute}?rome=XXXXX&distance_km=30&longitude=2.34999&latitude=48.8531&sortedBy=distance`,
          )
          .set("Authorization", generateApiJwt({ id: "my-unauthorized-id" }))
          .expect(403, {
            error: "forbidden: unauthorised consumer Id",
          });
      });
    });
    describe("authenficated consumer", () => {
      it("with given rome and position", async () => {
        // Prepare
        await establishmentAggregateRepository.insertEstablishmentAggregates([
          new EstablishmentAggregateBuilder()
            .withImmersionOffers([
              new ImmersionOfferEntityV2Builder().withRomeCode("A1000").build(),
            ])
            .withEstablishment(
              new EstablishmentEntityBuilder()
                .withPosition({
                  lat: 48.8531,
                  lon: 2.34999,
                })
                .withWebsite("www.jobs.fr")
                .build(),
            )
            .build(),
        ]);

        // Act and assert
        const expectedResult: SearchImmersionResultPublicV1[] = [
          {
            address: avenueChampsElysees,
            naf: "8539A",
            nafLabel: "test_naf_label",
            name: "Company inside repository",
            website: "www.jobs.fr",
            additionalInformation: "",
            rome: "A1000",
            romeLabel: "test_rome_label",
            appellationLabels: ["test_appellation_label"],
            siret: "78000403200019",
            voluntaryToImmersion: true,
            contactMode: "EMAIL",
            numberOfEmployeeRange: "10-19",
            distance_m: 719436,
            position: { lat: 43.8666, lon: 8.3333 },
            city: avenueChampsElyseesDto.city,
            contactDetails: {
              id: "3ca6e619-d654-4d0d-8fa6-2febefbe953d",
              firstName: "Alain",
              lastName: "Prost",
              email: "alain.prost@email.fr",
              phone: "0612345678",
              job: "le big boss",
            },
          },
        ];
        const response = await request
          .get(
            `/v1/${immersionOffersRoute}?rome=A1000&distance_km=30&longitude=2.34999&latitude=48.8531&sortedBy=distance&address=5%20rue%20des%20champs%20elysees%2044000%20Nantes`,
          )
          .set("Authorization", generateApiJwt({ id: "my-authorized-id" }));
        expect(response.body).toEqual(expectedResult);
        expect(response.status).toBe(200);
      });
      it("accept address with only city", async () => {
        const response = await request
          .get(
            `/v1/${immersionOffersRoute}?rome=A1000&distance_km=30&longitude=2.34999&latitude=48.8531&sortedBy=distance&address=Lyon`,
          )
          .set("Authorization", generateApiJwt({ id: "my-authorized-id" }));
        expect(response.status).toBe(200);
      });
      it("with no specified rome", async () => {
        await request
          .get(
            `/v1/${immersionOffersRoute}?distance_km=30&longitude=2.34999&latitude=48.8531&sortedBy=distance`,
          )
          .set("Authorization", generateApiJwt({ id: "my-authorized-id" }))
          .expect(200, []);
      });
      it("with filter voluntaryToImmersion", async () => {
        await request
          .get(
            `/v1/${immersionOffersRoute}?distance_km=30&longitude=2.34999&latitude=48.8531&voluntaryToImmersion=true&sortedBy=distance`,
          )
          .set("Authorization", generateApiJwt({ id: "my-authorized-id" }))
          .expect(200, []);
      });
    });

    // TODO add test which actually recovers data (and one with token, one without)

    it("rejects invalid requests with error code 400", async () => {
      await request
        .get(
          `/v1/${immersionOffersRoute}?rome=XXXXX&distance_km=30&longitude=2.34999&latitude=48.8531&sortedBy=distance`,
        )
        .set("Authorization", generateApiJwt({ id: "my-authorized-id" }))
        .expect(400, /Code ROME incorrect/);
    });
  });
  describe(`from front - /${immersionOffersRoute}`, () => {
    describe("accepts valid requests", () => {
      it("with given rome and position", async () => {
        // Prepare
        await establishmentAggregateRepository.insertEstablishmentAggregates([
          new EstablishmentAggregateBuilder()
            .withImmersionOffers([
              new ImmersionOfferEntityV2Builder().withRomeCode("A1000").build(),
            ])
            .withEstablishment(
              new EstablishmentEntityBuilder()
                .withPosition({
                  lat: 48.8531,
                  lon: 2.34999,
                })
                .withWebsite("www.jobs.fr")
                .build(),
            )
            .build(),
        ]);

        // Act and assert
        const expectedResult: SearchImmersionResultDto[] = [
          {
            address: avenueChampsElyseesDto,
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
            position: { lat: 43.8666, lon: 8.3333 },
            website: "www.jobs.fr",
            additionalInformation: "",
          },
        ];
        await request
          .get(
            `/${immersionOffersRoute}?rome=A1000&distance_km=30&longitude=2.34999&latitude=48.8531&sortedBy=distance`,
          )
          .expect(200, expectedResult);
      });
      it("with no specified rome", async () => {
        await request
          .get(
            `/${immersionOffersRoute}?distance_km=30&longitude=2.34999&latitude=48.8531&sortedBy=distance`,
          )
          .expect(200, []);
      });
      it("with filter voluntaryToImmersion", async () => {
        await request
          .get(
            `/${immersionOffersRoute}?distance_km=30&longitude=2.34999&latitude=48.8531&voluntaryToImmersion=true&sortedBy=distance`,
          )
          .expect(200, []);
      });
    });

    // TODO add test which actually recovers data (and one with token, one without)

    it("rejects invalid requests with error code 400", async () => {
      await request
        .get(
          `/${immersionOffersRoute}?rome=XXXXX&distance_km=30&longitude=2.34999&latitude=48.8531&sortedBy=distance`,
        )
        .expect(400, /Code ROME incorrect/);
    });
  });
});
