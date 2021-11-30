import { AppConfig } from "../../adapters/primary/appConfig";
import { RealClock } from "../../adapters/secondary/core/ClockImplementations";
import { HttpsSireneRepository } from "./../../adapters/secondary/HttpsSireneRepository";
import { SireneRepository } from "./../../domain/sirene/ports/SireneRepository";

// These tests are not hermetic and not meant for automated testing. They will make requests to the
// real SIRENE API, use up production quota, and fail for uncontrollable reasons such as quota
// errors.
//
// Requires the following environment variables to be set for the tests to pass:
// - SIRENE_ENDPOINT
// - SIRENE_BEARER_TOKEN
describe("HttpsSireneRepository", () => {
  let sireneRepository: SireneRepository;

  beforeEach(() => {
    const config = AppConfig.createFromEnv();
    sireneRepository = new HttpsSireneRepository(
      config.sireneHttpsConfig,
      new RealClock(),
    );
  });

  test("returns open establishments", async () => {
    // ETABLISSEMENT PUBLIC DU MUSEE DU LOUVRE (should be active)
    const response = await sireneRepository.get("18004623700012");
    expect(response?.etablissements).toHaveLength(1);
  });

  test("filters out closed establishments", async () => {
    // SOCIETE TEXTILE D'HENIN LIETARD, closed in 1966.
    const response = await sireneRepository.get("38961161700017");
    expect(response).toBeUndefined();
  });
});
