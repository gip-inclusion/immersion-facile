import { EstablishementCallToAction } from "../../domain/valueObjects/EstablishementCallToAction";

export interface EstablishmentUiGateway {
  updateCallToAction(
    MODIFY_ESTABLISHEMENT: EstablishementCallToAction,
  ): Promise<void>;
}
