import { EstablishementCallToAction } from "../valueObjects/EstablishementCallToAction";
import { VerifySiretEvent } from "../events/verifySiret/VerifySiretEvent";
import { EstablishmentUiGateway } from "../../core-logic/ports/EstablishmentUiGateway";
import { EstablishmentGateway } from "../../core-logic/ports/EstablishmentGateway";
import { UseCase } from "./UseCase";
import { ImmersionApplicationGateway } from "src/core-logic/ports/ImmersionApplicationGateway";
import { NafDto } from "src/shared/naf";
import { SiretDto } from "src/shared/siret";

export class VerifySiretUseCase extends UseCase {
  constructor(
    private establishmentUiGateway: EstablishmentUiGateway,
    private establishmentGateway: EstablishmentGateway,
    private immersionApplicationGateway: ImmersionApplicationGateway,
  ) {
    super();
  }

  execute(event: VerifySiretEvent): Promise<void> {
    return event.siret.length > 0
      ? this.onSiret(event)
      : this.establishmentUiGateway.updateCallToAction(
          EstablishementCallToAction.NOTHING,
        );
  }
  private onSiret(event: VerifySiretEvent): Promise<void> {
    return this.isSiretValid(event.siret)
      ? this.onValidSiret(event)
      : this.establishmentUiGateway.updateCallToAction(
          EstablishementCallToAction.BAD_SIRET,
        );
  }

  private onValidSiret(event: VerifySiretEvent): Promise<void> {
    return this.immersionApplicationGateway
      .getSiretInfo(event.siret)
      .then((siretInfo) => this.onSiretInfo(siretInfo))
      .catch(() =>
        this.establishmentUiGateway.updateCallToAction(
          EstablishementCallToAction.MISSING_ESTABLISHMENT_ON_SIRENE,
        ),
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
          EstablishementCallToAction.CLOSED_ESTABLISHMENT_ON_SIRENE,
        )
      : this.establishmentGateway
          .isEstablishmentAlreadyRegisteredBySiret(siretInfo.siret)
          .then((isEstablishmentRegistered) =>
            isEstablishmentRegistered
              ? this.establishmentUiGateway.updateCallToAction(
                  EstablishementCallToAction.MODIFY_ESTABLISHEMENT,
                )
              : this.establishmentUiGateway.updateCallToAction(
                  EstablishementCallToAction.REGISTER_ESTABLISHEMENT,
                ),
          )
          .catch((error) => Promise.reject(error));
  }

  private isSiretValid(potentialSiret: string): boolean {
    const regExp = new RegExp("^[0-9]{14}$");
    return regExp.test(potentialSiret);
  }
}
