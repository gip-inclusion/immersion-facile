import { delay, Observable, of } from "rxjs";
import {
  apiSirenNotAvailableSiret,
  apiSirenUnexpectedError,
  conflictErrorSiret,
  GetSiretInfo,
  siretApiMissingEstablishmentMessage,
  siretApiUnavailableSiretErrorMessage,
  siretApiUnexpectedErrorErrorMessage,
  SiretDto,
  SiretEstablishmentDto,
  siretSchema,
  tooManiSirenRequestsSiretErrorMessage,
  tooManySirenRequestsSiret,
} from "shared";
import { SiretGatewayThroughBack } from "../../ports/SiretGatewayThroughBack";

export class SimulatedSiretGatewayThroughBack
  implements SiretGatewayThroughBack
{
  constructor(
    private readonly simulatedLatency = 0,
    public sireneEstablishments: {
      [siret: SiretDto]: SiretEstablishmentDto;
    } = {},
  ) {}

  public getSiretInfo(siret: SiretDto): Observable<GetSiretInfo> {
    const response$ = of(this.#simulatedResponse(siret));
    return this.simulatedLatency
      ? response$.pipe(delay(this.simulatedLatency))
      : response$;
  }

  public getSiretInfoIfNotAlreadySaved(
    siret: SiretDto,
  ): Observable<GetSiretInfo> {
    return this.getSiretInfo(siret);
  }

  public isSiretAlreadySaved(siret: SiretDto): Observable<boolean> {
    const response = this.#simulatedResponse(siret);
    const response$ = of(
      response === "Establishment with this siret is already in our DB",
    );
    return this.simulatedLatency
      ? response$.pipe(delay(this.simulatedLatency))
      : response$;
  }

  #simulatedResponse(rawSiret: SiretDto): GetSiretInfo {
    const siret = siretSchema.parse(rawSiret);

    if (siret === tooManySirenRequestsSiret)
      return tooManiSirenRequestsSiretErrorMessage;
    if (siret === apiSirenNotAvailableSiret)
      return siretApiUnavailableSiretErrorMessage;
    if (siret === conflictErrorSiret)
      return "Establishment with this siret is already in our DB";
    if (siret === apiSirenUnexpectedError)
      throw new Error(siretApiUnexpectedErrorErrorMessage);
    const establishment = this.sireneEstablishments[siret];
    return establishment || siretApiMissingEstablishmentMessage;
  }
}
