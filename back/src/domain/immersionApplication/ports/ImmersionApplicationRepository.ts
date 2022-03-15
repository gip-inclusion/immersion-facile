import { ImmersionApplicationId } from "../../../shared/ImmersionApplication/ImmersionApplication.dto";
import { ImmersionApplicationEntity } from "../entities/ImmersionApplicationEntity";

export interface ImmersionApplicationRepository {
  save: (
    immersionApplicationEntity: ImmersionApplicationEntity,
  ) => Promise<ImmersionApplicationId | undefined>;
  getAll: () => Promise<ImmersionApplicationEntity[]>;
  getById: (
    id: ImmersionApplicationId,
  ) => Promise<ImmersionApplicationEntity | undefined>;
  updateImmersionApplication: (
    immersionApplicationEntity: ImmersionApplicationEntity,
  ) => Promise<ImmersionApplicationId | undefined>;
}
