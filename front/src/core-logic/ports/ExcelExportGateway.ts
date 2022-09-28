import { AdminToken } from "shared";
import { ExportDataDto } from "shared";

export interface ExcelExportGateway {
  exportData: (adminToken: AdminToken, exportDataDto: ExportDataDto) => void;
}
