import { BehaviorSubject, Observable } from "rxjs";
import { EstablishmentUiGateway } from "src/core-logic/ports/EstablishmentUiGateway";
import { EstablishementCallToAction } from "src/domain/valueObjects/EstablishementCallToAction";
import { SiretDto } from "src/shared/siret";
import { routes } from "src/app/routing/routes";
const establishementCallToActionSubject$: BehaviorSubject<EstablishementCallToAction> =
  new BehaviorSubject<EstablishementCallToAction>("NOTHING");
export const establishementCallToActionObservable$: Observable<EstablishementCallToAction> =
  establishementCallToActionSubject$.asObservable();
export class ReactEstablishmentUiGateway implements EstablishmentUiGateway {
  constructor(private logging = false) {}

  navigateToEstablishementForm(siret: SiretDto): Promise<void> {
    routes.formEstablishment({ siret }).push();
    return Promise.resolve();
  }

  updateCallToAction(callToAction: EstablishementCallToAction): Promise<void> {
    establishementCallToActionSubject$.next(callToAction);
    return Promise.resolve();
  }
}
