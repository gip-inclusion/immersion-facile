import { FormEstablishmentDto } from "shared/src/formEstablishment/FormEstablishment.dto";
import { SiretDto } from "shared/src/siret";

export interface FormEstablishmentRepository {
  create: (formEstablishmentDto: FormEstablishmentDto) => Promise<void>;
  update: (formEstablishmentDto: FormEstablishmentDto) => Promise<void>;

  getBySiret: (siret: SiretDto) => Promise<FormEstablishmentDto | undefined>;

  getAll: () => Promise<FormEstablishmentDto[]>;
}
