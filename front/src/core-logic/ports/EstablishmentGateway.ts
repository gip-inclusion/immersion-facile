import { Observable } from "rxjs";
import { EstablishmentJwt, FormEstablishmentDto, SiretDto } from "shared";

export interface EstablishmentGateway {
  addFormEstablishment$: (
    establishment: FormEstablishmentDto,
  ) => Observable<void>;
  requestEstablishmentModification$(siret: SiretDto): Observable<void>;
  getFormEstablishmentFromJwt$(
    siret: SiretDto,
    jwt: EstablishmentJwt,
  ): Observable<FormEstablishmentDto>;
  updateFormEstablishment$(
    establishment: FormEstablishmentDto,
    jwt: EstablishmentJwt,
  ): Observable<void>;
}
