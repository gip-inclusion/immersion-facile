import {
  ApplicationEvent,
  EventType,
} from "../../../domain/events/ApplicationEvent";
import { UseCase } from "../../../domain/useCases/UseCase";
import { VerifySiretUseCase } from "../../../domain/useCases/VerifySiretUseCase";
import { ClientGateways } from "../ClientGateways";
import { ModifyEstablishmentUseCase } from "../../../domain/useCases/ModifyEstablishmentUseCase";

export class ApplicationPrimaryController {
  addDependencies(gateways: ClientGateways) {
    this.useCases.set(
      "SIRET_VERIFICATION_REQUESTED",
      new VerifySiretUseCase(
        gateways.establishmentsUi,
        gateways.establishments,
        gateways.immersionApplication,
      ),
    );
    this.useCases.set(
      "ESTABLISHMENT_MODIFICATION_REQUESTED",
      new ModifyEstablishmentUseCase(
        gateways.establishments,
        gateways.establishmentsUi,
        gateways.immersionApplication,
      ),
    );
  }
  onEvent(event: ApplicationEvent): Promise<void> {
    const useCase = this.useCases.get(event.eventType);
    return useCase
      ? useCase.execute(event)
      : Promise.reject(`No use case found for event ${event.eventType}.`);
  }
  private useCases: Map<EventType, UseCase> = new Map();
}
