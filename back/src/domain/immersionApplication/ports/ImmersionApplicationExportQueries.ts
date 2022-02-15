import { ImmersionApplicationRawBeforeExportVO } from "../valueObjects/ImmersionApplicationRawBeforeExportVO";

export interface ImmersionApplicationExportQueries {
  getAllApplicationsForExport: () => Promise<
    ImmersionApplicationRawBeforeExportVO[]
  >;
}
