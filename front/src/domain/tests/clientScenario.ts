import { InMemoryEstablishmentUiGateway } from "src/infra/gateway/EstablishmentUiGateway.ts/InMemoryEstablishmentUiGaetway";
import {
  ClientTestApplication,
  ClientTestApplicationProperties,
} from "../../infra/application/ClientApplication";
import { InMemoryEventGateway } from "../../infra/gateway/EventGateway/InMemoryEventGateway";
import { InMemoryEstablishmentGateway } from "../../core-logic/adapters/InMemoryEstablishmentGateway";
import { ApplicationPrimaryController } from "../../core-logic/ports/primaryController/ApplicationPrimaryController";
import { InMemoryImmersionApplicationGateway } from "src/core-logic/adapters/InMemoryImmersionApplicationGateway";

export function clientScenario(
  scenarioTitle: string,
  testSuite: ((application: ClientTestApplication) => void)[],
) {
  const primaryController = new ApplicationPrimaryController();
  const clientTestApplication: ClientTestApplicationProperties = {
    gateways: {
      immersionApplication: new InMemoryImmersionApplicationGateway(),
      establishments: new InMemoryEstablishmentGateway(),
      event: new InMemoryEventGateway(primaryController),
      establishmentsUi: new InMemoryEstablishmentUiGateway(),
    },
    repositories: {},
    primaryController,
  };

  const application = new ClientTestApplication(clientTestApplication);
  describe(scenarioTitle, () => {
    testSuite.forEach((unitTest) => unitTest(application));
  });
}
