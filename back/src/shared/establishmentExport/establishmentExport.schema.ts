import { z } from "zod";
import { EstablishmentExportConfigDto } from "./establishmentExport.dto";

export const establishmentExportSchemaObj = {
  groupKey: z.enum(["region", "department"]),
  aggregateProfession: z.boolean(),
  sourceProvider: z.enum([
    "all",
    "immersion-facile",
    "cci",
    "cma",
    "lesentreprises-sengagent",
    "unJeuneUneSolution",
  ]),
};

export const establishmentExportSchema: z.Schema<EstablishmentExportConfigDto> =
  z.object(establishmentExportSchemaObj);
