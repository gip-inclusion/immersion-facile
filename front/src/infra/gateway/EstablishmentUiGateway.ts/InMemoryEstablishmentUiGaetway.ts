import { EstablishmentUiGateway } from "src/core-logic/ports/EstablishmentUiGateway";
import { EstablishementCallToAction } from "src/domain/valueObjects/EstablishementCallToAction";
export class InMemoryEstablishmentUiGateway implements EstablishmentUiGateway {
  constructor(private logging: boolean = false) {}
  updateCallToAction(callToAction: EstablishementCallToAction): Promise<void> {
    this.log("updateCallToAction", callToAction);
    this.callToAction = callToAction;
    return Promise.resolve();
  }
  callToAction: EstablishementCallToAction = EstablishementCallToAction.NOTHING;

  private log(arg: string, ...args: string[]) {
    this.logging === true && console.log(arg, ...args);
  }
}
