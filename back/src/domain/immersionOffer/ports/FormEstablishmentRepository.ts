import { FormEstablishmentDto } from "shared";
import { SiretDto } from "shared";

export interface FormEstablishmentRepository {
  create: (formEstablishmentDto: FormEstablishmentDto) => Promise<void>;
  update: (formEstablishmentDto: FormEstablishmentDto) => Promise<void>;

  getBySiret: (siret: SiretDto) => Promise<FormEstablishmentDto | undefined>;

  getAll: () => Promise<FormEstablishmentDto[]>;
}
