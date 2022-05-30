import { Observable } from "rxjs";
import { FormEstablishmentDto } from "shared/src/formEstablishment/FormEstablishment.dto";
import { SiretDto } from "shared/src/siret";

export interface EstablishmentGateway {
  addFormEstablishment: (
    establishment: FormEstablishmentDto,
  ) => Promise<SiretDto>;
  isEstablishmentAlreadyRegisteredBySiret(siret: SiretDto): Promise<boolean>;
  requestEstablishmentModification(siret: SiretDto): Promise<void>;
  requestEstablishmentModificationObservable(siret: SiretDto): Observable<void>;
  getFormEstablishmentFromJwt: (jwt: string) => Promise<FormEstablishmentDto>;
  updateFormEstablishment: (
    establishment: FormEstablishmentDto,
    jwt: string,
  ) => Promise<void>;
}
