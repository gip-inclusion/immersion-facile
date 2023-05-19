import { expectToEqual } from "shared";
import {
  PoleEmploiBroadcastResponse,
  PoleEmploiConvention,
} from "../../../../domain/convention/ports/PoleEmploiGateway";
import { noRateLimit } from "../../../../domain/core/ports/RateLimiter";
import { noRetries } from "../../../../domain/core/ports/RetryStrategy";
import { AppConfig } from "../../../primary/config/appConfig";
import { configureCreateHttpClientForExternalApi } from "../../../primary/config/createHttpClientForExternalApi";
import { PoleEmploiAccessTokenGateway } from "../PoleEmploiAccessTokenGateway";
import { HttpPoleEmploiGateway } from "./HttpPoleEmploiGateway";
import { createPoleEmploiTargets } from "./PoleEmploi.targets";

const config = AppConfig.createFromEnv();
const accessTokenGateway = new PoleEmploiAccessTokenGateway(
  config.poleEmploiAccessTokenConfig,
  noRateLimit,
  noRetries,
);

const getAPI = () => {
  const httpClient = configureCreateHttpClientForExternalApi()(
    createPoleEmploiTargets(config.peApiUrl),
  );
  return new HttpPoleEmploiGateway(
    httpClient,
    config.peApiUrl,
    accessTokenGateway,
  );
};

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
  nomPrenomFonctionTuteur: "John Doe Directeur d'agence",
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
};

type TestCase = {
  fields: Partial<
    Pick<PoleEmploiConvention, "id" | "email" | "dateNaissance" | "peConnectId">
  >;
  expected: PoleEmploiBroadcastResponse;
  testMessage?: string;
};

const cases: TestCase[] = [
  {
    testMessage: "the email and dateNaissance are known to be valid for PE",
    fields: {
      id: "30000000002",
      email: "8166843978@PE-TEST.FR",
      dateNaissance: "1994-10-22T00:00:00",
      peConnectId: undefined,
    },
    expected: { status: 200 }, // careful, if id is new, it will be 201
  },
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
      message:
        "Identifiant National DE trouvé mais écart sur la date de naissance",
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
      message: "Identifiant National DE non trouvé",
    },
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
    },
  },
];

describe("HttpPoleEmploiGateway", () => {
  it.each(cases)(
    "Should have status $expected.status when $testMessage",
    async ({ fields, expected }) => {
      const api = getAPI();

      const response = await api.notifyOnConventionUpdated({
        ...peConvention,
        ...fields,
      });

      expectToEqual(response.status, expected.status);
      expect((response as any).message).toBe((expected as any).message);
    },
  );
});
