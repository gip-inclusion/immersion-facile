import { expectObjectsToMatch } from "shared";
import { AppConfig } from "../../../../config/bootstrap/appConfig";

import axios from "axios";
import { createAxiosSharedClient } from "shared-routes/axios";
import { InMemoryCachingGateway } from "../../caching-gateway/adapters/InMemoryCachingGateway";
import { RealTimeGateway } from "../../time-gateway/adapters/RealTimeGateway";
import {
  DiagorienteAppellationsGateway,
  requestMinTime,
} from "./DiagorienteAppellationsGateway";
import {
  DiagorienteAccessTokenResponse,
  diagorienteAppellationsRoutes,
  diagorienteTokenScope,
} from "./DiagorienteAppellationsGateway.routes";

const cachingGateway =
  new InMemoryCachingGateway<DiagorienteAccessTokenResponse>(
    new RealTimeGateway(),
    diagorienteTokenScope,
  );

describe("DiagorienteAppellationsGateway", () => {
  let appellationsGateway: DiagorienteAppellationsGateway;

  beforeEach(() => {
    const config = AppConfig.createFromEnv();
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

  it("should retrieve stored token, not requesting another", async () => {
    const { access_token: originalToken } =
      await appellationsGateway.getAccessToken();
    const { access_token: newToken } =
      await appellationsGateway.getAccessToken();
    expect(originalToken).toEqual(newToken);
  });

  const parallelCalls = 100;
  it.each([
    {
      search: "Dév",
      results: [
        {
          appellationLabel: "Nez",
          appellationCode: "16989",
        },
        {
          appellationLabel: "Dee-jay",
          appellationCode: "13916",
        },
        {
          appellationLabel: "Délaineur / Délaineuse",
          appellationCode: "13923",
        },
        {
          appellationLabel: "Déligneur / Déligneuse",
          appellationCode: "13945",
        },
        {
          appellationLabel: "Déménageur / Déménageuse",
          appellationCode: "13947",
        },
      ],
    },
    {
      search: "ux",
      results: [
        {
          appellationLabel: "Mareyeur / Mareyeuse",
          appellationCode: "16391",
        },
        {
          appellationLabel: "Élagueur / Élagueuse",
          appellationCode: "14608",
        },
        {
          appellationLabel: "Scieur / Scieuse",
          appellationCode: "19323",
        },
        {
          appellationLabel: "Liégeur / Liégeuse",
          appellationCode: "16185",
        },
        {
          appellationLabel: "Licier / Licière",
          appellationCode: "16183",
        },
      ],
    },
    {
      search: "Secrétaire",
      results: [
        {
          appellationLabel: "Secrétaire",
          appellationCode: "19364",
        },
        {
          appellationLabel: "Secrétaire bureautique",
          appellationCode: "19368",
        },
        {
          appellationLabel: "Secrétaire généraliste",
          appellationCode: "19395",
        },
        {
          appellationLabel: "Secrétaire administratif / administrative",
          appellationCode: "19365",
        },
        {
          appellationLabel: "Secrétaire juridique",
          appellationCode: "19396",
        },
      ],
    },
  ])(
    `returns matching results for ${parallelCalls} parralel query with term $search`,
    async ({ results, search }) => {
      await Promise.all(
        [...Array(parallelCalls)].map(async (_) => {
          expectObjectsToMatch(
            await appellationsGateway.searchAppellations(search),
            results,
          );
        }),
      );
    },
    parallelCalls * requestMinTime * 10,
  );
});
