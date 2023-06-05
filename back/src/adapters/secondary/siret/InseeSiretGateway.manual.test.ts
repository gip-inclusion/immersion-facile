import { expectObjectsToMatch } from "shared";
import { noRetries } from "../../../domain/core/ports/RetryStrategy";
import { SiretGateway } from "../../../domain/sirene/ports/SirenGateway";
import { AppConfig } from "../../primary/config/appConfig";
import { RealTimeGateway } from "../core/TimeGateway/RealTimeGateway";
import { InseeSiretGateway } from "./InseeSiretGateway";

// These tests are not hermetic and not meant for automated testing. They will make requests to the
// real SIRENE API, use up production quota, and fail for uncontrollable reasons such as quota
// errors.
//
// Requires the following environment variables to be set for the tests to pass:
// - SIRENE_ENDPOINT
// - SIRENE_BEARER_TOKEN
describe("HttpSirenGateway", () => {
  let siretGateway: SiretGateway;

  beforeEach(() => {
    const config = AppConfig.createFromEnv();
    siretGateway = new InseeSiretGateway(
      config.inseeHttpConfig,
      new RealTimeGateway(),
      noRetries,
    );
  });

  it("returns open establishments", async () => {
    // ETABLISSEMENT PUBLIC DU MUSEE DU LOUVRE (should be active)
    const response = await siretGateway.getEstablishmentBySiret(
      "18004623700012",
    );
    expectObjectsToMatch(response, { siret: "18004623700012" });
  });

  it("filters out closed establishments", async () => {
    // SOCIETE TEXTILE D'HENIN LIETARD, closed in 1966.
    const response = await siretGateway.getEstablishmentBySiret(
      "38961161700017",
    );
    expect(response).toBeUndefined();
  });
});
