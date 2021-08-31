import { DemandeImmersionDto } from "src/shared/DemandeImmersionDto";

export interface DemandeImmersionGateway {
  add: (demandeImmersionDto: DemandeImmersionDto) => Promise<string>;
  get: (id: string) => Promise<DemandeImmersionDto>;
  update: (demandeImmersionDto: DemandeImmersionDto) => Promise<string>;

  getSiretInfo: (siret: string) => Promise<Object>;
  getAll: () => Promise<Array<DemandeImmersionDto>>;
}
