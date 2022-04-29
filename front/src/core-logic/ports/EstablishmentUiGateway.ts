import { SiretDto } from "shared/src/siret";
import { EstablishementCallToAction } from "../../domain/valueObjects/EstablishementCallToAction";

export interface EstablishmentUiGateway {
  navigateToEstablishementForm(siret: SiretDto): Promise<void>;
  updateCallToAction(
    MODIFY_ESTABLISHEMENT: EstablishementCallToAction,
  ): Promise<void>;
}
