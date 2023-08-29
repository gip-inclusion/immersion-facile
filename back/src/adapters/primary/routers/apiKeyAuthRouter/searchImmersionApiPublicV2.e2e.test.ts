import { SuperTest, Test } from "supertest";
import { AppellationAndRomeDto, expectToEqual } from "shared";
import { HttpClient } from "shared-routes";
import { createSupertestSharedClient } from "shared-routes/supertest";
import { avenueChampsElyseesDto } from "../../../../_testBuilders/addressDtos";
import { buildTestApp } from "../../../../_testBuilders/buildTestApp";
import { EstablishmentAggregateBuilder } from "../../../../_testBuilders/establishmentAggregate.test.helpers";
import {
  defaultNafCode,
  EstablishmentEntityBuilder,
} from "../../../../_testBuilders/EstablishmentEntityBuilder";
import { ImmersionOfferEntityV2Builder } from "../../../../_testBuilders/ImmersionOfferEntityV2Builder";
import { GenerateApiConsumerJwt } from "../../../../domain/auth/jwt";
import {
  authorizedUnJeuneUneSolutionApiConsumer,
  unauthorisedApiConsumer,
} from "../../../secondary/InMemoryApiConsumerRepository";
import { InMemoryUnitOfWork } from "../../config/uowConfig";
import { SearchImmersionResultPublicV2 } from "../DtoAndSchemas/v2/output/SearchImmersionResultPublicV2.dto";
import { PublicApiV2Routes, publicApiV2Routes } from "./publicApiV2.routes";

const cartographeAppellationAndRome: AppellationAndRomeDto = {
  romeCode: "M1808",
  appellationCode: "11704",
  romeLabel: "Information géographique",
  appellationLabel: "Cartographe",
};

describe("search route", () => {
  let request: SuperTest<Test>;
  let authToken: string;
  let sharedRequest: HttpClient<PublicApiV2Routes>;
  let inMemoryUow: InMemoryUnitOfWork;
  let generateApiConsumerJwt: GenerateApiConsumerJwt;

  beforeEach(async () => {
    ({ request, generateApiConsumerJwt, inMemoryUow } = await buildTestApp());
    inMemoryUow.romeRepository.appellations = [cartographeAppellationAndRome];
    inMemoryUow.apiConsumerRepository.consumers = [
      authorizedUnJeuneUneSolutionApiConsumer,
      unauthorisedApiConsumer,
    ];
    sharedRequest = createSupertestSharedClient(publicApiV2Routes, request);
    authToken = generateApiConsumerJwt({
      id: authorizedUnJeuneUneSolutionApiConsumer.id,
    });
  });

  describe(`v2 - /offers`, () => {
    describe("verify consumer is authenticated and authorized", () => {
      it("rejects unauthenticated requests", async () => {
        const response = await sharedRequest.searchImmersion({
          headers: {
            authorization: "",
          },
          queryParams: {} as any,
        });
        expectToEqual(response, {
          status: 401,
          body: { message: "unauthenticated", status: 401 },
        });
      });

      it("rejects unauthorized consumer", async () => {
        const authToken = generateApiConsumerJwt({
          id: unauthorisedApiConsumer.id,
        });
        const response = await sharedRequest.searchImmersion({
          headers: {
            authorization: authToken,
          },
          queryParams: {} as any,
        });
        expectToEqual(response, {
          status: 403,
          body: {
            status: 403,
            message: "unauthorised consumer Id",
          },
        });
      });
    });

    describe("authenticated consumer", () => {
      it("with given rome, appellation code and position", async () => {
        const offer1 = new ImmersionOfferEntityV2Builder()
          .withRomeCode("M1808")
          .withAppellationCode("11704")
          .build();

        const offer2 = new ImmersionOfferEntityV2Builder()
          .withRomeCode("M1808")
          .withAppellationCode("11705")
          .build();

        // Prepare
        await inMemoryUow.establishmentAggregateRepository.insertEstablishmentAggregates(
          [
            new EstablishmentAggregateBuilder()
              .withImmersionOffers([offer1, offer2])
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
                appellationLabel: offer1.appellationLabel,
                appellationCode: offer1.appellationCode,
              },
              {
                appellationLabel: offer2.appellationLabel,
                appellationCode: offer2.appellationCode,
              },
            ],
            siret: "78000403200019",
            voluntaryToImmersion: true,
            contactMode: "EMAIL",
            numberOfEmployeeRange: "10-19",
            distance_m: 0,
            position: { lat: 48.8531, lon: 2.34999 },
          },
        ];

        const responseWith2AppellationCodesProvided = await request
          .get(
            `/v2/offers?appellationCodes[]=11704&appellationCodes[]=11705&distanceKm=30&longitude=2.34999&latitude=48.8531&sortedBy=distance&address=5%20rue%20des%20champs%20elysees%2044000%20Nantes`,
          )
          .set(
            "Authorization",
            generateApiConsumerJwt({
              id: authorizedUnJeuneUneSolutionApiConsumer.id,
            }),
          );

        expect(responseWith2AppellationCodesProvided.body).toEqual(
          expectedResult,
        );
        expect(responseWith2AppellationCodesProvided.status).toBe(200);

        const responseWith1AppellationCodeProvided = await request
          .get(
            `/v2/offers?appellationCodes[]=11704&distanceKm=30&longitude=2.34999&latitude=48.8531&sortedBy=distance&address=5%20rue%20des%20champs%20elysees%2044000%20Nantes`,
          )
          .set(
            "Authorization",
            generateApiConsumerJwt({
              id: authorizedUnJeuneUneSolutionApiConsumer.id,
            }),
          );

        expect(responseWith1AppellationCodeProvided.body).toEqual(
          expectedResult,
        );
        expect(responseWith1AppellationCodeProvided.status).toBe(200);
      });

      it("accept address with only city", async () => {
        const response = await request
          .get(
            `/v2/offers?rome=A1000&distanceKm=30&longitude=2.34999&latitude=48.8531&sortedBy=distance&address=Lyon`,
          )
          .set(
            "Authorization",
            generateApiConsumerJwt({
              id: authorizedUnJeuneUneSolutionApiConsumer.id,
            }),
          );
        expect(response.status).toBe(200);
      });

      it("with no specified appellation code", async () => {
        await request
          .get(
            `/v2/offers?distanceKm=30&longitude=2.34999&latitude=48.8531&sortedBy=distance`,
          )
          .set(
            "Authorization",
            generateApiConsumerJwt({
              id: authorizedUnJeuneUneSolutionApiConsumer.id,
            }),
          )
          .expect(200, []);
      });

      it("with filter voluntaryToImmersion", async () => {
        await request
          .get(
            `/v2/offers?distanceKm=30&longitude=2.34999&latitude=48.8531&voluntaryToImmersion=true&sortedBy=distance`,
          )
          .set(
            "Authorization",
            generateApiConsumerJwt({
              id: authorizedUnJeuneUneSolutionApiConsumer.id,
            }),
          )
          .expect(200, []);
      });
    });

    it("rejects invalid requests with error code 400", async () => {
      const response = await sharedRequest.searchImmersion({
        headers: {
          authorization: authToken,
        },
        queryParams: {} as any,
      });
      expectToEqual(response, {
        status: 400,
        body: {
          status: 400,
          issues: [
            "latitude : Expected number, received nan",
            "longitude : Expected number, received nan",
            "distanceKm : Expected number, received nan",
          ],
          message:
            "Shared-route schema 'queryParamsSchema' was not respected in adapter 'express'.\nRoute: GET /v2/offers",
        },
      });
    });
  });
});
