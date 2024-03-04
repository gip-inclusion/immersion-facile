import { expectObjectsToMatch } from "shared";
import { AppConfig } from "../../../../config/bootstrap/appConfig";

import axios from "axios";
import { createAxiosSharedClient } from "shared-routes/axios";
import { InMemoryCachingGateway } from "../../caching-gateway/adapters/InMemoryCachingGateway";
import { RealTimeGateway } from "../../time-gateway/adapters/RealTimeGateway";
import { AppellationsGateway } from "../ports/AppellationsGateway";
import {
  DiagorienteAccessTokenResponse,
  DiagorienteAppellationsGateway,
  diagorienteTokenScope,
} from "./DiagorienteAppellationsGateway";
import { diagorienteAppellationsRoutes } from "./DiagorienteAppellationsGateway.routes";

const cachingGateway =
  new InMemoryCachingGateway<DiagorienteAccessTokenResponse>(
    new RealTimeGateway(),
    diagorienteTokenScope,
  );

describe("DiagorienteAppellationsGateway", () => {
  let appellationsGateway: AppellationsGateway;
  const config = AppConfig.createFromEnv();
  beforeEach(() => {
    appellationsGateway = new DiagorienteAppellationsGateway(
      createAxiosSharedClient(diagorienteAppellationsRoutes, axios),
      cachingGateway,
      {
        clientId: config.diagorienteApiClientId,
        clientSecret: config.diagorienteApiClientSecret,
      },
    );
  });

  it("returns an access token with client ID and secret", async () => {
    const response = await appellationsGateway.getAccessToken();
    expect(response).toMatchObject({
      access_token: expect.any(String),
      expires_in: expect.any(Number),
      token_type: "Bearer",
    });
  });
  it("returns matching results for query", async () => {
    const response = await appellationsGateway.searchAppellations("Dév");
    expectObjectsToMatch(response, [
      {
        appellationLabel: "Technicien / Technicienne informatique",
        appellationCode: "20168",
        romeCode: "M1810",
        romeLabel: "M1810",
      },
      {
        appellationLabel: "Responsable qualité web",
        appellationCode: "38832",
        romeCode: "M1802",
        romeLabel: "M1802",
      },
      {
        appellationLabel: "Technicien / Technicienne en communication",
        appellationCode: "20044",
        romeCode: "M1807",
        romeLabel: "M1807",
      },
      {
        appellationLabel: "Opérateur / Opératrice informatique",
        appellationCode: "17238",
        romeCode: "M1810",
        romeLabel: "M1810",
      },
      {
        appellationLabel: "Responsable sécurité informatique",
        appellationCode: "19180",
        romeCode: "M1802",
        romeLabel: "M1802",
      },
    ]);
  });
});
