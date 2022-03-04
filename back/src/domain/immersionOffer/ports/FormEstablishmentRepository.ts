import { FormEstablishmentDto } from "../../../shared/FormEstablishmentDto";

export interface FormEstablishmentRepository {
  save: (
    formEstablishmentDto: FormEstablishmentDto,
  ) => Promise<string | undefined>;

  getBySiret: (siret: string) => Promise<FormEstablishmentDto | undefined>;

  getAll: () => Promise<FormEstablishmentDto[]>;
}
