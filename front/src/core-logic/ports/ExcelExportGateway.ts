import { AdminToken } from "shared/src/admin/admin.dto";
import { EstablishmentExportConfigDto } from "shared/src/establishmentExport/establishmentExport.dto";

export interface ExcelExportGateway {
  exportConventions: (adminToken: AdminToken) => void;
  exportEstablishments: (
    adminToken: AdminToken,
    params: EstablishmentExportConfigDto,
  ) => void;
}
