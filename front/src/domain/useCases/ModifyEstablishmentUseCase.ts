import { NafDto } from "shared/src/naf";
import { SiretDto } from "shared/src/siret";
import { EstablishmentGateway } from "src/core-logic/ports/EstablishmentGateway";
import {
  GetSiretInfoError,
  SiretGatewayThroughBack,
} from "src/core-logic/ports/SiretGatewayThroughBack";
import { ReduxStore } from "src/core-logic/storeConfig/store";
import { homeEstablishmentSlice } from "src/infra/gateway/EstablishmentUiGateway/homeEstablishmentSlice";
import { ModifyEstablishmentEvent } from "../events/modifyEstablishment.ts/ModifyEstablishmentEvent";
import { EstablishementCallToAction } from "../valueObjects/EstablishementCallToAction";
import { UseCase } from "./UseCase";

export class ModifyEstablishmentUseCase extends UseCase {
  constructor(
    private establishmentGateway: EstablishmentGateway,
    private siretGatewayThroughBack: SiretGatewayThroughBack,
    private store: ReduxStore,
  ) {
    super();
  }

  execute(event: ModifyEstablishmentEvent): Promise<void> {
    return this.isSiretValid(event.siret)
      ? this.onValidSiret(event)
      : this.callToActionChanged("ERROR_BAD_SIRET");
  }
  private callToActionChanged(
    callToAction: EstablishementCallToAction,
  ): Promise<void> {
    this.store.dispatch(
      homeEstablishmentSlice.actions.callToActionChanged(callToAction),
    );
    return Promise.resolve();
  }

  private onValidSiret(event: ModifyEstablishmentEvent): Promise<void> {
    return this.siretGatewayThroughBack
      .getSiretInfo(event.siret)
      .then((siretInfo) =>
        typeof siretInfo === "string"
          ? this.onMissingSiretInfo(siretInfo)
          : this.onSiretInfo(siretInfo),
      )
      .catch(() => this.callToActionChanged("ERROR_UNEXPECTED_ERROR"));
  }
  onMissingSiretInfo(siretInfo: GetSiretInfoError): Promise<void> {
    return this.callToActionChanged(
      siretInfo === "SIRENE API not available."
        ? "ERROR_SIRENE_API_UNAVAILABLE"
        : siretInfo === "Missing establishment on SIRENE API."
        ? "ERROR_MISSING_ESTABLISHMENT_ON_SIRENE"
        : "ERROR_TOO_MANY_REQUESTS_ON_SIRET_API",
    );
  }

  private onSiretInfo(siretInfo: {
    naf?: NafDto | undefined;
    siret: SiretDto;
    businessName: string;
    businessAddress: string;
    isOpen: boolean;
  }): Promise<void> {
    return siretInfo.isOpen === false
      ? this.callToActionChanged("ERROR_CLOSED_ESTABLISHMENT_ON_SIRENE")
      : this.onOpenEstablishment(siretInfo.siret);
  }

  private onOpenEstablishment(siret: SiretDto): Promise<void> {
    return this.establishmentGateway
      .isEstablishmentAlreadyRegisteredBySiret(siret)
      .then((isEstablishmentRegisteredBySiret) =>
        isEstablishmentRegisteredBySiret
          ? this.establishmentRegistered(siret)
          : this.establishmentNotRegistered(),
      )
      .catch((error) => Promise.reject(error));
  }

  private establishmentNotRegistered(): Promise<void> {
    return this.callToActionChanged("ERROR_UNREGISTERED_SIRET");
  }

  private establishmentRegistered(siret: SiretDto): Promise<void> {
    return this.establishmentGateway
      .requestEstablishmentModification(siret)
      .then(() =>
        this.callToActionChanged("MODIFY_ESTABLISHEMENT_REQUEST_NOTIFICATION"),
      )
      .catch((error) => Promise.reject(error));
  }

  private isSiretValid(potentialSiret: SiretDto): boolean {
    return new RegExp("^[0-9]{14}$").test(potentialSiret);
  }
}
