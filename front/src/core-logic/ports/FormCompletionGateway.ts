import { Observable } from "rxjs";
import { AppellationMatchDto, GetSiretInfo, RomeDto, SiretDto } from "shared";

export interface FormCompletionGateway {
  isSiretAlreadySaved(siret: SiretDto): Observable<boolean>;
  getSiretInfo(siret: SiretDto): Observable<GetSiretInfo>;
  getSiretInfoIfNotAlreadySaved(siret: SiretDto): Observable<GetSiretInfo>;
  getRomeDtoMatching(searchText: string): Observable<RomeDto[]>;
  getAppellationDtoMatching(searchText: string): Promise<AppellationMatchDto[]>;
}
