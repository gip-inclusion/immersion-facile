import {
  ApplicationSource,
  DemandeImmersionId,
} from "../../../shared/DemandeImmersionDto";
import { DemandeImmersionEntity } from "../entities/DemandeImmersionEntity";

export interface DemandeImmersionRepository {
  save: (
    demandeImmersionEntity: DemandeImmersionEntity
  ) => Promise<DemandeImmersionId | undefined>;
  getAll: () => Promise<DemandeImmersionEntity[]>;
  getById: (
    id: DemandeImmersionId
  ) => Promise<DemandeImmersionEntity | undefined>;
  updateDemandeImmersion: (
    demandeImmersion: DemandeImmersionEntity
  ) => Promise<DemandeImmersionId | undefined>;
}
