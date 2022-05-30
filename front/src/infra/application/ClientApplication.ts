import { ClientGateways } from "src/core-logic/ports/ClientGateways";
import {
  ClientRepositories,
  ClientTestRepositories,
} from "src/core-logic/ports/ClientRepositories";
import { EventGateway } from "src/core-logic/ports/EventGateway";
import { ApplicationPrimaryController } from "src/core-logic/ports/primaryController/ApplicationPrimaryController";
import { ReduxStore } from "src/core-logic/storeConfig/store";
import { ClientTestGateways } from "src/infra/gateway/ClientTestGateways";
import { ApplicationEvent } from "../../domain/events/ApplicationEvent";

export interface ClientApplicationProperties {
  gateways: ClientGateways;
  repositories: ClientRepositories;
  primaryController: ApplicationPrimaryController;
  store: ReduxStore;
}

export interface ClientTestApplicationProperties {
  gateways: ClientTestGateways;
  repositories: ClientTestRepositories;
  primaryController: ApplicationPrimaryController;
  store: ReduxStore;
}

export class ClientApplication {
  constructor({
    gateways,
    primaryController,
    repositories: _,
    store,
  }: ClientApplicationProperties) {
    primaryController.addDependencies(gateways);
    this.eventBus = gateways.event;
    this.store = store;
  }

  onEvent(event: ApplicationEvent) {
    this.eventBus.onEvent(event);
  }
  private eventBus: EventGateway;
  public store: ReduxStore;
}

export class ClientTestApplication extends ClientApplication {
  constructor({
    gateways,
    primaryController,
    repositories,
    store,
  }: ClientTestApplicationProperties) {
    super({ gateways, primaryController, repositories, store });
    this.gateways = gateways;
    this.repositories = repositories;
  }
  gateways: ClientTestGateways;
  repositories: ClientTestRepositories;
}
