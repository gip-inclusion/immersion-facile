import { AppConfig } from "../../adapters/primary/appConfig";

const createAppConfig = (configParams: any): AppConfig =>
  AppConfig.createFromEnv(/* readDotEnv= */ false, configParams);

describe("appConfig", () => {
  it("quarantinedTopics", () => {
    expect(createAppConfig({}).quarantinedTopics).toEqual([]);
    expect(
      createAppConfig({ QUARANTINED_TOPICS: "" }).quarantinedTopics,
    ).toEqual([]);
    expect(
      createAppConfig({ QUARANTINED_TOPICS: ",,," }).quarantinedTopics,
    ).toEqual([]);
    expect(
      createAppConfig({
        QUARANTINED_TOPICS:
          "ImmersionApplicationRejected,FormEstablishmentAdded",
      }).quarantinedTopics,
    ).toEqual(["ImmersionApplicationRejected", "FormEstablishmentAdded"]);
  });
});
