import { ImmersionApplicationId } from "shared/src/ImmersionApplication/ImmersionApplication.dto";
import { ImmersionApplicationEntity } from "../entities/ImmersionApplicationEntity";

export interface ImmersionApplicationRepository {
  save: (
    immersionApplicationEntity: ImmersionApplicationEntity,
  ) => Promise<ImmersionApplicationId | undefined>;
  getLatestUpdated: () => Promise<ImmersionApplicationEntity[]>;
  getById: (
    id: ImmersionApplicationId,
  ) => Promise<ImmersionApplicationEntity | undefined>;
  updateImmersionApplication: (
    immersionApplicationEntity: ImmersionApplicationEntity,
  ) => Promise<ImmersionApplicationId | undefined>;
}
