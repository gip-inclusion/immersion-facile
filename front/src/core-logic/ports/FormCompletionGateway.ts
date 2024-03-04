import { Observable } from "rxjs";
import { AppellationMatchDto, GetSiretInfo, SiretDto } from "shared";

export interface FormCompletionGateway {
  isSiretAlreadySaved(siret: SiretDto): Observable<boolean>;
  getSiretInfo(siret: SiretDto): Observable<GetSiretInfo>;
  getSiretInfoIfNotAlreadySaved(siret: SiretDto): Observable<GetSiretInfo>;
  getAppellationDtoMatching(
    searchText: string,
    useNaturalLanguage: boolean,
  ): Promise<AppellationMatchDto[]>;
}
