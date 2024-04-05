import {
  SiretDto,
  cartographeAppellationAndRome,
  expectHttpResponseToEqual,
} from "shared";
import { HttpClient } from "shared-routes";
import { createSupertestSharedClient } from "shared-routes/supertest";
import { SuperTest, Test } from "supertest";
import { avenueChampsElyseesDto } from "../../../../domains/core/address/adapters/InMemoryAddressGateway";
import {
  authorizedUnJeuneUneSolutionApiConsumer,
  unauthorizedApiConsumer,
} from "../../../../domains/core/api-consumer/adapters/InMemoryApiConsumerRepository";
import { GenerateApiConsumerJwt } from "../../../../domains/core/jwt";
import { InMemoryUnitOfWork } from "../../../../domains/core/unit-of-work/adapters/createInMemoryUow";
import {
  EstablishmentAggregateBuilder,
  EstablishmentEntityBuilder,
  OfferEntityBuilder,
  defaultNafCode,
} from "../../../../domains/establishment/helpers/EstablishmentBuilders";
import { buildTestApp } from "../../../../utils/buildTestApp";
import { SearchImmersionResultPublicV2 } from "../DtoAndSchemas/v2/output/SearchImmersionResultPublicV2.dto";
import {
  PublicApiV2SearchEstablishmentRoutes,
  publicApiV2SearchEstablishmentRoutes,
} from "./publicApiV2.routes";

