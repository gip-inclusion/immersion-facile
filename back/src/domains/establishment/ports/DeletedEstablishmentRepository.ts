import { SiretDto } from "shared";

export type DeletedEstablishmentDto = {
  siret: SiretDto;
  createdAt: Date;
  deletedAt: Date;
};

export interface DeletedEstablishmentRepository {
  areSiretsDeleted(
    siretsToCheck: SiretDto[],
  ): Promise<Record<SiretDto, boolean>>;
  save(deleteEstablishment: DeletedEstablishmentDto): Promise<void>;
}
