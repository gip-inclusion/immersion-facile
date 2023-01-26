import { EstablishmentGroupEntity } from "../entities/EstablishmentGroupEntity";

export interface EstablishmentGroupRepository {
  create: (group: EstablishmentGroupEntity) => Promise<void>;
}
