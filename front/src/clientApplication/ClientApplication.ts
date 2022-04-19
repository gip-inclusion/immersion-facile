import { ClientGateways } from "src/core-logic/ports/ClientGateways";
import { ClientRepositories, ClientTestRepositories } from "src/core-logic/ports/ClientRepositories";
import { EventGateway } from "src/core-logic/ports/EventGateway";
import { ApplicationPrimaryController } from "src/core-logic/ports/primaryController/ApplicationPrimaryController";
import { ClientTestGateways } from "src/infra/gateway/ClientTestGateways";
import { ApplicationEvent } from "../core-logic/events/ApplicationEvent";

export interface ClientApplicationProperties {
  gateways: ClientGateways;
  repositories: ClientRepositories;
  primaryController:ApplicationPrimaryController
}

export interface ClientTestApplicationProperties {
  gateways: ClientTestGateways;
  repositories: ClientTestRepositories;
  primaryController:ApplicationPrimaryController
}


export class ClientApplication {
  constructor({ gateways, primaryController, repositories }: ClientApplicationProperties) {
    primaryController.addDependencies(gateways);
    this.eventBus = gateways.event
  }
  onEvent(event: ApplicationEvent) {
    this.eventBus.onEvent(event);
  }
  private eventBus: EventGateway;
}

export class ClientTestApplication extends ClientApplication {
  constructor({gateways, primaryController, repositories}:ClientTestApplicationProperties){
    super({gateways,primaryController,repositories})
    this.gateways = gateways
    this.repositories = repositories
  }
  gateways: ClientTestGateways;
  repositories: ClientTestRepositories;
}
