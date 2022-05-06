import { delay, Observable, of, Subject } from "rxjs";
import {
  apiSirenNotAvailableSiret,
  apiSirenUnexpectedError,
  conflictErrorSiret,
  GetSiretResponseDto,
  SiretDto,
  tooManySirenRequestsSiret,
} from "shared/src/siret";
import { sleep } from "shared/src/utils";
import {
  GetSiretInfo,
  sirenApiMissingEstablishmentMessage,
  sirenApiUnavailableSiretErrorMessage,
  sirenApiUnexpectedErrorErrorMessage,
  SiretGatewayThroughBack,
  tooManiSirenRequestsSiretErrorMessage,
} from "../ports/SiretGatewayThroughBack";

export class InMemorySiretGatewayThroughBack
  implements SiretGatewayThroughBack
{
  private readonly _siretInfo$: Subject<GetSiretInfo>;
  private _getSiretInfoObservableCallCount = 0;
  private _getSiretInfoIfNotAlreadySavedCallCount = 0;

  public constructor(
    public sireneEstablishments: {
      [siret: SiretDto]: GetSiretResponseDto;
    } = {},
    private readonly simulatedLatency = 0,
  ) {
    this._siretInfo$ = new Subject<GetSiretInfo>();
  }

  public async getSiretInfo(siret: SiretDto): Promise<GetSiretInfo> {
    this.simulatedLatency && (await sleep(this.simulatedLatency));
    return this.simulatedResponse(siret);
  }

  public getSiretInfoObservable(siret: SiretDto): Observable<GetSiretInfo> {
    this._getSiretInfoObservableCallCount += 1;
    if (Object.keys(this.sireneEstablishments).length > 0) {
      const response$ = of(this.simulatedResponse(siret));
      return this.simulatedLatency
        ? response$.pipe(delay(this.simulatedLatency))
        : response$;
    }
    return this._siretInfo$;
  }

  public getSiretInfoIfNotAlreadySaved(
    siret: SiretDto,
  ): Observable<GetSiretInfo> {
    this._getSiretInfoIfNotAlreadySavedCallCount += 1;
    if (Object.keys(this.sireneEstablishments).length > 0) {
      const response$ = of(this.simulatedResponse(siret));
      return this.simulatedLatency
        ? response$.pipe(delay(this.simulatedLatency))
        : response$;
    }

    return this._siretInfo$;
  }

  private simulatedResponse(siret: SiretDto): GetSiretInfo {
    if (siret === tooManySirenRequestsSiret)
      return tooManiSirenRequestsSiretErrorMessage;
    if (siret === apiSirenNotAvailableSiret)
      return sirenApiUnavailableSiretErrorMessage;
    if (siret === conflictErrorSiret)
      return "Establishment with this siret is already in our DB";
    if (siret === apiSirenUnexpectedError)
      throw new Error(sirenApiUnexpectedErrorErrorMessage);
    const establishment = this.sireneEstablishments[siret];
    return establishment || sirenApiMissingEstablishmentMessage;
  }

  get siretInfo$() {
    return this._siretInfo$;
  }

  get getSiretInfoObservableCallCount() {
    return this._getSiretInfoObservableCallCount;
  }

  get getSiretInfoIfNotAlreadySavedCallCount() {
    return this._getSiretInfoIfNotAlreadySavedCallCount;
  }
}
