import { FormEstablishmentDto } from "src/shared/formEstablishment/FormEstablishment.dto";
import { AppellationMatchDto } from "src/shared/romeAndAppellationDtos/romeAndAppellation.dto";
import { SiretDto } from "src/shared/siret";

export interface FormEstablishmentGateway {
  addFormEstablishment: (
    establishment: FormEstablishmentDto,
  ) => Promise<SiretDto>;
  searchAppellation: (searchText: string) => Promise<AppellationMatchDto[]>;
  getSiretAlreadyExists(siret: SiretDto): Promise<boolean>;
  requestEmailToEditForm(siret: SiretDto): Promise<void>;
  getFormEstablishmentFromJwt: (jwt: string) => Promise<FormEstablishmentDto>;
  updateFormEstablishment: (
    establishment: FormEstablishmentDto,
    jwt: string,
  ) => Promise<void>;
}
