import { AppConfig } from "../../../primary/config/appConfig";

import { HttpPassEmploiGateway } from "./HttpPassEmploiGateway";

describe("HttpPassEmploiGateway", () => {
  it("Should resolve promise when calling method notifyOnNewImmersionOfferCreatedFromForm", async () => {
    const config = AppConfig.createFromEnv();
    const gateway = new HttpPassEmploiGateway(
      config.passEmploiUrl,
      config.passEmploiKey,
    );

    await expect(
      gateway.notifyOnNewImmersionOfferCreatedFromForm({
        immersions: [
          {
            location: { lon: 1, lat: 1 },
            rome: "D1102",
            siret: "12345678901234",
          },
        ],
      }),
    ).resolves.not.toThrow();
  });
});
