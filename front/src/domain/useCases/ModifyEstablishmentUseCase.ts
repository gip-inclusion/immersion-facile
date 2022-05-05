import {
  GetSiretInfoError,
  SiretGatewayThroughBack,
} from "src/core-logic/ports/SiretGatewayThroughBack";
import { SiretDto } from "src/shared/siret";
import { EstablishmentGateway } from "../../core-logic/ports/EstablishmentGateway";
import { EstablishmentUiGateway } from "../../core-logic/ports/EstablishmentUiGateway";
import { NafDto } from "../../shared/naf";
import { ModifyEstablishmentEvent } from "../events/modifyEstablishment.ts/ModifyEstablishmentEvent";
import { UseCase } from "./UseCase";

export class ModifyEstablishmentUseCase extends UseCase {
  constructor(
    private establishmentGateway: EstablishmentGateway,
    private establishmentUiGateway: EstablishmentUiGateway,
    private siretGatewayThroughBack: SiretGatewayThroughBack,
  ) {
    super();
  }
  execute(event: ModifyEstablishmentEvent): Promise<void> {
    return this.isSiretValid(event.siret)
      ? this.onValidSiret(event)
      : this.establishmentUiGateway.updateCallToAction("ERROR_BAD_SIRET");
  }

  private onValidSiret(event: ModifyEstablishmentEvent): Promise<void> {
    return this.siretGatewayThroughBack
      .getSiretInfo(event.siret)
      .then((siretInfo) =>
        typeof siretInfo === "string"
          ? this.onMissingSiretInfo(siretInfo)
          : this.onSiretInfo(siretInfo),
      )
      .catch(() =>
        this.establishmentUiGateway.updateCallToAction(
          "ERROR_UNEXPECTED_ERROR",
        ),
      );
  }
  onMissingSiretInfo(siretInfo: GetSiretInfoError): Promise<void> {
    return this.establishmentUiGateway.updateCallToAction(
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
      ? this.establishmentUiGateway.updateCallToAction(
          "ERROR_CLOSED_ESTABLISHMENT_ON_SIRENE",
        )
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
    return this.establishmentUiGateway.updateCallToAction(
      "ERROR_UNREGISTERED_SIRET",
    );
  }

  private establishmentRegistered(siret: SiretDto): Promise<void> {
    return this.establishmentGateway
      .requestEstablishmentModification(siret)
      .then(() =>
        this.establishmentUiGateway.updateCallToAction(
          "MODIFY_ESTABLISHEMENT_REQUEST_NOTIFICATION",
        ),
      )
      .catch((error) => Promise.reject(error));
  }

  private isSiretValid(potentialSiret: SiretDto): boolean {
    return new RegExp("^[0-9]{14}$").test(potentialSiret);
  }
}
