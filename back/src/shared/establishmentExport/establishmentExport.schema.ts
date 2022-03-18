import { z } from "zod";
import { EstablishmentExportConfigDto } from "./establishmentExport.dto";

export const establishmentExportSchemaObj = {
  groupKey: z.enum(["region", "department"]),
  aggregateProfession: z.boolean(),
};

export const establishmentExportSchema: z.Schema<EstablishmentExportConfigDto> =
  z.object(establishmentExportSchemaObj);
