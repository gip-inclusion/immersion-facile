import { AxiosInstance } from "axios";
import axios from "axios";
import { AdminToken } from "shared/src/admin/admin.dto";
import { EstablishmentExportConfigDto } from "shared/src/establishmentExport/establishmentExport.dto";
import { ExportDataDto } from "shared/src/exportable";

import {
  exportConventionsExcelRoute,
  exportEstablismentsExcelRoute,
} from "shared/src/routes";
import { queryParamsAsString } from "shared/src/utils/queryParams";
import { ExcelExportGateway } from "src/core-logic/ports/ExcelExportGateway";

export class HttpExcelExportGateway implements ExcelExportGateway {
  constructor(private readonly httpClient: AxiosInstance) {}

  public async exportConventions(adminToken: AdminToken) {
    const response = await this.httpClient.get(
      `/admin/excel/${exportConventionsExcelRoute}`,
      {
        headers: { authorization: adminToken },
        responseType: "arraybuffer",
      },
    );

    downloadData(
      response.data,
      "conventions",
      response.headers["content-type"],
    );
  }

  public async exportEstablishments(
    adminToken: AdminToken,
    params: EstablishmentExportConfigDto,
  ) {
    const response = await axios.get(buildExportEstablishmentRoute(params), {
      headers: { authorization: adminToken },
      responseType: "arraybuffer",
    });

    // const nameForParams = values(params).join("-");
    downloadData(
      response.data,
      "etablissements",
      response.headers["content-type"],
    );
  }

  public async exportData(
    adminToken: AdminToken,
    exportDataDto: ExportDataDto,
  ) {
    const response = await axios.post(
      "/api/admin/excel/export",
      exportDataDto,
      {
        headers: { authorization: adminToken },
        responseType: "arraybuffer",
      },
    );
    const nameForParams = `${exportDataDto.fileName} ${
      exportDataDto.exportableParams.keyToGroupBy
        ? " par " + exportDataDto.exportableParams.keyToGroupBy
        : ""
    }`;

    downloadData(
      response.data,
      nameForParams,
      response.headers["content-type"],
    );
  }
}

const buildExportEstablishmentRoute = (params: EstablishmentExportConfigDto) =>
  `/admin/excel/${exportEstablismentsExcelRoute}?${queryParamsAsString<EstablishmentExportConfigDto>(
    params,
  )}`;

const downloadData = (
  dataToDownload: Buffer,
  filename: string,
  contentType: string,
) => {
  const extension = contentType.includes("zip") ? "zip" : "xlsx";
  // const blob = new Blob([dataToDownload], { type: "application/zip" });
  const blob = new Blob([dataToDownload], { type: contentType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", `${filename}.${extension}`);
  document.body.appendChild(link);
  link.click(); // this will download file.zip
  link.remove();
};
