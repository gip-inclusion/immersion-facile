import { EstablishementCallToAction } from "../domain/establishments/EstablishementCallToAction";

export interface EstablishmentUiGateway {
  updateCallToAction(MODIFY_ESTABLISHEMENT: EstablishementCallToAction): Promise<void>;
}
