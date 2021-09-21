import {
  DemandeImmersionDto,
  DemandeImmersionId,
} from "src/shared/DemandeImmersionDto";

export interface DemandeImmersionGateway {
  add: (demandeImmersionDto: DemandeImmersionDto) => Promise<string>;
  get: (id: DemandeImmersionId) => Promise<DemandeImmersionDto>;
  update: (demandeImmersionDto: DemandeImmersionDto) => Promise<string>;
  // Calls validate-demande on backend.
  validate: (id: DemandeImmersionId) => Promise<string>;

  getSiretInfo: (siret: string) => Promise<Object>;
  getAll: () => Promise<Array<DemandeImmersionDto>>;
}
