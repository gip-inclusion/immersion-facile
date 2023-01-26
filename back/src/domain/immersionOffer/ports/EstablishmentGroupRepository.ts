import { EstablishmentGroupEntity } from "../entities/EstablishmentGroupEntity";

export interface EstablishmentGroupRepository {
  save: (group: EstablishmentGroupEntity) => Promise<void>;
}
