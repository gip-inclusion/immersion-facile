import { EstablishmentRawProps } from "../valueObjects/EstablishmentRawBeforeExportVO";

export interface EstablishmentExportQueries {
  getAllEstablishmentsForExport: () => Promise<EstablishmentRawProps[]>;
}
