import { Workbook } from "exceljs";
import extract from "extract-zip";
import fs from "fs";
import * as path from "path";
import { ExcelExportGateway } from "./ExcelExportGateway";
import { makeTemporaryStorageFolder } from "../../../utils/filesystemUtils";

describe("ExcelExportGateway", () => {
  it("Saves a record of multiple sheets into an ZIP file", async () => {
    const gateway = new ExcelExportGateway();
    const exportables = {
      Paris: [
        { Siret: "124", "Nom de l'entreprise": "une entreprise" },
        { Siret: "567", "Nom de l'entreprise": "une autre entreprise" },
      ],
      "Nantes métropole": [
        { Siret: "124", "Nom de l'entreprise": "une entreprise" },
        { Siret: "567", "Nom de l'entreprise": "une autre entreprise" },
      ],
    };
    const path = await gateway.save(exportables, "enterprises");

    // Assert
    expect(path).toContain("enterprises.zip");
    expect(fs.existsSync(path)).toBe(true);

    const workbook = new Workbook();
    await workbook.xlsx.readFile(path);

    // Zip folder should contain 2 excel named "Nantes métropole" and "Paris"
    const files = await unzip(path);
    expect(files).toHaveLength(2);
    expect(files[0]).toContain("Nantes métropole.xlsx");
    expect(files[1]).toContain("Paris.xlsx");

    // Verify the content of the sheets
    const nantesWorksheet = await getWorksheet(files[0]);
    const header = nantesWorksheet.getRow(1);
    const columnNames = [1, 2, 3].map(
      (cellIndex) => header.getCell(cellIndex).value,
    );
    expect(columnNames).toEqual(["Siret", "Nom de l'entreprise", null]);
    expect(nantesWorksheet.getRow(2).getCell(1).value).toBe("124");
    expect(nantesWorksheet.getRow(2).getCell(2).value).toBe("une entreprise");
    expect(nantesWorksheet.getRow(3).getCell(1).value).toBe("567");
    expect(nantesWorksheet.getRow(3).getCell(2).value).toBe(
      "une autre entreprise",
    );
  });
});

const unzip = async (zipPath: string): Promise<string[]> => {
  const unzipFolderpPath = await makeTemporaryStorageFolder();
  await extract(zipPath, { dir: unzipFolderpPath });
  const files = fs.readdirSync(unzipFolderpPath);
  return files.map((file) => path.join(unzipFolderpPath, file));
};
const getWorksheet = async (xlsxPath: string) => {
  const workbook = new Workbook();
  await workbook.xlsx.readFile(xlsxPath);

  const worksheets = workbook.worksheets;
  expect(worksheets).toHaveLength(1);
  const worksheet = worksheets[0];
  return worksheet;
};
