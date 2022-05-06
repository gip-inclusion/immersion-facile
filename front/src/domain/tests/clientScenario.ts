import { InMemorySiretGatewayThroughBack } from "src/core-logic/adapters/InMemorySiretGatewayThroughBack";
import { InMemoryEstablishmentUiGateway } from "src/infra/gateway/EstablishmentUiGateway/InMemoryEstablishmentUiGateway";
import { InMemoryEstablishmentGateway } from "../../core-logic/adapters/InMemoryEstablishmentGateway";
import { ApplicationPrimaryController } from "../../core-logic/ports/primaryController/ApplicationPrimaryController";
import {
  ClientTestApplication,
  ClientTestApplicationProperties,
} from "../../infra/application/ClientApplication";
import { InMemoryEventGateway } from "../../infra/gateway/EventGateway/InMemoryEventGateway";
type UnitTestWithDependencies = (application: ClientTestApplication) => void;
export const executeTestSuite = (testSuite: UnitTestWithDependencies[]) => {
  const application = makeAcceptanceTestApplication();
  testSuite.forEach((unitTest) => unitTest(application));
};
function makeAcceptanceTestApplication() {
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
  return new ClientTestApplication(clientTestApplication);
}
