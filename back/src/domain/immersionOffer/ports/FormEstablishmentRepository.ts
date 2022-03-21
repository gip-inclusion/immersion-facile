import { FormEstablishmentDto } from "../../../shared/FormEstablishmentDto";
import { SiretDto } from "../../../shared/siret";

export interface FormEstablishmentRepository {
  create: (formEstablishmentDto: FormEstablishmentDto) => Promise<void>;
  update: (formEstablishmentDto: FormEstablishmentDto) => Promise<void>;

  getBySiret: (siret: SiretDto) => Promise<FormEstablishmentDto | undefined>;

  getAll: () => Promise<FormEstablishmentDto[]>;
}
