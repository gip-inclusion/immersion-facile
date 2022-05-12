import { ClientGateways } from "src/core-logic/ports/ClientGateways";
import { ClientRepositories } from "src/core-logic/ports/ClientRepositories";
import { ApplicationPrimaryController } from "src/core-logic/ports/primaryController/ApplicationPrimaryController";
import { ReactNavigationGateway } from "src/infra/gateway/EstablishmentUiGateway/ReactNavigationGateway";
import { InMemoryEventGateway } from "src/infra/gateway/EventGateway/InMemoryEventGateway";
import {
  establishmentGateway,
  siretGatewayThroughBack,
  store,
} from "../../app/config/dependencies";
import { ClientApplication } from "./ClientApplication";
const primaryController = new ApplicationPrimaryController(store);
const gateways: ClientGateways = {
  siretGatewayThroughBack,
  establishments: establishmentGateway,
  navigation: new ReactNavigationGateway(),
  event: new InMemoryEventGateway(primaryController),
};
const repositories: ClientRepositories = {};

export const clientApplication = new ClientApplication({
  primaryController,
  gateways,
  repositories,
  store,
});
