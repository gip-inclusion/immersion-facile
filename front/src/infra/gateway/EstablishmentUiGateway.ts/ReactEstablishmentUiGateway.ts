import { BehaviorSubject, Observable } from "rxjs";
import { EstablishementCallToAction } from "src/core-logic/domain/establishments/EstablishementCallToAction";
import {EstablishmentUiGateway} from "src/core-logic/ports/EstablishmentUiGateway"
const establishementCallToActionSubject$: BehaviorSubject<EstablishementCallToAction> = new BehaviorSubject<EstablishementCallToAction>(EstablishementCallToAction.NOTHING);
export const establishementCallToActionObservable$: Observable<EstablishementCallToAction> = establishementCallToActionSubject$.asObservable();
export class ReactEstablishmentUiGateway implements EstablishmentUiGateway {
  updateCallToAction(callToAction: EstablishementCallToAction): Promise<void> {
    establishementCallToActionSubject$.next(callToAction);
    return Promise.resolve()
  }
}