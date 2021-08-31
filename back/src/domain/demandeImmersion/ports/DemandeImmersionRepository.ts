import { DemandeImmersionEntity } from "../entities/DemandeImmersionEntity";
import { DemandeImmersionIdEntity } from "../entities/DemandeImmersionIdEntity";

export interface DemandeImmersionRepository {
  save: (
    demandeImmersionEntity: DemandeImmersionEntity
  ) => Promise<DemandeImmersionIdEntity>;
  getAll: () => Promise<DemandeImmersionEntity[]>;
  getById: (
    id: DemandeImmersionIdEntity
  ) => Promise<DemandeImmersionEntity | undefined>;
  updateDemandeImmersion: (
    id: DemandeImmersionIdEntity,
    demandeImmersion: DemandeImmersionEntity
  ) => Promise<DemandeImmersionIdEntity | undefined>;
}
