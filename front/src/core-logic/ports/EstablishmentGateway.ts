import { FormEstablishmentDto } from "src/shared/formEstablishment/FormEstablishment.dto";
import { SiretDto } from "src/shared/siret";


export interface EstablishmentGateway {
  addFormEstablishment: (
    establishment: FormEstablishmentDto
  ) => Promise<SiretDto>;
  isEstablishmentAlreadyRegisteredBySiret(siret: SiretDto): Promise<boolean>;
  requestEstablishmentModification(siret: SiretDto): Promise<void>;
  getFormEstablishmentFromJwt: (jwt: string) => Promise<FormEstablishmentDto>;
  updateFormEstablishment: (
    establishment: FormEstablishmentDto,
    jwt: string
  ) => Promise<void>;
}
