import { CompanyInfoFromSiretApi } from "src/core-logic/ports/CompanyInfoFromSiretApi";
import {
  ImmersionApplicationDto,
  ImmersionApplicationId,
} from "src/shared/ImmersionApplicationDto";

export interface ImmersionApplicationGateway {
  add: (immersionApplicationDto: ImmersionApplicationDto) => Promise<string>;
  get: (id: ImmersionApplicationId) => Promise<ImmersionApplicationDto>;
  update: (immersionApplicationDto: ImmersionApplicationDto) => Promise<string>;
  // Calls validate-demande on backend.
  validate: (id: ImmersionApplicationId) => Promise<string>;

  getSiretInfo: (siret: string) => Promise<CompanyInfoFromSiretApi>;
  getAll: () => Promise<Array<ImmersionApplicationDto>>;
}
