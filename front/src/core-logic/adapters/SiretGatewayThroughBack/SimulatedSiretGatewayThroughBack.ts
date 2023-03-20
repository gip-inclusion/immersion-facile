import { delay, Observable, of } from "rxjs";
import {
  apiSirenNotAvailableSiret,
  apiSirenUnexpectedError,
  conflictErrorSiret,
  GetSiretInfo,
  SirenEstablishmentDto,
  sirenApiMissingEstablishmentMessage,
  sirenApiUnavailableSiretErrorMessage,
  sirenApiUnexpectedErrorErrorMessage,
  SiretDto,
  siretSchema,
  tooManiSirenRequestsSiretErrorMessage,
  tooManySirenRequestsSiret,
} from "shared";
import { SiretGatewayThroughBack } from "../../ports/SiretGatewayThroughBack";

export class SimulatedSiretGatewayThroughBack
  implements SiretGatewayThroughBack
{
  public constructor(
    private readonly simulatedLatency = 0,
    public sireneEstablishments: {
      [siret: SiretDto]: SirenEstablishmentDto;
    } = {},
  ) {}

  public isSiretAlreadyInSaved(siret: SiretDto): Observable<boolean> {
    const response = this.simulatedResponse(siret);
    const response$ = of(
      response === "Establishment with this siret is already in our DB",
    );
    return this.simulatedLatency
      ? response$.pipe(delay(this.simulatedLatency))
      : response$;
  }

  public getSiretInfo(siret: SiretDto): Observable<GetSiretInfo> {
    const response$ = of(this.simulatedResponse(siret));
    return this.simulatedLatency
      ? response$.pipe(delay(this.simulatedLatency))
      : response$;
  }

  public getSiretInfoIfNotAlreadySaved(
    siret: SiretDto,
  ): Observable<GetSiretInfo> {
    return this.getSiretInfo(siret);
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
