import { SuperTest, Test } from "supertest";
import { avenueChampsElyseesDto } from "../../../../_testBuilders/addressDtos";
import { buildTestApp } from "../../../../_testBuilders/buildTestApp";
import { EstablishmentAggregateBuilder } from "../../../../_testBuilders/EstablishmentAggregateBuilder";
import {
  defaultNafCode,
  EstablishmentEntityBuilder,
} from "../../../../_testBuilders/EstablishmentEntityBuilder";
import { ImmersionOfferEntityV2Builder } from "../../../../_testBuilders/ImmersionOfferEntityV2Builder";
import { GenerateApiConsumerJwt } from "../../../../domain/auth/jwt";
import { InMemoryUnitOfWork } from "../../config/uowConfig";
import { SearchImmersionResultPublicV2 } from "../DtoAndSchemas/v2/output/SearchImmersionResultPublicV2.dto";

describe("search-immersion route", () => {
  let request: SuperTest<Test>;
  let inMemoryUow: InMemoryUnitOfWork;
  let generateApiConsumerJwt: GenerateApiConsumerJwt;

  beforeEach(async () => {
    ({ request, generateApiConsumerJwt, inMemoryUow } = await buildTestApp());
  });

  describe(`v2 - /v2/immersion-offers`, () => {
    describe("verify consumer is authenticated and authorized", () => {
      it("rejects unauthenticated requests", async () => {
        await request
          .get(
            `/v2/immersion-offers?rome=XXXXX&distanceKm=30&longitude=2.34999&latitude=48.8531&sortedBy=distance`,
          )
          .expect(401, { error: "forbidden: unauthenticated" });
      });
      it("rejects unauthorized consumer", async () => {
        await request
          .get(
            `/v2/immersion-offers?rome=XXXXX&distanceKm=30&longitude=2.34999&latitude=48.8531&sortedBy=distance`,
          )
          .set(
            "Authorization",
            generateApiConsumerJwt({ id: "my-unauthorized-id" }),
          )
          .expect(403, {
            error: "forbidden: unauthorised consumer Id",
          });
      });
    });
    describe("authenficated consumer", () => {
      it("with given rome and position", async () => {
        const immersionOffer = new ImmersionOfferEntityV2Builder()
          .withRomeCode("M1808")
          .withAppellationCode("11704")
          .build();
        // Prepare
        await inMemoryUow.establishmentAggregateRepository.insertEstablishmentAggregates(
          [
            new EstablishmentAggregateBuilder()
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
              .build(),
          ],
        );

        // Act and assert
        const expectedResult: SearchImmersionResultPublicV2[] = [
          {
            address: avenueChampsElyseesDto,
            naf: defaultNafCode,
            nafLabel: "NAFRev2",
            name: "Company inside repository",
            website: "www.jobs.fr",
            additionalInformation: "",
            rome: "M1808",
            romeLabel: "test_rome_label",
            appellations: [
              {
                appellationLabel: immersionOffer.appellationLabel,
                appellationCode: immersionOffer.appellationCode,
              },
            ],
            siret: "78000403200019",
            voluntaryToImmersion: true,
            contactMode: "EMAIL",
            numberOfEmployeeRange: "10-19",
            distance_m: 719436,
            position: { lat: 43.8666, lon: 8.3333 },
          },
        ];
        const response = await request
          .get(
            `/v2/immersion-offers?appellationCode=11704&distanceKm=30&longitude=2.34999&latitude=48.8531&sortedBy=distance&address=5%20rue%20des%20champs%20elysees%2044000%20Nantes`,
          )
          .set(
            "Authorization",
            generateApiConsumerJwt({ id: "my-authorized-id" }),
          );
        expect(response.body).toEqual(expectedResult);
        expect(response.status).toBe(200);
      });

      it("accept address with only city", async () => {
        const response = await request
          .get(
            `/v2/immersion-offers?rome=A1000&distanceKm=30&longitude=2.34999&latitude=48.8531&sortedBy=distance&address=Lyon`,
          )
          .set(
            "Authorization",
            generateApiConsumerJwt({ id: "my-authorized-id" }),
          );
        expect(response.status).toBe(200);
      });
      it("with no specified appellation code", async () => {
        await request
          .get(
            `/v2/immersion-offers?distanceKm=30&longitude=2.34999&latitude=48.8531&sortedBy=distance`,
          )
          .set(
            "Authorization",
            generateApiConsumerJwt({ id: "my-authorized-id" }),
          )
          .expect(200, []);
      });

      it("with filter voluntaryToImmersion", async () => {
        await request
          .get(
            `/v2/immersion-offers?distanceKm=30&longitude=2.34999&latitude=48.8531&voluntaryToImmersion=true&sortedBy=distance`,
          )
          .set(
            "Authorization",
            generateApiConsumerJwt({ id: "my-authorized-id" }),
          )
          .expect(200, []);
      });
    });

    it("rejects invalid requests with error code 400", async () => {
      await request
        .get(
          `/v2/immersion-offers?rome=XXXXX&distanceKm=30&longitude=2.34999&latitude=48.8531&sortedBy=distance`,
        )
        .set(
          "Authorization",
          generateApiConsumerJwt({ id: "my-authorized-id" }),
        )
        .expect(400, /Code ROME incorrect/);
    });
  });
});
