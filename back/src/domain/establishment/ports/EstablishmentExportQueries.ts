import { EstablishmentRawProps } from "../valueObjects/EstablishmentRawBeforeExportVO";
import { FormSourceProvider } from "../../../shared/establishmentExport/establishmentExport.dto";

export interface EstablishmentExportQueries {
  getAllEstablishmentsForExport: () => Promise<EstablishmentRawProps[]>;
  getEstablishmentsBySourceProviderForExport: (
    sourceProvider: FormSourceProvider,
  ) => Promise<EstablishmentRawProps[]>;
}
