import { SiretDto } from "shared";

export type DeletedEstablishementDto = {
  siret: SiretDto;
  createdAt: Date;
  deletedAt: Date;
};

export interface DeletedEstablishmentRepository {
  save(deleteEstablishment: DeletedEstablishementDto): Promise<void>;
}
