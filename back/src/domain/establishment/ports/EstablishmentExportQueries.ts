import { EstablishmentRawProps } from "../valueObjects/EstablishmentRawBeforeExportVO";
import { FormSourceProvider } from "shared/src/establishmentExport/establishmentExport.dto";

export interface EstablishmentExportQueries {
  getAllEstablishmentsForExport: () => Promise<EstablishmentRawProps[]>;
  getEstablishmentsBySourceProviderForExport: (
    sourceProvider: FormSourceProvider,
  ) => Promise<EstablishmentRawProps[]>;
}
