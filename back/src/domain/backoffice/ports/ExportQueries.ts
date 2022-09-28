import { GetExportableParams } from "shared";
import { Flavor } from "shared";

export type ExportedRow = Record<string, unknown>;
export type SheetName = Flavor<string, "SheetName">;

export interface ExportQueries {
  getFromExportable: (
    exportable: GetExportableParams,
  ) => Promise<Record<SheetName, ExportedRow[]>>;
}
