import { keys } from "ramda";
import { ExportGateway } from "../../../domain/backoffice/ports/ExportGateway";
import {
  ExportedRow,
  SheetName,
} from "../../../domain/backoffice/ports/ExportQueries";
import { Archive } from "../../../utils/Archive";
import {
  makeTemporaryStorageFile,
  retrieveParentDirectory,
} from "../../../utils/filesystemUtils";
import { Workbook } from "../../../utils/Workbook";

export class ExcelExportGateway implements ExportGateway {
  async save(
    exportables: Record<SheetName, ExportedRow[]>,
    fileName: string,
  ): Promise<string> {
    const path = await makeTemporaryStorageFile(`${fileName}.zip`);
    const createdFilenames = await Promise.all(
      keys(exportables).map((sheetName) =>
        toWorkbook(sheetName.replace("/", " "), exportables[sheetName]).toXlsx(
          retrieveParentDirectory(path),
        ),
      ),
    );
    const zipArchive = new Archive(path);
    await zipArchive.addFiles(createdFilenames, { removeOriginal: true });
    return path;
  }
}

const toWorkbook = (workbookTitle: string, rows: ExportedRow[]): Workbook =>
  new Workbook()
    .withTitle(workbookTitle)
    .withSheet()
    .withConditionalFormatting("main", {
      ref: `H2:I${rows.length}`,
      rules: [
        {
          priority: 0,
          type: "containsText",
          operator: "containsText",
          text: "Oui",
          style: {
            fill: {
              type: "pattern",
              pattern: "solid",
              bgColor: { argb: "FF24C157" },
            },
          },
        },
        {
          priority: 1,
          type: "containsText",
          operator: "containsText",
          text: "Non déclaré",
          style: {
            fill: {
              type: "pattern",
              pattern: "solid",
              bgColor: { argb: "FFEA2020" },
            },
          },
        },
      ],
    })
    .withCustomFieldsHeaders(
      keys(rows[0]).map((fieldName) => ({
        header: fieldName,
        key: fieldName,
        width: inferWidthFromRows(rows, fieldName),
      })),
    )
    .withPayload(rows);

const MIN_WIDTH = 15;
const MAX_WIDTH = 300;

const inferWidthFromRows = (rows: ExportedRow[], fieldName: string): number => {
  const cellValues = rows.map((row) =>
    typeof row[fieldName] === "string"
      ? (row[fieldName] as string)
      : JSON.stringify(row[fieldName]),
  );
  return Math.min(
    MAX_WIDTH,
    Math.max(
      MIN_WIDTH,
      fieldName.length,
      ...cellValues.map((cellValue) => cellValue.length),
    ),
  );
};
