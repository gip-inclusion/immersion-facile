import { Observable } from "rxjs";
import {
  EstablishmentJwt,
  FormEstablishmentDto,
  InclusionConnectJwt,
  SiretDto,
} from "shared";

export interface EstablishmentGateway {
  deleteEstablishment$(
    siret: SiretDto,
    jwt: InclusionConnectJwt,
  ): Observable<void>;
  addFormEstablishment$(establishment: FormEstablishmentDto): Observable<void>;
  requestEstablishmentModification$(siret: SiretDto): Observable<void>;
  getFormEstablishmentFromJwt$(
    siret: SiretDto,
    jwt: EstablishmentJwt | InclusionConnectJwt,
  ): Observable<FormEstablishmentDto>;
  updateFormEstablishment$(
    establishment: FormEstablishmentDto,
    jwt: EstablishmentJwt | InclusionConnectJwt,
  ): Observable<void>;
}
