import axios from "axios";
import { values } from "ramda";
import { AdminToken } from "shared/src/admin/admin.dto";
import { EstablishmentExportConfigDto } from "shared/src/establishmentExport/establishmentExport.dto";
import {
  exportConventionsExcelRoute,
  exportEstablismentsExcelRoute,
} from "shared/src/routes";
import { queryParamsAsString } from "shared/src/utils/queryParams";
import { ExcelExportGateway } from "src/core-logic/ports/ExcelExportGateway";

export class HttpExcelExportGateway implements ExcelExportGateway {
  public async exportConventions(adminToken: AdminToken) {
    const response = await axios.get(
      `/api/admin/excel/${exportConventionsExcelRoute}`,
      {
        headers: { authorization: adminToken },
        responseType: "arraybuffer",
      },
    );

    downloadData(response.data, "conventions");
  }

  public async exportEstablishments(
    adminToken: AdminToken,
    params: EstablishmentExportConfigDto,
  ) {
    const response = await axios.get(buildExportEstablishmentRoute(params), {
      headers: { authorization: adminToken },
      responseType: "arraybuffer",
    });

    const nameForParams = values(params).join("-");

    downloadData(response.data, `establishments_${nameForParams}`);
  }
}

const buildExportEstablishmentRoute = (params: EstablishmentExportConfigDto) =>
  `/api/admin/excel/${exportEstablismentsExcelRoute}?${queryParamsAsString<EstablishmentExportConfigDto>(
    params,
  )}`;

const downloadData = (dataToDownload: Buffer, filename: string) => {
  const blob = new Blob([dataToDownload], { type: "application/zip" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", `${filename}.zip`); //set download attribute to link
  document.body.appendChild(link);
  link.click(); // this will download file.zip
  link.remove();
};
