import { EstablishementCallToAction } from "../domain/establishments/EstablishementCallToAction";
import { VerifySiretEvent } from "../events/verifySiret/VerifySiretEvent";
import { EstablishmentUiGateway } from "../ports/EstablishmentUiGateway";
import { EstablishmentGateway } from "../ports/EstablishmentGateway";
import { UseCase } from "./UseCase";

export class VerifySiretUseCase extends UseCase {
  constructor(
    private establishmentUiGateway:EstablishmentUiGateway,
    private establishmentGateway:EstablishmentGateway
  ){super()}

  execute(event: VerifySiretEvent): Promise<void> {
    return event.siret.length > 0
      ? this.onSiret(event)
      : this.establishmentUiGateway.updateCallToAction(EstablishementCallToAction.NOTHING)
  }
  private onSiret(event:VerifySiretEvent): Promise<void> {
    return this.isSiretValid(event.siret)
      ? this.onValidSiret(event)
      : this.establishmentUiGateway.updateCallToAction(EstablishementCallToAction.BAD_SIRET)
  }

  private onValidSiret(event: VerifySiretEvent): Promise<void> {
    return this.establishmentGateway.isEstablishmentAlreadyRegisteredBySiret(event.siret)
      .then(isEstablishmentRegistered => isEstablishmentRegistered
        ? this.establishmentUiGateway.updateCallToAction(EstablishementCallToAction.MODIFY_ESTABLISHEMENT)
        : this.establishmentUiGateway.updateCallToAction(EstablishementCallToAction.REGISTER_ESTABLISHEMENT)
      )
      .catch(error=>Promise.reject(error))
  }
 
  private isSiretValid(potentialSiret:string):boolean {
    const regExp = new RegExp('^[0-9]{14}$')
    return regExp.test(potentialSiret)
  }
}
