import { FormEstablishmentDto, SiretDto } from "shared";

export interface FormEstablishmentRepository {
  create: (formEstablishmentDto: FormEstablishmentDto) => Promise<void>;
  update: (formEstablishmentDto: FormEstablishmentDto) => Promise<void>;
  delete: (siret: SiretDto) => Promise<void>;

  getBySiret: (siret: SiretDto) => Promise<FormEstablishmentDto | undefined>;
  getAll: () => Promise<FormEstablishmentDto[]>;
}

export const formEstablishementUpdateFailedErrorMessage = (
  dto: FormEstablishmentDto,
): string =>
  `Cannot update form establishlment DTO with siret ${dto.siret}, since it is not found.`;

export const formEstablishmentNotFoundErrorMessage = (
  siret: SiretDto,
): string => `Form establishment with siret ${siret} not found.`;
