import { EstablishmentUiGateway } from "src/core-logic/ports/EstablishmentUiGateway";
import { EstablishementCallToAction } from "src/domain/valueObjects/EstablishementCallToAction";
export class InMemoryEstablishmentUiGateway implements EstablishmentUiGateway {
  updateCallToAction(callToAction: EstablishementCallToAction): Promise<void> {
    this.callToAction = callToAction;
    return Promise.resolve();
  }
  callToAction: EstablishementCallToAction = "NOTHING";
}
