import { FormEstablishmentDto } from "../../../shared/FormEstablishmentDto";
import { SiretDto } from "../../../shared/siret";

export interface FormEstablishmentRepository {
  save: (
    formEstablishmentDto: FormEstablishmentDto,
  ) => Promise<SiretDto | undefined>;

  getBySiret: (siret: SiretDto) => Promise<FormEstablishmentDto | undefined>;

  getAll: () => Promise<FormEstablishmentDto[]>;
}
