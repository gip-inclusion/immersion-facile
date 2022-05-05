import { EstablishmentUiGateway } from "src/core-logic/ports/EstablishmentUiGateway";
import { EstablishementCallToAction } from "src/domain/valueObjects/EstablishementCallToAction";
import { SiretDto } from "src/shared/siret";
export class InMemoryEstablishmentUiGateway implements EstablishmentUiGateway {
  navigateToEstablishementForm(siret: SiretDto): Promise<void> {
    this.navigateToEstablishementFormState = siret;
    return Promise.resolve();
  }
  updateCallToAction(callToAction: EstablishementCallToAction): Promise<void> {
    this.callToAction = callToAction;
    return Promise.resolve();
  }
  callToAction: EstablishementCallToAction = "NOTHING";
  navigateToEstablishementFormState: boolean | SiretDto = false;
}
