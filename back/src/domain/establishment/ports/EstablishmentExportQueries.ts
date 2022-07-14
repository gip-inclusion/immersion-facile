import { FormSourceProvider } from "shared/src/establishmentExport/establishmentExport.dto";
import { EstablishmentRawProps } from "../valueObjects/EstablishmentRawBeforeExportVO";

export interface EstablishmentExportQueries {
  getAllEstablishmentsForExport: () => Promise<EstablishmentRawProps[]>;
  getEstablishmentsBySourceProviderForExport: (
    sourceProvider: FormSourceProvider,
  ) => Promise<EstablishmentRawProps[]>;
}
