import { EstablishementCallToAction } from "src/core-logic/domain/establishments/EstablishementCallToAction";
import { EstablishmentUiGateway } from "src/core-logic/ports/EstablishmentUiGateway";
export class InMemoryEstablishmentUiGateway implements EstablishmentUiGateway {
  updateCallToAction(callToAction: EstablishementCallToAction): Promise<void> {
    this.callToAction = callToAction;
    return Promise.resolve();
  }
  callToAction: EstablishementCallToAction = EstablishementCallToAction.NOTHING;
}
