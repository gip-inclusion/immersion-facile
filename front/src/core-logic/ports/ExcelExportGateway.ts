import { AdminToken, ExportDataDto } from "shared";

export interface ExcelExportGateway {
  exportData: (adminToken: AdminToken, exportDataDto: ExportDataDto) => void;
}
