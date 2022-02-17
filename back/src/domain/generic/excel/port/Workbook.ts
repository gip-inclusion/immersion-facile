import { Column, Worksheet } from "exceljs";
import * as excel from "exceljs";
import { AddWorksheetOptions } from "exceljs";
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
export class Workbook<T extends Record<string, unknown>> extends excel.Workbook {
  public withCustomFieldsHeaders(
    customColumns: Partial<Column>[],
  ): Workbook<T> {
    this.getWorksheet("main").columns = customColumns;
    return this;
  }

  public withPayload(payload: T[]) {
    const worksheet = this.getWorksheet("main");
    payload.map((entity: T) => {
      worksheet.addRow({ ...entity });
    });

    return this;
  }

  public withSheet(): Workbook<T> {
    this.addWorksheet(
      "main",
      configs[WorksheetOptionsConfigurations.RowAsHeaderDisplay],
    );
    return this;
  }

  public withConditionalFormatting(
    sheet: string,
    options: excel.ConditionalFormattingOptions,
  ): Workbook<T> {
    const worksheet: Worksheet = this.getWorksheet(sheet);
    worksheet.addConditionalFormatting(options);

    return this;
  }

  public withTitle(title: string): Workbook<T> {
    this.title = title;
    return this;
  }

  public async toXlsx(pathMapper?: (path: string) => string): Promise<string> {
    const fileName = `${this.title}.xlsx`;
    const path: string = pathMapper ? pathMapper(fileName) : `./${fileName}`;
    const stream = fse.createWriteStream(path);
    await this.xlsx.write(stream);
    return path;
  }
}
