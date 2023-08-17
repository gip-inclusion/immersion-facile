import { SiretDto } from "shared";

export type DeletedEstablishementDto = {
  siret: SiretDto;
  createdAt: Date;
  deletedAt: Date;
};

export interface DeletedEstablishmentRepository {
  isSiretsDeleted(siretsToCheck: SiretDto[]): Promise<SiretDto[]>;
  save(deleteEstablishment: DeletedEstablishementDto): Promise<void>;
}
