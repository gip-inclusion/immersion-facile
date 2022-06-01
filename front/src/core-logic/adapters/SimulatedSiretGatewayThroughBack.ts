import { delay, Observable, of } from "rxjs";
import {
  apiSirenNotAvailableSiret,
  apiSirenUnexpectedError,
  conflictErrorSiret,
  GetSiretResponseDto,
  SiretDto,
  siretSchema,
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

export class SimulatedSiretGatewayThroughBack
  implements SiretGatewayThroughBack
{
  public constructor(
    private readonly simulatedLatency = 0,
    public sireneEstablishments: {
      [siret: SiretDto]: GetSiretResponseDto;
    } = {},
  ) {}

  public async getSiretInfo(siret: SiretDto): Promise<GetSiretInfo> {
    this.simulatedLatency && (await sleep(this.simulatedLatency));
    return this.simulatedResponse(siret);
  }

  public getSiretInfoObservable(siret: SiretDto): Observable<GetSiretInfo> {
    const response$ = of(this.simulatedResponse(siret));
    return this.simulatedLatency
      ? response$.pipe(delay(this.simulatedLatency))
      : response$;
  }

  public getSiretInfoIfNotAlreadySaved(
    siret: SiretDto,
  ): Observable<GetSiretInfo> {
    return this.getSiretInfoObservable(siret);
  }

  private simulatedResponse(rawSiret: SiretDto): GetSiretInfo {
    const siret = siretSchema.parse(rawSiret);

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
}
