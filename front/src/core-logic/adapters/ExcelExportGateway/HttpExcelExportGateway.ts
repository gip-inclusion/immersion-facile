import { AxiosInstance } from "axios";
import { AdminToken } from "shared/src/admin/admin.dto";
import { ExportDataDto } from "shared/src/exportable";
import { exportRoute } from "src/../../shared/src/routes";

import { ExcelExportGateway } from "src/core-logic/ports/ExcelExportGateway";

export class HttpExcelExportGateway implements ExcelExportGateway {
  constructor(private readonly httpClient: AxiosInstance) {}
  public async exportData(
    adminToken: AdminToken,
    exportDataDto: ExportDataDto,
  ) {
    const response = await this.httpClient.post(
      `/api/admin/${exportRoute}`,
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

    downloadData(response.data, nameForParams);
  }
}

const downloadData = (dataToDownload: Buffer, filename: string) => {
  const blob = new Blob([dataToDownload], { type: "application/zip" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", `${filename}.zip`);
  document.body.appendChild(link);
  link.click(); // this will download file.zip
  link.remove();
};
