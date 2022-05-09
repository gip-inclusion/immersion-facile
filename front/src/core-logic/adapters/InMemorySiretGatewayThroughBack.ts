import { delay, Observable, of } from "rxjs";
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

const TEST_ESTABLISHMENTS: GetSiretResponseDto[] = [
  {
    siret: "12345678901234",
    businessName: "MA P'TITE BOITE",
    businessAddress: "20 AVENUE DE SEGUR 75007 PARIS 7",
    naf: {
      code: "78.3Z",
      nomenclature: "Ref2",
    },
    isOpen: true,
  },
  {
    siret: "11111111111111",
    businessName: "ALAIN PROST",
    businessAddress: "CHALET SECRET 73550 MERIBEL",
    isOpen: true,
  },
];

export class InMemorySiretGatewayThroughBack
  implements SiretGatewayThroughBack
{
  public sireneEstablishments: { [siret: SiretDto]: GetSiretResponseDto } = {};

  public constructor(
    private simulatedLatency?: number,
    private logging: boolean = false,
  ) {
    TEST_ESTABLISHMENTS.forEach(
      (establishment) =>
        (this.sireneEstablishments[establishment.siret] = establishment),
    );
  }

  public async getSiretInfo(siret: SiretDto): Promise<GetSiretInfo> {
    this.simulatedLatency && (await sleep(this.simulatedLatency));
    return this.simulatedResponse(siret);
  }

  public getSiretInfoIfNotAlreadySaved(
    siret: SiretDto,
  ): Observable<GetSiretInfo> {
    const response$ = of(this.simulatedResponse(siret));
    return this.simulatedLatency
      ? response$.pipe(delay(this.simulatedLatency))
      : response$;
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
}
