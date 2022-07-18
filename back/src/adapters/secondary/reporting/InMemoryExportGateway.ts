import { ExportGateway } from "../../../domain/backoffice/ports/ExportGateway";
import {
  ExportedRow,
  SheetName,
} from "../../../domain/backoffice/ports/ExportQueries";

export class InMemoryExportGateway implements ExportGateway {
  public savedExportables: Record<string, Record<SheetName, ExportedRow[]>> =
    {};

  async save(
    exportables: Record<SheetName, ExportedRow[]>,
    fileName: string,
  ): Promise<string> {
    this.savedExportables[fileName] = exportables;
    return fileName;
  }
}
