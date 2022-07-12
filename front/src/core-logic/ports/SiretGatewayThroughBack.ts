import { Observable } from "rxjs";
import { SiretDto, GetSiretInfo } from "src/../../shared/src/siret";

export interface SiretGatewayThroughBack {
  isSiretAlreadyInSaved(siret: SiretDto): Observable<boolean>;
  getSiretInfo(siret: SiretDto): Observable<GetSiretInfo>;
  getSiretInfoIfNotAlreadySaved(siret: SiretDto): Observable<GetSiretInfo>;
}
