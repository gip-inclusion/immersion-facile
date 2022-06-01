import { SimulatedSiretGatewayThroughBack } from "src/core-logic/adapters/SimulatedSiretGatewayThroughBack";
import { createTestStore } from "src/core-logic/storeConfig/createTestStore";
import { InMemoryNavigationGateway } from "src/core-logic/adapters/InMemoryNavigationGateway";
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
  const { store, dependencies } = createTestStore();
  dependencies.siretGatewayThroughBack =
    new SimulatedSiretGatewayThroughBack() as any;
  const primaryController = new ApplicationPrimaryController(store);
  const clientTestApplication: ClientTestApplicationProperties = {
    gateways: {
      siretGatewayThroughBack:
        dependencies.siretGatewayThroughBack as unknown as SimulatedSiretGatewayThroughBack,
      establishments: new InMemoryEstablishmentGateway(),
      event: new InMemoryEventGateway(primaryController),
      navigation: new InMemoryNavigationGateway(),
    },
    repositories: {},
    primaryController,
    store,
  };
  return new ClientTestApplication(clientTestApplication);
}
