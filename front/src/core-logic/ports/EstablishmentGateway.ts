import { Observable } from "rxjs";
import { FormEstablishmentDto, SiretDto } from "shared";

export interface EstablishmentGateway {
  addFormEstablishment: (establishment: FormEstablishmentDto) => Promise<void>;
  addFormEstablishment$: (
    establishment: FormEstablishmentDto,
  ) => Observable<void>;
  requestEstablishmentModification(siret: SiretDto): Promise<void>;
  requestEstablishmentModification$(siret: SiretDto): Observable<void>;
  getFormEstablishmentFromJwt: (
    siret: SiretDto,
    jwt: string,
  ) => Promise<FormEstablishmentDto>;
  getFormEstablishmentFromJwt$(
    siret: SiretDto,
    jwt: string,
  ): Observable<FormEstablishmentDto>;
  updateFormEstablishment: (
    establishment: FormEstablishmentDto,
    jwt: string,
  ) => Promise<void>;
  updateFormEstablishment$(
    establishment: FormEstablishmentDto,
    jwt: string,
  ): Observable<void>;
}
