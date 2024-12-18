import axios from "axios";
import MockAdapter from "axios-mock-adapter";
import { expectToEqual } from "shared";
import { createAxiosSharedClient } from "shared-routes/axios";
import {
  AccessTokenConfig,
  AccessTokenResponse,
  AppConfig,
} from "../../../../config/bootstrap/appConfig";
import { createPeAxiosSharedClient } from "../../../../config/helpers/createAxiosSharedClients";
import { InMemoryCachingGateway } from "../../../core/caching-gateway/adapters/InMemoryCachingGateway";
import { noRetries } from "../../../core/retry-strategy/ports/RetryStrategy";
import { RealTimeGateway } from "../../../core/time-gateway/adapters/RealTimeGateway";
import {
  PoleEmploiBroadcastResponse,
  PoleEmploiConvention,
  isBroadcastResponseOk,
} from "../../ports/PoleEmploiGateway";
import { HttpPoleEmploiGateway } from "./HttpPoleEmploiGateway";
import { createPoleEmploiRoutes } from "./PoleEmploiRoutes";

describe("HttpPoleEmploiGateway", () => {
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
      const httpPoleEmploiGateway = new HttpPoleEmploiGateway(
        createPeAxiosSharedClient(config),
        cachingGateway,
        config.peApiUrl,
        config.poleEmploiAccessTokenConfig,
        noRetries,
      );

      const response = await httpPoleEmploiGateway.notifyOnConventionUpdated({
        ...peConvention,
        ...fields,
      });

      if (isBroadcastResponseOk(response) || isBroadcastResponseOk(expected))
        throw new Error("Should not occurs");

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
      expected: { status: 200, body: { success: true } }, // careful, if id is new, it will be 201
    },
    {
      testMessage: "data is not known but there is a peConnectId",
      fields: {
        id: "30000000001",
        email: "not-existing@mail.com",
        dateNaissance: "2000-10-22T00:00:00",
        peConnectId: "aaaa66c2-42c0-4359-bf5d-137faaaaaaaa",
      },
      expected: {
        status: 200,
        body: { success: true },
      },
    },
  ] satisfies TestCase[])(
    "Should have status $expected.status when $testMessage",
    async ({ fields, expected }) => {
      const httpPoleEmploiGateway = new HttpPoleEmploiGateway(
        createPeAxiosSharedClient(config),
        cachingGateway,
        config.peApiUrl,
        config.poleEmploiAccessTokenConfig,
        noRetries,
      );

      const response = await httpPoleEmploiGateway.notifyOnConventionUpdated({
        ...peConvention,
        ...fields,
      });

      if (!isBroadcastResponseOk(expected))
        throw new Error("Should not occurs");
      expectToEqual(response, expected);
    },
  );

  it("error feedback axios timeout", async () => {
    const peApiUrl = "https://fake-pe.fr";
    const peEnterpriseUrl = "https://fake-pe-enterprise.fr";
    const routes = createPoleEmploiRoutes(peApiUrl);

    const httpClient = createAxiosSharedClient(routes, axios, {
      skipResponseValidation: true,
    });

    const cachingGateway = new InMemoryCachingGateway<AccessTokenResponse>(
      new RealTimeGateway(),
      "expires_in",
    );

    const accessTokenConfig: AccessTokenConfig = {
      immersionFacileBaseUrl: "https://",
      peApiUrl,
      peAuthCandidatUrl: "https://",
      peEnterpriseUrl,
      clientId: "",
      clientSecret: "",
    };

    const poleEmploiGateway = new HttpPoleEmploiGateway(
      httpClient,
      cachingGateway,
      peApiUrl,
      accessTokenConfig,
      noRetries,
    );

    const mock = new MockAdapter(axios);

    mock
      .onPost(
        `${peEnterpriseUrl}/connexion/oauth2/access_token?realm=%2Fpartenaire`,
      )
      .reply(200, { access_token: "yolo" })
      .onPost(routes.broadcastConvention.url)
      .timeout();

    const response =
      await poleEmploiGateway.notifyOnConventionUpdated(peConvention);

    if (isBroadcastResponseOk(response))
      throw new Error("PE broadcast OK must not occurs");

    const { status, subscriberErrorFeedback } = response;
    expectToEqual(status, 500);
    expectToEqual(subscriberErrorFeedback.message, "timeout of 0ms exceeded");
    expect(subscriberErrorFeedback.error).toBeDefined();
  });

  it("error feedback on bad response code", async () => {
    const peApiUrl = "https://fake-pe.fr";
    const peEnterpriseUrl = "https://fake-pe-enterprise.fr";
    const routes = createPoleEmploiRoutes(peApiUrl);

    const httpClient = createAxiosSharedClient(routes, axios, {
      skipResponseValidation: true,
    });

    const cachingGateway = new InMemoryCachingGateway<AccessTokenResponse>(
      new RealTimeGateway(),
      "expires_in",
    );

    const accessTokenConfig: AccessTokenConfig = {
      immersionFacileBaseUrl: "https://",
      peApiUrl,
      peAuthCandidatUrl: "https://",
      peEnterpriseUrl,
      clientId: "",
      clientSecret: "",
    };

    const poleEmploiGateway = new HttpPoleEmploiGateway(
      httpClient,
      cachingGateway,
      peApiUrl,
      accessTokenConfig,
      noRetries,
    );

    const mock = new MockAdapter(axios);

    mock
      .onPost(
        `${peEnterpriseUrl}/connexion/oauth2/access_token?realm=%2Fpartenaire`,
      )
      .reply(200, { access_token: "yolo" })
      .onPost(routes.broadcastConvention.url)
      .reply(204, { message: "yolo" });

    const response =
      await poleEmploiGateway.notifyOnConventionUpdated(peConvention);

    if (isBroadcastResponseOk(response))
      throw new Error("PE broadcast OK must not occurs");

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
const cachingGateway = new InMemoryCachingGateway<AccessTokenResponse>(
  new RealTimeGateway(),
  "expires_in",
);

const peConvention: PoleEmploiConvention = {
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
    Pick<PoleEmploiConvention, "id" | "email" | "dateNaissance" | "peConnectId">
  >;
  expected: PoleEmploiBroadcastResponse;
  testMessage?: string;
};
