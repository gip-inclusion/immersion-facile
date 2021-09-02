import { DemandeImmersionId } from "src/shared/DemandeImmersionDto";
import { DemandeImmersionEntity } from "src/domain/demandeImmersion/entities/DemandeImmersionEntity";

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
