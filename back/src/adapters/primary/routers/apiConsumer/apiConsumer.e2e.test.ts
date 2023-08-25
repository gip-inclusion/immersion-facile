import { SuperTest, Test } from "supertest";
import {
  adminTargets,
  ApiConsumer,
  ApiConsumerJwt,
  apiConsumerTargets,
  BackOfficeJwt,
  expectToEqual,
  jwtSchema,
} from "shared";
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
  let request: SuperTest<Test>;
  let backOfficeJwt: BackOfficeJwt;
  let gateways: InMemoryGateways;
  let inMemoryUow: InMemoryUnitOfWork;
  let appConfig: AppConfig;
  let generateApiConsumerJwt: GenerateApiConsumerJwt;

  beforeEach(async () => {
    ({ request, gateways, inMemoryUow, appConfig, generateApiConsumerJwt } =
      await buildTestApp(
        new AppConfigBuilder()
          .withConfigParams({
            BACKOFFICE_USERNAME: "user",
            BACKOFFICE_PASSWORD: "pwd",
          })
          .build(),
      ));

    gateways.timeGateway.setNextDate(new Date());
    backOfficeJwt = (
      await request
        .post(adminTargets.login.url)
        .send({ user: "user", password: "pwd" })
    ).body;
  });

  describe(`${apiConsumerTargets.saveApiConsumer.method} ${apiConsumerTargets.saveApiConsumer.url}`, () => {
    it("200 - save new api consumer", async () => {
      const { body, status } = await request
        .post(apiConsumerTargets.saveApiConsumer.url)
        .set("authorization", backOfficeJwt)
        .send(authorizedUnJeuneUneSolutionApiConsumer);

      const { id } = makeVerifyJwtES256<"apiConsumer">(
        appConfig.apiJwtPublicKey,
      )(jwtSchema.parse(body).jwt as ApiConsumerJwt);

      expectToEqual(id, authorizedUnJeuneUneSolutionApiConsumer.id);
      expectToEqual(status, 200);
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

      const { body, status } = await request
        .post(apiConsumerTargets.saveApiConsumer.url)
        .set("authorization", backOfficeJwt)
        .send(updatedApiConsumer);

      const { id } = makeVerifyJwtES256<"apiConsumer">(
        appConfig.apiJwtPublicKey,
      )(jwtSchema.parse(body).jwt as ApiConsumerJwt);

      expectToEqual(id, authorizedUnJeuneUneSolutionApiConsumer.id);
      expectToEqual(status, 200);
      expectToEqual(inMemoryUow.apiConsumerRepository.consumers, [
        updatedApiConsumer,
      ]);
    });

    it("401 - without auth", async () => {
      const { body, status } = await request
        .post(apiConsumerTargets.saveApiConsumer.url)
        .send(authorizedUnJeuneUneSolutionApiConsumer);

      expectToEqual(body, { error: "forbidden: unauthenticated" });
      expectToEqual(status, 401);
      expectToEqual(inMemoryUow.apiConsumerRepository.consumers, []);
    });

    it("401 - not with backOfficeJwt", async () => {
      const { body, status } = await request
        .post(apiConsumerTargets.saveApiConsumer.url)
        .set("authorization", generateApiConsumerJwt({ id: "osef" }))
        .send(authorizedUnJeuneUneSolutionApiConsumer);

      expectToEqual(body, { error: "Provided token is invalid" });
      expectToEqual(status, 401);
      expectToEqual(inMemoryUow.apiConsumerRepository.consumers, []);
    });
  });
});
