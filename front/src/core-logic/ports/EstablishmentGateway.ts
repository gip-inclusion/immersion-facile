import { Observable } from "rxjs";
import { FormEstablishmentDto, SiretDto } from "shared";

export interface EstablishmentGateway {
  addFormEstablishment: (
    establishment: FormEstablishmentDto,
  ) => Promise<SiretDto>;
  isEstablishmentAlreadyRegisteredBySiret(siret: SiretDto): Promise<boolean>;
  requestEstablishmentModification(siret: SiretDto): Promise<void>;
  requestEstablishmentModification$(siret: SiretDto): Observable<void>;
  getFormEstablishmentFromJwt: (
    siret: SiretDto,
    jwt: string,
  ) => Promise<FormEstablishmentDto>;
  updateFormEstablishment: (
    establishment: FormEstablishmentDto,
    jwt: string,
  ) => Promise<void>;
  // addFormEstablishmentBulk$: () => {};
}
