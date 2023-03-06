import { BackOfficeJwt, ExportDataDto } from "shared";

export interface ExcelExportGateway {
  exportData: (adminToken: BackOfficeJwt, exportDataDto: ExportDataDto) => void;
}
