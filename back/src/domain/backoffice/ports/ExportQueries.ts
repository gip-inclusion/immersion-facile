import { GetExportableParams } from "shared/src/exportable";
import { Flavor } from "shared/src/typeFlavors";

export type ExportedRow = Record<string, unknown>;
export type SheetName = Flavor<string, "SheetName">;

export interface ExportQueries {
  getFromExportable: (
    exportable: GetExportableParams,
  ) => Promise<Record<SheetName, ExportedRow[]>>;
}
