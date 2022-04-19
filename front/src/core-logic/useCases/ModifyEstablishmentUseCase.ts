import { SiretDto } from "src/shared/siret";
import { EstablishementCallToAction } from "../domain/establishments/EstablishementCallToAction";
import { ModifyEstablishmentEvent } from "../events/modifyEstablishment.ts/ModifyEstablishmentEvent";
import { EstablishmentUiGateway } from "../ports/EstablishmentUiGateway";
import { EstablishmentGateway } from "../ports/EstablishmentGateway";
import { UseCase } from "./UseCase";

export class ModifyEstablishmentUseCase extends UseCase {
  constructor(
    private establishmentGateway:EstablishmentGateway,
    private establishmentUiGateway:EstablishmentUiGateway
  ) { super(); }
  execute(event: ModifyEstablishmentEvent): Promise<void> {
    return this.isSiretValid(event.siret) 
      ? this.onValidSiret(event)
      : this.establishmentUiGateway.updateCallToAction(EstablishementCallToAction.BAD_SIRET)
  }
  private onValidSiret(event: ModifyEstablishmentEvent): Promise<void> {
    return this.establishmentGateway.isEstablishmentAlreadyRegisteredBySiret(event.siret)
      .then(isEstablishmentRegisteredBySiret => isEstablishmentRegisteredBySiret
        ? this.establishmentRegistered(event)
        : this.establishmentNotRegistered()
      )
      .catch(error=>Promise.reject(error))
  }

  private establishmentNotRegistered(): Promise<void> {
    return this.establishmentUiGateway.updateCallToAction(EstablishementCallToAction.UNREGISTERED_SIRET)
  }

  private establishmentRegistered(event: ModifyEstablishmentEvent): Promise<void> {
    return this.establishmentGateway.requestEstablishmentModification(event.siret)
      .then(() => this.establishmentUiGateway.updateCallToAction(EstablishementCallToAction.MODIFY_ESTABLISHEMENT_REQUEST_NOTIFICATION))
      .catch(error => Promise.reject(error));
  }
  private isSiretValid(potentialSiret:SiretDto):boolean {
    const regExp = new RegExp('^[0-9]{14}$')
    return regExp.test(potentialSiret)
  }
}
