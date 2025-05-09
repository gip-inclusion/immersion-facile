import axios from "axios";
import MockAdapter from "axios-mock-adapter";
import { errors, expectPromiseToFailWithError, expectToEqual } from "shared";
import { createAxiosSharedClient } from "shared-routes/axios";
import {
  type AccessTokenResponse,
  AppConfig,
  type FTAccessTokenConfig,
} from "../../../../config/bootstrap/appConfig";
import { createFtAxiosSharedClient } from "../../../../config/helpers/createAxiosSharedClients";
import { InMemoryCachingGateway } from "../../../core/caching-gateway/adapters/InMemoryCachingGateway";
import { noRetries } from "../../../core/retry-strategy/ports/RetryStrategy";
import { RealTimeGateway } from "../../../core/time-gateway/adapters/RealTimeGateway";
import {
  type FranceTravailBroadcastResponse,
  type FranceTravailConvention,
  isBroadcastResponseOk,
} from "../../ports/FranceTravailGateway";
import { createFranceTravailRoutes } from "./FrancetTravailRoutes";
import { HttpFranceTravailGateway } from "./HttpFranceTravailGateway";

describe("HttpFranceTravailGateway", () => {
  describe("getAccessToken", () => {
    it("fails when client is not allowed", async () => {
      const httpFranceTravailGateway = new HttpFranceTravailGateway(
        createFtAxiosSharedClient(config),
        createCachingGateway(),
        config.ftApiUrl,
        {
          ...config.franceTravailAccessTokenConfig,
          clientSecret: "wrong-secret",
        },
        noRetries,
      );
      await expectPromiseToFailWithError(
        httpFranceTravailGateway.getAccessToken("api_referentielagencesv1"),
        new Error("[FT access token]: Client authentication failed"),
      );
    });

    it("fails when scope is not valid", async () => {
      const httpFranceTravailGateway = new HttpFranceTravailGateway(
        createFtAxiosSharedClient(config),
        cachingGateway,
        config.ftApiUrl,
        config.franceTravailAccessTokenConfig,
        noRetries,
      );
      await expectPromiseToFailWithError(
        httpFranceTravailGateway.getAccessToken("whatever"),
        new Error("[FT access token]: Invalid scope"),
      );
    });

    it("gets the token when all is good", async () => {
      const httpFranceTravailGateway = new HttpFranceTravailGateway(
        createFtAxiosSharedClient(config),
        cachingGateway,
        config.ftApiUrl,
        config.franceTravailAccessTokenConfig,
        noRetries,
      );
      const result = await httpFranceTravailGateway.getAccessToken(
        "api_referentielagencesv1",
      );
      expectToEqual(result, {
        access_token: expect.any(String),
        expires_in: expect.any(Number),
        scope: "api_referentielagencesv1",
        token_type: "Bearer",
      });
    });
  });

  it.each([
    {
      testMessage: "the email exists in PE but the dateNaissance is wrong",
      fields: {
        id: "30000000003",
        email: "8166843978@PE-TEST.FR",
        dateNaissance: "2000-10-22T00:00:00",
        peConnectId: undefined,
      },
      expected: {
        status: 404,
        subscriberErrorFeedback: {
          message:
            "Identifiant National DE trouvé mais écart sur la date de naissance",
        },
        body: {},
      },
    },
    {
      testMessage: "the email does not exists in PE",
      fields: {
        id: "30000000010",
        email: "not-existing@mail.com",
        dateNaissance: "2000-10-22T00:00:00",
        peConnectId: undefined,
      },
      expected: {
        status: 404,
        subscriberErrorFeedback: {
          message: '"Identifiant National DE non trouvé"',
        },
        body: {},
      },
    },
  ] satisfies TestCase[])(
    "Should have status $expected.status when $testMessage",
    async ({ fields, expected }) => {
      const httpFranceTravailGateway = new HttpFranceTravailGateway(
        createFtAxiosSharedClient(config),
        cachingGateway,
        config.ftApiUrl,
        config.franceTravailAccessTokenConfig,
        noRetries,
      );

      const response = await httpFranceTravailGateway.notifyOnConventionUpdated(
        {
          ...ftConvention,
          ...fields,
        },
      );

      if (isBroadcastResponseOk(response) || isBroadcastResponseOk(expected))
        throw errors.generic.testError(
          `Should not occurs : response status was ${response.status}`,
        );

      const { status, subscriberErrorFeedback } = response;
      expectToEqual(status, expected.status);
      expectToEqual(
        subscriberErrorFeedback.message,
        expected.subscriberErrorFeedback.message,
      );
      expect(subscriberErrorFeedback.error).toBeDefined();
    },
  );

  it.each([
    {
      testMessage: "the email and dateNaissance are known to be valid for PE",
      fields: {
        id: "30000000002",
        email: "8166843978@PE-TEST.FR",
        dateNaissance: "1994-10-22T00:00:00",
        peConnectId: undefined,
      },
      expected: { status: 200, body: "" }, // careful, if id is new, it will be 201
    },
    {
      testMessage: "data is not known but there is a peConnectId",
      fields: {
        id: "30000000001",
        email: "not-existing@mail.com",
        dateNaissance: "2000-10-22T00:00:00",
        peConnectId: "aaaa66c2-42c0-4359-bf5d-137faaaaaaaa",
      },
      expected: { status: 200, body: "" },
    },
  ] satisfies TestCase[])(
    "Should have status $expected.status when $testMessage",
    async ({ fields, expected }) => {
      const httpFranceTravailGateway = new HttpFranceTravailGateway(
        createFtAxiosSharedClient(config),
        cachingGateway,
        config.ftApiUrl,
        config.franceTravailAccessTokenConfig,
        noRetries,
      );

      const response = await httpFranceTravailGateway.notifyOnConventionUpdated(
        {
          ...ftConvention,
          ...fields,
        },
      );

      if (!isBroadcastResponseOk(expected))
        throw errors.generic.testError("Should not occurs");
      expectToEqual(response, expected);
    },
  );

  it("error feedback axios timeout", async () => {
    const ftApiUrl = "https://fake-ft.fr";
    const ftEnterpriseUrl = "https://fake-ft-enterprise.fr";
    const routes = createFranceTravailRoutes({ ftApiUrl, ftEnterpriseUrl });
    const axiosInstance = axios.create({ validateStatus: () => true });
    const httpClient = createAxiosSharedClient(routes, axiosInstance, {
      skipResponseValidation: true,
    });

    const cachingGateway = new InMemoryCachingGateway<AccessTokenResponse>(
      new RealTimeGateway(),
      "expires_in",
    );

    const accessTokenConfig: FTAccessTokenConfig = {
      immersionFacileBaseUrl: "https://",
      ftApiUrl,
      ftAuthCandidatUrl: "https://",
      ftEnterpriseUrl,
      clientId: "",
      clientSecret: "",
    };

    const franceTravailGateway = new HttpFranceTravailGateway(
      httpClient,
      cachingGateway,
      ftApiUrl,
      accessTokenConfig,
      noRetries,
    );

    const mock = new MockAdapter(axiosInstance);

    mock
      .onPost(
        `${ftEnterpriseUrl}/connexion/oauth2/access_token?realm=%2Fpartenaire`,
      )
      .reply(200, { access_token: "yolo" })
      .onPost(routes.broadcastConvention.url)
      .timeout();

    const response =
      await franceTravailGateway.notifyOnConventionUpdated(ftConvention);

    if (isBroadcastResponseOk(response))
      throw errors.generic.testError("PE broadcast OK must not occurs");

    const { status, subscriberErrorFeedback } = response;
    expectToEqual(status, 500);
    expectToEqual(subscriberErrorFeedback.message, "timeout of 0ms exceeded");
    expect(subscriberErrorFeedback.error).toBeDefined();
  });

  it("error feedback on bad response code", async () => {
    const ftApiUrl = "https://fake-ft.fr";
    const ftEnterpriseUrl = "https://fake-ft-enterprise.fr";
    const routes = createFranceTravailRoutes({ ftApiUrl, ftEnterpriseUrl });

    const httpClient = createAxiosSharedClient(routes, axios, {
      skipResponseValidation: true,
    });

    const cachingGateway = new InMemoryCachingGateway<AccessTokenResponse>(
      new RealTimeGateway(),
      "expires_in",
    );

    const accessTokenConfig: FTAccessTokenConfig = {
      immersionFacileBaseUrl: "https://",
      ftApiUrl: ftApiUrl,
      ftAuthCandidatUrl: "https://",
      ftEnterpriseUrl: ftEnterpriseUrl,
      clientId: "",
      clientSecret: "",
    };

    const franceTravailGateway = new HttpFranceTravailGateway(
      httpClient,
      cachingGateway,
      ftApiUrl,
      accessTokenConfig,
      noRetries,
    );

    const mock = new MockAdapter(axios);

    mock
      .onPost(
        `${ftEnterpriseUrl}/connexion/oauth2/access_token?realm=%2Fpartenaire`,
      )
      .reply(200, { access_token: "yolo" })
      .onPost(routes.broadcastConvention.url)
      .reply(204, { message: "yolo" });

    const response =
      await franceTravailGateway.notifyOnConventionUpdated(ftConvention);

    if (isBroadcastResponseOk(response))
      throw errors.generic.testError(
        `PE broadcast OK must not occurs, response status was : ${response.status}`,
      );

    const { status, subscriberErrorFeedback } = response;
    expectToEqual(status, 500);
    expectToEqual(
      subscriberErrorFeedback.message,
      'Not an axios error: Unsupported response status 204 with body \'{"message":"yolo"}\'',
    );
    expect(subscriberErrorFeedback.error).toBeDefined();
  });
});

