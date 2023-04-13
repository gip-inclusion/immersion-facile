import { GetExportableParams } from "shared";

import {
  ExportedRow,
  ExportQueries,
  SheetName,
} from "../../domain/backoffice/ports/ExportQueries";

export class InMemoryExportQueries implements ExportQueries {
  public exported = {} as Record<SheetName, ExportedRow[]>;
  public async getFromExportable(
    _exportableParams: GetExportableParams,
  ): Promise<Record<SheetName, ExportedRow[]>> {
    return this.exported;
  }
}
