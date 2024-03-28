import { Observable } from "rxjs";
import {
  BackOfficeJwt,
  EstablishmentJwt,
  FormEstablishmentDto,
  InclusionConnectJwt,
  SiretDto,
} from "shared";

export interface EstablishmentGateway {
  deleteEstablishment$(siret: SiretDto, jwt: BackOfficeJwt): Observable<void>;
  addFormEstablishment$(establishment: FormEstablishmentDto): Observable<void>;
  requestEstablishmentModification$(siret: SiretDto): Observable<void>;
  getFormEstablishmentFromJwt$(
    siret: SiretDto,
    jwt: EstablishmentJwt | BackOfficeJwt | InclusionConnectJwt,
  ): Observable<FormEstablishmentDto>;
  updateFormEstablishment$(
    establishment: FormEstablishmentDto,
    jwt: EstablishmentJwt | BackOfficeJwt | InclusionConnectJwt,
  ): Observable<void>;
}
