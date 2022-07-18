import { ExportedRow, SheetName } from "./ExportQueries";

export interface ExportGateway {
  save: (
    exportables: Record<SheetName, ExportedRow[]>,
    fileName: string,
  ) => Promise<string>;
}
