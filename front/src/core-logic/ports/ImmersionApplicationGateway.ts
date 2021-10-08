import { EstablishmentInfoFromSiretApi } from "src/core-logic/ports/EstablishmentInfoFromSiretApi";
import {
  AddImmersionApplicationMLResponseDto,
  ImmersionApplicationDto,
  ImmersionApplicationId,
} from "src/shared/ImmersionApplicationDto";

export interface ImmersionApplicationGateway {
  add: (immersionApplicationDto: ImmersionApplicationDto) => Promise<string>;
  addML: (
    immersionApplicationDto: ImmersionApplicationDto,
  ) => Promise<AddImmersionApplicationMLResponseDto>;
  get: (id: ImmersionApplicationId) => Promise<ImmersionApplicationDto>;
  getML: (jwt: string) => Promise<ImmersionApplicationDto>;

  update: (immersionApplicationDto: ImmersionApplicationDto) => Promise<string>;
  updateML: (
    immersionApplicationDto: ImmersionApplicationDto,
    jwt: string,
  ) => Promise<string>;
  // Calls validate-demande on backend.
  validate: (id: ImmersionApplicationId) => Promise<string>;

  getSiretInfo: (siret: string) => Promise<EstablishmentInfoFromSiretApi>;
  getAll: () => Promise<Array<ImmersionApplicationDto>>;
}
