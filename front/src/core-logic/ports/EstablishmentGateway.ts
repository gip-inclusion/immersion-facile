import type { Observable } from "rxjs";
import type { ConnectedUserJwt, FormEstablishmentDto, SiretDto } from "shared";

export interface EstablishmentGateway {
  deleteEstablishment$(
    siret: SiretDto,
    jwt: ConnectedUserJwt,
  ): Observable<void>;
  addFormEstablishment$(
    establishment: FormEstablishmentDto,
    jwt: ConnectedUserJwt,
  ): Observable<void>;
  getFormEstablishmentFromJwt$(
    siret: SiretDto,
    jwt: ConnectedUserJwt,
  ): Observable<FormEstablishmentDto>;
  updateFormEstablishment$(
    establishment: FormEstablishmentDto,
    jwt: ConnectedUserJwt,
  ): Observable<void>;
}
