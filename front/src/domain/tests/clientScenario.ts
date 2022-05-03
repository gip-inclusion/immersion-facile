import {
  ClientTestApplication,
  ClientTestApplicationProperties,
} from "../../infra/application/ClientApplication";
import { InMemoryEventGateway } from "../../infra/gateway/EventGateway/InMemoryEventGateway";
import { InMemoryEstablishmentGateway } from "../../core-logic/adapters/InMemoryEstablishmentGateway";
import { ApplicationPrimaryController } from "../../core-logic/ports/primaryController/ApplicationPrimaryController";
import { InMemoryEstablishmentUiGateway } from "src/infra/gateway/EstablishmentUiGateway/InMemoryEstablishmentUiGateway";
import { InMemorySiretGatewayThroughBack } from "src/core-logic/adapters/InMemorySiretGatewayThroughBack";

export function clientScenario(
  scenarioTitle: string,
  testSuite: ((application: ClientTestApplication) => void)[],
) {
  const primaryController = new ApplicationPrimaryController();
  const clientTestApplication: ClientTestApplicationProperties = {
    gateways: {
      siretGatewayThroughBack: new InMemorySiretGatewayThroughBack(),
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
