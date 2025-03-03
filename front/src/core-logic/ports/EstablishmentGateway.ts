import { Observable } from "rxjs";
import { FormEstablishmentDto, InclusionConnectJwt, SiretDto } from "shared";

export interface EstablishmentGateway {
  deleteEstablishment$(
    siret: SiretDto,
    jwt: InclusionConnectJwt,
  ): Observable<void>;
  addFormEstablishment$(
    establishment: FormEstablishmentDto,
    jwt: InclusionConnectJwt,
  ): Observable<void>;
  getFormEstablishmentFromJwt$(
    siret: SiretDto,
    jwt: InclusionConnectJwt,
  ): Observable<FormEstablishmentDto>;
  updateFormEstablishment$(
    establishment: FormEstablishmentDto,
    jwt: InclusionConnectJwt,
  ): Observable<void>;
}
