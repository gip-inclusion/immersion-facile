import { ImmersionApplicationEntity } from "../entities/ImmersionApplicationEntity";
import { ImmersionApplicationRawBeforeExportVO } from "../valueObjects/ImmersionApplicationRawBeforeExportVO";

export interface ImmersionApplicationQueries {
  getAllApplicationsForExport: () => Promise<
    ImmersionApplicationRawBeforeExportVO[]
  >;
  getLatestUpdated: () => Promise<ImmersionApplicationEntity[]>;
}
