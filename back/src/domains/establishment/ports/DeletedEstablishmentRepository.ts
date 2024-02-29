import { SiretDto } from "shared";

export type DeletedEstablishementDto = {
  siret: SiretDto;
  createdAt: Date;
  deletedAt: Date;
};

export interface DeletedEstablishmentRepository {
  areSiretsDeleted(
    siretsToCheck: SiretDto[],
  ): Promise<Record<SiretDto, boolean>>;
  save(deleteEstablishment: DeletedEstablishementDto): Promise<void>;
}
