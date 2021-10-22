import {
  FormEstablishmentId,
  FormEstablishmentDto,
} from "../../../shared/FormEstablishmentDto";

export interface FormEstablishmentRepository {
  save: (
    formEstablishmentDto: FormEstablishmentDto,
  ) => Promise<FormEstablishmentId | undefined>;

  getById: (
    id: FormEstablishmentId,
  ) => Promise<FormEstablishmentDto | undefined>;
  getAll: () => Promise<FormEstablishmentDto[]>;
}
