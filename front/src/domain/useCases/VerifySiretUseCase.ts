import {
  GetSiretInfoError,
  SiretGatewayThroughBack,
} from "src/core-logic/ports/SiretGatewayThroughBack";
import { NafDto } from "src/shared/naf";
import { SiretDto } from "src/shared/siret";
import { EstablishmentGateway } from "../../core-logic/ports/EstablishmentGateway";
import { EstablishmentUiGateway } from "../../core-logic/ports/EstablishmentUiGateway";
import { VerifySiretEvent } from "../events/verifySiret/VerifySiretEvent";
import { UseCase } from "./UseCase";

export class VerifySiretUseCase extends UseCase {
  constructor(
    private establishmentUiGateway: EstablishmentUiGateway,
    private establishmentGateway: EstablishmentGateway,
    private siretGatewayThroughBack: SiretGatewayThroughBack,
  ) {
    super();
  }

  execute(event: VerifySiretEvent): Promise<void> {
    return event.siret.length > 0
      ? this.onSiret(event)
      : this.establishmentUiGateway.updateCallToAction("NOTHING");
  }
  private onSiret(event: VerifySiretEvent): Promise<void> {
    return this.isSiretValid(event.siret)
      ? this.onValidSiret(event)
      : this.establishmentUiGateway.updateCallToAction("ERROR_BAD_SIRET");
  }

  private onValidSiret(event: VerifySiretEvent): Promise<void> {
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
  private onMissingSiretInfo(siretInfo: GetSiretInfoError): Promise<void> {
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
      : this.establishmentGateway
          .isEstablishmentAlreadyRegisteredBySiret(siretInfo.siret)
          .then((isEstablishmentRegistered) =>
            isEstablishmentRegistered
              ? this.establishmentUiGateway.updateCallToAction(
                  "MODIFY_ESTABLISHEMENT",
                )
              : this.establishmentUiGateway.navigateToEstablishementForm(
                  siretInfo.siret,
                ),
          )
          .catch((error) => Promise.reject(error));
  }

  private isSiretValid(potentialSiret: string): boolean {
    const regExp = new RegExp("^[0-9]{14}$");
    return regExp.test(potentialSiret);
  }
}
