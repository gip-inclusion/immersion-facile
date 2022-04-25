import { InMemoryEstablishmentUiGateway } from "src/infra/gateway/EstablishmentUiGateway.ts/InMemoryEstablishmentUiGaetway";
import {
  ClientTestApplication,
  ClientTestApplicationProperties,
} from "../../clientApplication/ClientApplication";
import { InMemoryEventGateway } from "../../infra/gateway/EventGateway/InMemoryEventGateway";
import { InMemoryEstablishmentGateway } from "../adapters/InMemoryEstablishmentGateway";
import { ApplicationPrimaryController } from "../ports/primaryController/ApplicationPrimaryController";

export function clientScenario(
  scenarioTitle: string,
  testSuite: ((application: ClientTestApplication) => void)[],
) {
  const primaryController = new ApplicationPrimaryController();
  const clientTestApplication: ClientTestApplicationProperties = {
    gateways: {
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
