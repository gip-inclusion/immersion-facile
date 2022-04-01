import { PoolClient } from "pg";
import { format } from "date-fns";
import { valueOrFalse, optional } from "./pgUtils";
import { EstablishmentExportQueries } from "../../../domain/establishment/ports/EstablishmentExportQueries";
import { EstablishmentRawProps } from "../../../domain/establishment/valueObjects/EstablishmentRawBeforeExportVO";
import { FormSourceProvider } from "../../../shared/establishmentExport/establishmentExport.dto";
import {employeeRangeByTefenCode, TefenCode} from "../../../domain/immersionOffer/entities/EstablishmentEntity";

export class PgEstablishmentExportQueries
  implements EstablishmentExportQueries
{
  constructor(private client: PoolClient) {}

  public async getAllEstablishmentsForExport(): Promise<
    EstablishmentRawProps[]
  > {
    const pgEstablishmentResult = await this.client.query(
      sqlSelectAllEstablishmentsQuery,
    );
    return pgEstablishmentResult.rows.map(rowToEstablishmentRawProps);
  }

  public async getEstablishmentsBySourceProviderForExport(
    sourceProvider: FormSourceProvider,
  ): Promise<EstablishmentRawProps[]> {
    const pgEstablishmentResult = await this.client.query(
      sqlSelectAllEstablishmentsQueryWithSourceProviderFilter(sourceProvider),
    );

    return pgEstablishmentResult.rows.map(rowToEstablishmentRawProps);
  }
}

const sqlSelectAllEstablishmentsQuery = `
      SELECT 
        establishments.siret, 
        establishments.name, 
        establishments.address,
        establishments.naf_code,
        establishments.customized_name, 
        establishments.creation_date,
        establishments.number_employees,
        establishments.is_commited,
        immersion_offers.rome_code,
        public_appellations_data.libelle_appellation_court,
        immersion_contacts.contact_mode
      FROM establishments 
      LEFT JOIN immersion_offers ON establishments.siret = immersion_offers.siret
      LEFT JOIN public_appellations_data ON public_appellations_data.ogr_appellation = immersion_offers.rome_appellation
      LEFT JOIN establishments__immersion_contacts ON establishments.siret = establishments__immersion_contacts.establishment_siret
      LEFT JOIN immersion_contacts ON immersion_contacts.uuid = establishments__immersion_contacts.contact_uuid
      WHERE data_source = 'form'
      `;

const sqlSelectAllEstablishmentsQueryWithSourceProviderFilter = (
  sourceProvider: FormSourceProvider,
): string =>
  `${sqlSelectAllEstablishmentsQuery} AND source_provider = '${sourceProvider}'`;

const rowToEstablishmentRawProps = (row: any): EstablishmentRawProps => ({
  siret: row.siret,
  name: row.name,
  customizedName: optional(row.customized_name),
  address: row.address,
  nafCode: optional(row.naf_code),
  numberEmployeesRange: employeeRangeByTefenCode[row.number_employees as TefenCode],
  createdAt: format(row.creation_date, "dd/MM/yyyy"),
  isCommited: valueOrFalse(row.is_commited),
  professions: `${row.rome_code} - ${row.libelle_appellation_court}`,
  preferredContactMethods: row.contact_mode,
});
