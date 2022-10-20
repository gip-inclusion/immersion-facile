import * as excel from "exceljs";
import { AddWorksheetOptions, Column, Worksheet } from "exceljs";
import * as fse from "fs-extra";

enum WorksheetOptionsConfigurations {
  RowAsHeaderDisplay = "rowAsHeaderDisplay",
}

const rowAsHeaderDisplay: Partial<AddWorksheetOptions> = {
  views: [{ state: "frozen", ySplit: 1 }],
};

const configs: Record<string, Partial<AddWorksheetOptions>> = {
  [WorksheetOptionsConfigurations.RowAsHeaderDisplay]: rowAsHeaderDisplay,
};

// prettier-ignore
export class Workbook extends excel.Workbook {
  public withCustomFieldsHeaders(
    customColumns: Partial<Column>[],
  ): Workbook {
    this.getWorksheet("main").columns = customColumns;
    return this;
  }

  public withPayload(payload: any[]) {
    const worksheet = this.getWorksheet("main");
    payload.map((entity: any) => {
      worksheet.addRow({ ...entity });
    });

    return this;
  }

  public withSheet(): Workbook {
    this.addWorksheet(
      "main",
      configs[WorksheetOptionsConfigurations.RowAsHeaderDisplay],
    );
    return this;
  }

  public withConditionalFormatting(
    sheet: string,
    options: excel.ConditionalFormattingOptions,
  ): Workbook {
    const worksheet: Worksheet = this.getWorksheet(sheet);
    worksheet.addConditionalFormatting(options);

    return this;
  }

  public withTitle(title: string): Workbook {
    this.title = title;
    return this;
  }

  public async toXlsx(path?: string): Promise<string> {
    const fileName = `${this.title}.xlsx`;
    const directoryPath: string = path ? path : `./`;
    const xlsFilePath = `${directoryPath}/${fileName}`;
    const stream = fse.createWriteStream(xlsFilePath);
    await this.xlsx.write(stream);
    return xlsFilePath;
  }
}
