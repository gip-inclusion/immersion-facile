import { AdminToken } from "shared/src/admin/admin.dto";
import { ExportDataDto } from "shared/src/exportable";

export interface ExcelExportGateway {
  exportData: (adminToken: AdminToken, exportDataDto: ExportDataDto) => void;
}
