import {
  AppellationAndRomeDto,
  expectHttpResponseToEqual,
  expectToEqual,
} from "shared";
import { HttpClient } from "shared-routes";
import { createSupertestSharedClient } from "shared-routes/supertest";
import { SuperTest, Test } from "supertest";
import { GenerateApiConsumerJwt } from "../../../../domains/auth/jwt";
import {
  authorizedUnJeuneUneSolutionApiConsumer,
  unauthorizedApiConsumer,
} from "../../../../domains/core/api-consumer/adapters/InMemoryApiConsumerRepository";
import { AppConfigBuilder } from "../../../../utils/AppConfigBuilder";
import { buildTestApp } from "../../../../utils/buildTestApp";
import {
  ContactEntityBuilder,
  EstablishmentAggregateBuilder,
  EstablishmentEntityBuilder,
  OfferEntityBuilder,
  TEST_LOCATION,
  defaultNafCode,
} from "../../../secondary/offer/EstablishmentBuilders";
import { TEST_ROME_LABEL } from "../../../secondary/offer/InMemoryEstablishmentAggregateRepository";
import { InMemoryUnitOfWork } from "../../config/uowConfig";
import { SearchImmersionResultPublicV2 } from "../DtoAndSchemas/v2/output/SearchImmersionResultPublicV2.dto";
import {
  PublicApiV2SearchEstablishmentRoutes,
  publicApiV2SearchEstablishmentRoutes,
} from "./publicApiV2.routes";

const styliste: AppellationAndRomeDto = {
  romeCode: "B1805",
  romeLabel: "Stylisme",
  appellationCode: "19540",
  appellationLabel: "Styliste",
};
const immersionOfferSiret = "78000403200019";

describe("Route to get ImmersionSearchResultDto by siret and rome - /v2/offers/:siret/:appellationCode", () => {
  let request: SuperTest<Test>;
  let inMemoryUow: InMemoryUnitOfWork;
  let generateApiConsumerJwt: GenerateApiConsumerJwt;
  let authToken: string;
  let sharedRequest: HttpClient<PublicApiV2SearchEstablishmentRoutes>;

  beforeEach(async () => {
    const config = new AppConfigBuilder()
      .withRepositories("IN_MEMORY")
      .withAuthorizedApiKeyIds([authorizedUnJeuneUneSolutionApiConsumer.id])
      .build();
    ({ request, inMemoryUow, generateApiConsumerJwt } =
      await buildTestApp(config));
    authToken = generateApiConsumerJwt({
      id: authorizedUnJeuneUneSolutionApiConsumer.id,
    });

    sharedRequest = createSupertestSharedClient(
      publicApiV2SearchEstablishmentRoutes,
      request,
    );
    inMemoryUow.apiConsumerRepository.consumers = [
      unauthorizedApiConsumer,
      authorizedUnJeuneUneSolutionApiConsumer,
    ];
    await inMemoryUow.establishmentAggregateRepository.insertEstablishmentAggregate(
      new EstablishmentAggregateBuilder()
        .withEstablishment(
          new EstablishmentEntityBuilder()
            .withSiret(immersionOfferSiret)
            .withLocations([TEST_LOCATION])
            .withNumberOfEmployeeRange("10-19")
            .build(),
        )
        .withContact(
          new ContactEntityBuilder().withContactMethod("EMAIL").build(),
        )
        .withOffers([
          new OfferEntityBuilder()
            .withRomeCode(styliste.romeCode)
            .withAppellationCode(styliste.appellationCode)
            .withAppellationLabel(styliste.appellationLabel)
            .build(),
        ])
        .build(),
    );
  });

  it("rejects unauthenticated requests", async () => {
    const siretNotInDB = "11000403200019";

    const response = await sharedRequest.getOfferBySiretAndAppellationCode({
      headers: {
        authorization: "",
      },
      urlParams: {
        appellationCode: styliste.appellationCode,
        siret: siretNotInDB,
      },
    });

    expectHttpResponseToEqual(response, {
      status: 401,
      body: { status: 401, message: "unauthenticated" },
    });
  });

  it("accepts valid authenticated requests", async () => {
    const response = await request
      .get(`/v2/search/${immersionOfferSiret}/${styliste.appellationCode}`)
      .set("Authorization", authToken);

    expectToEqual(response.body, {
      rome: styliste.romeCode,
      naf: defaultNafCode,
      siret: "78000403200019",
      name: "Company inside repository",
      voluntaryToImmersion: true,
      locationId: TEST_LOCATION.id,
      numberOfEmployeeRange: "10-19",
      address: TEST_LOCATION.address,
      contactMode: "EMAIL",
      romeLabel: TEST_ROME_LABEL,
      appellations: [
        {
          appellationLabel: styliste.appellationLabel,
          appellationCode: styliste.appellationCode,
        },
      ],
      nafLabel: "NAFRev2",
      additionalInformation: "",
      website: "",
      position: {
        lat: TEST_LOCATION.position.lat,
        lon: TEST_LOCATION.position.lon,
      },
    } satisfies SearchImmersionResultPublicV2);
    expect(response.status).toBe(200);
  });

  it("returns 404 if no offer can be found with such siret & appelation code", async () => {
    const siretNotInDB = "11000403200019";

    const { status, body } =
      await sharedRequest.getOfferBySiretAndAppellationCode({
        headers: {
          authorization: authToken,
        },
        urlParams: {
          appellationCode: styliste.appellationCode,
          siret: siretNotInDB,
        },
      });

    expectToEqual(body, {
      message: `No offer found for siret ${siretNotInDB} and appellation code ${styliste.appellationCode}`,
      status: 404,
    });
    expectToEqual(status, 404);
  });

  it("return 403 if forbidden", async () => {
    const authToken = generateApiConsumerJwt({
      id: unauthorizedApiConsumer.id,
    });

    const response = await sharedRequest.getOfferBySiretAndAppellationCode({
      headers: {
        authorization: authToken,
      },
      urlParams: {
        appellationCode: styliste.appellationCode,
        siret: immersionOfferSiret,
      },
    });

    expectHttpResponseToEqual(response, {
      status: 403,
      body: { message: "Accès refusé", status: 403 },
    });
  });
});
