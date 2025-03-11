import type { Observable } from "rxjs";
import type {
  ConnectedUserJwt,
  EstablishmentJwt,
  FormEstablishmentDto,
  SiretDto,
} from "shared";

export interface EstablishmentGateway {
  deleteEstablishment$(
    siret: SiretDto,
    jwt: ConnectedUserJwt,
  ): Observable<void>;
  addFormEstablishment$(establishment: FormEstablishmentDto): Observable<void>;
  requestEstablishmentModification$(siret: SiretDto): Observable<void>;
  getFormEstablishmentFromJwt$(
    siret: SiretDto,
    jwt: EstablishmentJwt | ConnectedUserJwt,
  ): Observable<FormEstablishmentDto>;
  updateFormEstablishment$(
    establishment: FormEstablishmentDto,
    jwt: EstablishmentJwt | ConnectedUserJwt,
  ): Observable<void>;
}
