import { Observable } from "rxjs";
import {
  EstablishmentJwt,
  FormEstablishmentDto,
  ProConnectJwt,
  SiretDto,
} from "shared";

export interface EstablishmentGateway {
  deleteEstablishment$(siret: SiretDto, jwt: ProConnectJwt): Observable<void>;
  addFormEstablishment$(establishment: FormEstablishmentDto): Observable<void>;
  requestEstablishmentModification$(siret: SiretDto): Observable<void>;
  getFormEstablishmentFromJwt$(
    siret: SiretDto,
    jwt: EstablishmentJwt | ProConnectJwt,
  ): Observable<FormEstablishmentDto>;
  updateFormEstablishment$(
    establishment: FormEstablishmentDto,
    jwt: EstablishmentJwt | ProConnectJwt,
  ): Observable<void>;
}
