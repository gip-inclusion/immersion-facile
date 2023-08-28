import {
  adminRoutes,
  ApiConsumer,
  ApiConsumerJwt,
  ApiConsumerRoutes,
  apiConsumerRoutes,
  BackOfficeJwt,
  expectToEqual,
} from "shared";
import { HttpClient } from "shared-routes";
import { ResponsesToHttpResponse } from "shared-routes/src/defineRoutes";
import { createSupertestSharedClient } from "shared-routes/supertest";
import { AppConfigBuilder } from "../../../../_testBuilders/AppConfigBuilder";
import {
  buildTestApp,
  InMemoryGateways,
} from "../../../../_testBuilders/buildTestApp";
import {
  GenerateApiConsumerJwt,
  makeVerifyJwtES256,
} from "../../../../domain/auth/jwt";
import { authorizedUnJeuneUneSolutionApiConsumer } from "../../../secondary/InMemoryApiConsumerRepository";
import { AppConfig } from "../../config/appConfig";
import { InMemoryUnitOfWork } from "../../config/uowConfig";

describe("Api Consumer router", () => {
  let sharedRequest: HttpClient<ApiConsumerRoutes>;
  let backOfficeJwt: BackOfficeJwt;
  let gateways: InMemoryGateways;
  let inMemoryUow: InMemoryUnitOfWork;
  let appConfig: AppConfig;
  let generateApiConsumerJwt: GenerateApiConsumerJwt;

  beforeEach(async () => {
    const testAppAndDeps = await buildTestApp(
      new AppConfigBuilder()
        .withConfigParams({
          BACKOFFICE_USERNAME: "user",
          BACKOFFICE_PASSWORD: "pwd",
        })
        .build(),
    );

    ({ gateways, inMemoryUow, appConfig, generateApiConsumerJwt } =
      testAppAndDeps);

    sharedRequest = createSupertestSharedClient(
      apiConsumerRoutes,
      testAppAndDeps.request,
    );

    gateways.timeGateway.setNextDate(new Date());
    backOfficeJwt = (
      await testAppAndDeps.request
        .post(adminRoutes.login.url)
        .send({ user: "user", password: "pwd" })
    ).body;
  });

  describe(`${apiConsumerRoutes.saveApiConsumer.method} ${apiConsumerRoutes.saveApiConsumer.url}`, () => {
    it("200 - save new api consumer", async () => {
      expectToEqual(inMemoryUow.apiConsumerRepository.consumers, []);
      const response = await sharedRequest.saveApiConsumer({
        body: authorizedUnJeuneUneSolutionApiConsumer,
        headers: { authorization: backOfficeJwt },
      });

      const jwt = expectResponseAndReturnJwt(response, {
        status: 200,
        body: {
          jwt: expect.any(String),
        },
      })!;

      const { id } = makeVerifyJwtES256<"apiConsumer">(
        appConfig.apiJwtPublicKey,
      )(jwt);

      expectToEqual(id, authorizedUnJeuneUneSolutionApiConsumer.id);
      expectToEqual(inMemoryUow.apiConsumerRepository.consumers, [
        authorizedUnJeuneUneSolutionApiConsumer,
      ]);
    });

    it("200 - save existing api consumer", async () => {
      inMemoryUow.apiConsumerRepository.consumers = [
        authorizedUnJeuneUneSolutionApiConsumer,
      ];

      const updatedApiConsumer: ApiConsumer = {
        ...authorizedUnJeuneUneSolutionApiConsumer,
        isAuthorized: !authorizedUnJeuneUneSolutionApiConsumer.isAuthorized,
      };

      const response = await sharedRequest.saveApiConsumer({
        body: updatedApiConsumer,
        headers: { authorization: backOfficeJwt },
      });

      const jwt = expectResponseAndReturnJwt(response, {
        status: 200,
        body: {
          jwt: expect.any(String),
        },
      })!;

      const { id } = makeVerifyJwtES256<"apiConsumer">(
        appConfig.apiJwtPublicKey,
      )(jwt);

      expectToEqual(id, authorizedUnJeuneUneSolutionApiConsumer.id);
      expectToEqual(inMemoryUow.apiConsumerRepository.consumers, [
        updatedApiConsumer,
      ]);
    });

    it("401 - without auth", async () => {
      const response = await sharedRequest.saveApiConsumer({
        body: authorizedUnJeuneUneSolutionApiConsumer,
        headers: { authorization: "" },
      });

      expectResponseAndReturnJwt(response, {
        status: 401,
        body: { error: "forbidden: unauthenticated" },
      });
      expectToEqual(inMemoryUow.apiConsumerRepository.consumers, []);
    });

    it("401 - not with backOfficeJwt", async () => {
      const response = await sharedRequest.saveApiConsumer({
        body: authorizedUnJeuneUneSolutionApiConsumer,
        headers: { authorization: generateApiConsumerJwt({ id: "osef" }) },
      });

      expectResponseAndReturnJwt(response, {
        status: 401,
        body: { error: "Provided token is invalid" },
      });
      expectToEqual(inMemoryUow.apiConsumerRepository.consumers, []);
    });
  });
});

const expectResponseAndReturnJwt = <
  R extends ResponsesToHttpResponse<
    ApiConsumerRoutes["saveApiConsumer"]["responses"]
  >,
>(
  response: R,
  expected: R,
): ApiConsumerJwt | undefined => {
  expectToEqual(response, expected);

  if (response.status === 200) return response.body.jwt as ApiConsumerJwt;
};
