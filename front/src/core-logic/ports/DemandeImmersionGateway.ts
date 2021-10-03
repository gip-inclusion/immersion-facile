import { CompanyInfoFromSiretApi } from "src/core-logic/ports/CompanyInfoFromSiretApi";
import type {
  ImmersionApplicationDto,
  ImmersionApplicationId,
} from "src/shared/ImmersionApplicationDto";

export interface DemandeImmersionGateway {
  add: (demandeImmersionDto: ImmersionApplicationDto) => Promise<string>;
  get: (id: ImmersionApplicationId) => Promise<ImmersionApplicationDto>;
  update: (demandeImmersionDto: ImmersionApplicationDto) => Promise<string>;
  // Calls validate-demande on backend.
  validate: (id: ImmersionApplicationId) => Promise<string>;

  getSiretInfo: (siret: string) => Promise<CompanyInfoFromSiretApi>;
  getAll: () => Promise<Array<ImmersionApplicationDto>>;
}