const config = AppConfig.createFromEnv();
const createCachingGateway = () =>
  new InMemoryCachingGateway<AccessTokenResponse>(
    new RealTimeGateway(),
    "expires_in",
  );
const cachingGateway = createCachingGateway();

const ftConvention: FranceTravailConvention = {
  activitesObservees: "Tenir une conversation client",
  originalId: "31bd445d-54fa-4b53-8875-0ada1673fe3c",
  adresseImmersion: "5 avenue du Général",
  codeAppellation: "123456",
  codeRome: "A1234",
  competencesObservees: "apprentisage du métier, ponctualité, rigueur",
  dateDebut: "2022-04-01T12:00:00",
  dateDemande: "2022-04-01T12:00:00",
  dateFin: "2022-06-01T12:00:00",
  dateNaissance: "1994-10-22T00:00:00",
  descriptionPreventionSanitaire: "",
  dureeImmersion: 80.5,
  // email: "8166843978@PE-TEST.FR",
  email: "beneficiary@machin.com",
  emailTuteur: "john.doe.123@disney.com",
  id: "30000000002",
  nom: "Profite",
  nomPrenomFonctionTuteur: "John Doe",
  objectifDeImmersion: 1,
  // peConnectId: "d4de66c2-42c0-4359-bf5d-137fc428355b",
  prenom: "Jean",
  preventionSanitaire: true,
  protectionIndividuelle: false,
  raisonSociale: "Jardin Mediansou",
  signatureBeneficiaire: true,
  signatureEntreprise: true,
  siret: "49840645800012",
  statut: "DEMANDE_VALIDÉE",
  telephone: "0611335577",
  telephoneTuteur: "0622446688",
  typeAgence: "france-travail",
  nomAgence: "Agence de test",
  prenomValidateurRenseigne: "prénom du valideur",
  nomValidateurRenseigne: "nom du valideur",
  rqth: "N",
  prenomTuteur: "John",
  nomTuteur: "Doe",
  fonctionTuteur: "Directeur d'agence",
};

type TestCase = {
  fields: Partial<
    Pick<
      FranceTravailConvention,
      "id" | "email" | "dateNaissance" | "peConnectId"
    >
  >;
  expected: FranceTravailBroadcastResponse;
  testMessage?: string;
};