describe("search route", () => {
  let request: SuperTest<Test>;
  let authToken: string;
  let sharedRequest: HttpClient<PublicApiV2SearchEstablishmentRoutes>;
  let inMemoryUow: InMemoryUnitOfWork;
  let generateApiConsumerJwt: GenerateApiConsumerJwt;

  beforeEach(async () => {
    ({ request, generateApiConsumerJwt, inMemoryUow } = await buildTestApp());
    inMemoryUow.romeRepository.appellations = [cartographeAppellationAndRome];
    inMemoryUow.apiConsumerRepository.consumers = [
      authorizedUnJeuneUneSolutionApiConsumer,
      unauthorizedApiConsumer,
    ];
    sharedRequest = createSupertestSharedClient(
      publicApiV2SearchEstablishmentRoutes,
      request,
    );
    authToken = generateApiConsumerJwt({
      id: authorizedUnJeuneUneSolutionApiConsumer.id,
    });
  });

  describe(`${publicApiV2SearchEstablishmentRoutes.searchImmersion.method.toUpperCase()} ${
    publicApiV2SearchEstablishmentRoutes.searchImmersion.url
  }`, () => {
    describe("verify consumer is authenticated and authorized", () => {
      it("rejects unauthenticated requests", async () => {
        const response = await sharedRequest.searchImmersion({
          headers: {
            authorization: "",
          },
          queryParams: {
            longitude: 2,
            latitude: 48,
            distanceKm: 10,
          },
        });
        expectHttpResponseToEqual(response, {
          status: 401,
          body: { message: "unauthenticated", status: 401 },
        });
      });

      it("rejects unauthorized consumer", async () => {
        const authToken = generateApiConsumerJwt({
          id: unauthorizedApiConsumer.id,
        });
        const response = await sharedRequest.searchImmersion({
          headers: {
            authorization: authToken,
          },
          queryParams: {
            longitude: 2,
            latitude: 48,
            distanceKm: 10,
          },
        });
        expectHttpResponseToEqual(response, {
          status: 403,
          body: {
            status: 403,
            message: "Accès refusé",
          },
        });
      });
    });

    describe("authenticated consumer", () => {
      it("with given rome, appellation code and position", async () => {
        const offer1 = new OfferEntityBuilder()
          .withRomeCode("M1808")
          .withAppellationCode("11704")
          .build();

        const offer2 = new OfferEntityBuilder()
          .withRomeCode("M1808")
          .withAppellationCode("11705")
          .build();

        // Prepare
        await inMemoryUow.establishmentAggregateRepository.insertEstablishmentAggregate(
          new EstablishmentAggregateBuilder()
            .withOffers([offer1, offer2])
            .withEstablishment(
              new EstablishmentEntityBuilder()
                .withLocations([
                  {
                    position: {
                      lat: 48.8531,
                      lon: 2.34999,
                    },
                    address: avenueChampsElyseesDto,
                    id: "123",
                  },
                ])
                .withWebsite("www.jobs.fr")
                .build(),
            )
            .build(),
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
                score: 4.5,
              },
              {
                appellationLabel: offer2.appellationLabel,
                appellationCode: offer2.appellationCode,
                score: 4.5,
              },
            ],
            siret: "78000403200019",
            voluntaryToImmersion: true,
            contactMode: "EMAIL",
            numberOfEmployeeRange: "10-19",
            distance_m: 0,
            position: { lat: 48.8531, lon: 2.34999 },
            locationId: "123",
          },
        ];

        const responseWith2AppellationCodesProvided = await request
          .get(
            "/v2/search?appellationCodes[]=11704&appellationCodes[]=11705&distanceKm=30&longitude=2.34999&latitude=48.8531&sortedBy=distance&address=5%20rue%20des%20champs%20elysees%2044000%20Nantes",
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
            "/v2/search?appellationCodes[]=11704&distanceKm=30&longitude=2.34999&latitude=48.8531&sortedBy=distance&address=5%20rue%20des%20champs%20elysees%2044000%20Nantes",
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
            "/v2/search?rome=A1000&distanceKm=30&longitude=2.34999&latitude=48.8531&sortedBy=distance&address=Lyon",
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
            "/v2/search?distanceKm=30&longitude=2.34999&latitude=48.8531&sortedBy=distance",
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
            "/v2/search?distanceKm=30&longitude=2.34999&latitude=48.8531&voluntaryToImmersion=true&sortedBy=distance",
          )
          .set(
            "Authorization",
            generateApiConsumerJwt({
              id: authorizedUnJeuneUneSolutionApiConsumer.id,
            }),
          )
          .expect(200, []);
      });

      describe("with filter establishmentSearchableBy", () => {
        const siret1 = "12345678901234";
        const siret2 = "11111111111111";
        const siret3 = "12341234123455";

        const toSearchImmersionResults = (
          sirets: SiretDto[],
        ): SearchImmersionResultPublicV2[] =>
          sirets.map((siret) => ({
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
                score: 4.5,
              },
              {
                appellationLabel: offer2.appellationLabel,
                appellationCode: offer2.appellationCode,
                score: 4.5,
              },
            ],
            siret,
            voluntaryToImmersion: true,
            contactMode: "EMAIL",
            numberOfEmployeeRange: "10-19",
            distance_m: 0,
            position: { lat: 48.8531, lon: 2.34999 },
            locationId: "123",
          }));

        const offer1 = new OfferEntityBuilder()
          .withRomeCode("M1808")
          .withAppellationCode("11704")
          .build();

        const offer2 = new OfferEntityBuilder()
          .withRomeCode("M1808")
          .withAppellationCode("11705")
          .build();

        beforeEach(async () => {
          inMemoryUow.establishmentAggregateRepository.establishmentAggregates =
            [
              new EstablishmentAggregateBuilder()
                .withEstablishmentSiret(siret1)
                .withOffers([offer1, offer2])
                .withEstablishment(
                  new EstablishmentEntityBuilder()
                    .withSiret(siret1)
                    .withLocations([
                      {
                        position: {
                          lat: 48.8531,
                          lon: 2.34999,
                        },
                        address: avenueChampsElyseesDto,
                        id: "123",
                      },
                    ])
                    .withWebsite("www.jobs.fr")
                    .build(),
                )
                .build(),
              new EstablishmentAggregateBuilder()
                .withEstablishmentSiret(siret2)
                .withOffers([offer1, offer2])
                .withEstablishment(
                  new EstablishmentEntityBuilder()
                    .withSiret(siret2)
                    .withLocations([
                      {
                        position: {
                          lat: 48.8531,
                          lon: 2.34999,
                        },
                        address: avenueChampsElyseesDto,
                        id: "123",
                      },
                    ])
                    .withWebsite("www.jobs.fr")
                    .withSearchableBy({ students: true, jobSeekers: false })
                    .build(),
                )
                .build(),
              new EstablishmentAggregateBuilder()
                .withEstablishmentSiret(siret3)
                .withOffers([offer1, offer2])
                .withEstablishment(
                  new EstablishmentEntityBuilder()
                    .withSiret(siret3)
                    .withLocations([
                      {
                        position: {
                          lat: 48.8531,
                          lon: 2.34999,
                        },
                        address: avenueChampsElyseesDto,
                        id: "123",
                      },
                    ])
                    .withWebsite("www.jobs.fr")
                    .withSearchableBy({ students: false, jobSeekers: true })
                    .build(),
                )
                .build(),
            ];
        });

        it("with filter establishmentSearchableBy defined to students", async () => {
          await request
            .get(
              "/v2/search?distanceKm=30&longitude=2.34999&latitude=48.8531&establishmentSearchableBy=students&sortedBy=distance",
            )
            .set(
              "Authorization",
              generateApiConsumerJwt({
                id: authorizedUnJeuneUneSolutionApiConsumer.id,
              }),
            )
            .expect(200, toSearchImmersionResults([siret1, siret2]));
        });

        it("with filter establishmentSearchableBy defined to jobSeekers", async () => {
          await request
            .get(
              "/v2/search?distanceKm=30&longitude=2.34999&latitude=48.8531&establishmentSearchableBy=jobSeekers&sortedBy=distance",
            )
            .set(
              "Authorization",
              generateApiConsumerJwt({
                id: authorizedUnJeuneUneSolutionApiConsumer.id,
              }),
            )
            .expect(200, toSearchImmersionResults([siret1, siret3]));
        });

        it("with filter establishmentSearchableBy not defined", async () => {
          await request
            .get(
              "/v2/search?distanceKm=30&longitude=2.34999&latitude=48.8531&sortedBy=distance",
            )
            .set(
              "Authorization",
              generateApiConsumerJwt({
                id: authorizedUnJeuneUneSolutionApiConsumer.id,
              }),
            )
            .expect(200, toSearchImmersionResults([siret1, siret2, siret3]));
        });
      });
    });

    it("rejects invalid requests with error code 400", async () => {
      const response = await sharedRequest.searchImmersion({
        headers: {
          authorization: authToken,
        },
        queryParams: {} as any,
      });
      expectHttpResponseToEqual(response, {
        status: 400,
        body: {
          status: 400,
          issues: [
            "latitude : Expected number, received nan",
            "longitude : Expected number, received nan",
            "distanceKm : Expected number, received nan",
          ],
          message:
            "Shared-route schema 'queryParamsSchema' was not respected in adapter 'express'.\nRoute: GET /v2/search",
        },
      });
    });
  });
});
