import axios from "axios";
import { GetAccessTokenResponse } from "../../../../domain/convention/ports/PoleEmploiGateway";
import { noRetries } from "../../../../domain/core/ports/RetryStrategy";
import { AppConfig } from "../../../primary/config/appConfig";
import { configureCreateHttpClientForExternalApi } from "../../../primary/config/createHttpClientForExternalApi";
import { InMemoryCachingGateway } from "../../core/InMemoryCachingGateway";
import { RealTimeGateway } from "../../core/TimeGateway/RealTimeGateway";
import { HttpPoleEmploiGateway } from "../../poleEmploi/HttpPoleEmploiGateway";
import { createPoleEmploiTargets } from "../../poleEmploi/PoleEmploi.targets";
import { HttpPeAgenciesReferential } from "./HttpPeAgenciesReferential";

const config = AppConfig.createFromEnv();

const referencielAgencesPE = new HttpPeAgenciesReferential(
  config.peApiUrl,
  new HttpPoleEmploiGateway(
    configureCreateHttpClientForExternalApi(
      axios.create({ timeout: config.externalAxiosTimeout }),
    )(createPoleEmploiTargets(config.peApiUrl)),
    new InMemoryCachingGateway<GetAccessTokenResponse>(
      new RealTimeGateway(),
      "expires_in",
    ),
    config.peApiUrl,
    config.poleEmploiAccessTokenConfig,
    noRetries,
  ),
  config.poleEmploiClientId,
);

describe("HttpReferencielAgencesPe", () => {
  it("Should return PE agencies", async () => {
    const a = await referencielAgencesPE.getPeAgencies();
    expect(a.length).toBeGreaterThan(10);
  });
});
