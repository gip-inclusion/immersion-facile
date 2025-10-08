import MockAdapter from "axios-mock-adapter";
import {
  ConventionDtoBuilder,
  errors,
  expectPromiseToFailWithError,
  expectToEqual,
} from "shared";
import { createAxiosSharedClient } from "shared-routes/axios";
import {
  AppConfig,
  type FTAccessTokenConfig,
} from "../../../../config/bootstrap/appConfig";
import { createFtAxiosHttpClientForTest } from "../../../../config/helpers/createFtAxiosHttpClientForTest";
import { makeAxiosInstances } from "../../../../utils/axiosUtils";
import { withNoCache } from "../../../core/caching-gateway/adapters/withNoCache";
import { noRetries } from "../../../core/retry-strategy/ports/RetryStrategy";
import {
  type FranceTravailBroadcastResponse,
  type FranceTravailConvention,
  isBroadcastResponseOk,
} from "../../ports/FranceTravailGateway";
import { createFranceTravailRoutes } from "./FrancetTravailRoutes";
import { HttpFranceTravailGateway } from "./HttpFranceTravailGateway";

describe("HttpFranceTravailGateway", () => {
  const franceTravailRoutes = createFranceTravailRoutes({
    ftApiUrl: config.ftApiUrl,
    ftEnterpriseUrl: config.ftEnterpriseUrl,
  });

  describe("getAccessToken", () => {
    it("fails when client is not allowed", async () => {
      const httpFranceTravailGateway = new HttpFranceTravailGateway(
        createFtAxiosHttpClientForTest(config),
        withNoCache,
        config.ftApiUrl,
        {
          ...config.franceTravailAccessTokenConfig,
          clientSecret: "wrong-secret",
        },
        noRetries,
        franceTravailRoutes,
      );
      await expectPromiseToFailWithError(
        httpFranceTravailGateway.getAccessToken("api_referentielagencesv1"),
        new Error("[FT access token]: Client authentication failed"),
      );
    });

    it("fails when scope is not valid", async () => {
      const httpFranceTravailGateway = new HttpFranceTravailGateway(
        createFtAxiosHttpClientForTest(config),
        withNoCache,
        config.ftApiUrl,
        config.franceTravailAccessTokenConfig,
        noRetries,
        franceTravailRoutes,
      );
      await expectPromiseToFailWithError(
        httpFranceTravailGateway.getAccessToken("whatever"),
        new Error("[FT access token]: Invalid scope"),
      );
    });

    it("gets the token when all is good", async () => {
      const httpFranceTravailGateway = new HttpFranceTravailGateway(
        createFtAxiosHttpClientForTest(config),
        withNoCache,
        config.ftApiUrl,
        config.franceTravailAccessTokenConfig,
        noRetries,
        franceTravailRoutes,
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
        createFtAxiosHttpClientForTest(config),
        withNoCache,
        config.ftApiUrl,
        config.franceTravailAccessTokenConfig,
        noRetries,
        franceTravailRoutes,
      );

      const response =
        await httpFranceTravailGateway.notifyOnConventionUpdatedLegacy({
          ...ftConvention,
          ...fields,
        });

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
        createFtAxiosHttpClientForTest(config),
        withNoCache,
        config.ftApiUrl,
        config.franceTravailAccessTokenConfig,
        noRetries,
        franceTravailRoutes,
      );

      const response =
        await httpFranceTravailGateway.notifyOnConventionUpdatedLegacy({
          ...ftConvention,
          ...fields,
        });

      if (!isBroadcastResponseOk(expected))
        throw errors.generic.testError("Should not occurs");
      expectToEqual(response, expected);
    },
  );

  it("error feedback axios timeout", async () => {
    const axiosInstance = makeAxiosInstances(
      config.externalAxiosTimeout,
    ).axiosWithValidateStatus;
    const httpClient = createAxiosSharedClient(
      ftRoutesWithFakeUrls,
      axiosInstance,
      {
        skipResponseValidation: true,
      },
    );

    const accessTokenConfig: FTAccessTokenConfig = {
      immersionFacileBaseUrl: "https://",
      ftApiUrl: fakeFtApiUrl,
      ftAuthCandidatUrl: "https://",
      ftEnterpriseUrl: fakeFtEnterpriseUrl,
      clientId: "",
      clientSecret: "",
    };

    const franceTravailGateway = new HttpFranceTravailGateway(
      httpClient,
      withNoCache,
      fakeFtApiUrl,
      accessTokenConfig,
      noRetries,
      franceTravailRoutes,
    );

    const mock = new MockAdapter(axiosInstance);

    mock
      .onPost(
        `${fakeFtEnterpriseUrl}/connexion/oauth2/access_token?realm=%2Fpartenaire`,
      )
      .reply(200, { access_token: "yolo" })
      .onPost(ftRoutesWithFakeUrls.broadcastLegacyConvention.url)
      .timeout();

    const response =
      await franceTravailGateway.notifyOnConventionUpdatedLegacy(ftConvention);

    if (isBroadcastResponseOk(response))
      throw errors.generic.testError("PE broadcast OK must not occurs");

    const { status, subscriberErrorFeedback } = response;
    expectToEqual(status, 500);
    expectToEqual(subscriberErrorFeedback.message, "timeout of 0ms exceeded");
    expect(subscriberErrorFeedback.error).toBeDefined();
  });

  it("error feedback on bad response code", async () => {
    const { axiosWithoutValidateStatus } = makeAxiosInstances(
      config.externalAxiosTimeout,
    );
    const httpClient = createAxiosSharedClient(
      ftRoutesWithFakeUrls,
      axiosWithoutValidateStatus,
      {
        skipResponseValidation: true,
      },
    );

    const accessTokenConfig: FTAccessTokenConfig = {
      immersionFacileBaseUrl: "https://",
      ftApiUrl: fakeFtApiUrl,
      ftAuthCandidatUrl: "https://",
      ftEnterpriseUrl: fakeFtEnterpriseUrl,
      clientId: "",
      clientSecret: "",
    };

    const franceTravailGateway = new HttpFranceTravailGateway(
      httpClient,
      withNoCache,
      fakeFtApiUrl,
      accessTokenConfig,
      noRetries,
      franceTravailRoutes,
    );

    const mock = new MockAdapter(axiosWithoutValidateStatus);

    mock
      .onPost(
        `${fakeFtEnterpriseUrl}/connexion/oauth2/access_token?realm=%2Fpartenaire`,
      )
      .reply(200, { access_token: "yolo" })
      .onPost(ftRoutesWithFakeUrls.broadcastLegacyConvention.url)
      .reply(204, { message: "yolo" });

    const response =
      await franceTravailGateway.notifyOnConventionUpdatedLegacy(ftConvention);

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

  it("send convention to FT api V3", async () => {
    const httpFranceTravailGateway = new HttpFranceTravailGateway(
      createFtAxiosHttpClientForTest(config),
      withNoCache,
      config.ftApiUrl,
      config.franceTravailAccessTokenConfig,
      noRetries,
      franceTravailRoutes,
    );

    const response = await httpFranceTravailGateway.notifyOnConventionUpdated({
      eventType: "CONVENTION_UPDATED",
      convention: {
        ...new ConventionDtoBuilder().build(),
        agencyName: ftConvention.nomAgence,
        agencyDepartment: "75",
        agencyKind: "pole-emploi",
        agencySiret: "00000000000000",
        agencyCounsellorEmails: [],
        agencyValidatorEmails: ["validator@mail.com"],
        agencyRefersTo: undefined,
      },
    });

    expect(response.status).toBe(200);
  });
});

const config = AppConfig.createFromEnv();

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

const fakeFtApiUrl = "https://fake-ft.fr";
const fakeFtEnterpriseUrl = "https://fake-ft-enterprise.fr";
const ftRoutesWithFakeUrls = createFranceTravailRoutes({
  ftApiUrl: fakeFtApiUrl,
  ftEnterpriseUrl: fakeFtEnterpriseUrl,
});
