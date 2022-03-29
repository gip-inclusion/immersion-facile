import { PoolClient } from "pg";
import { format } from "date-fns";
import { valueOrFalse, optional } from "./pgUtils";
import { EstablishmentExportQueries } from "../../../domain/establishment/ports/EstablishmentExportQueries";
import { EstablishmentRawProps } from "../../../domain/establishment/valueObjects/EstablishmentRawBeforeExportVO";

export class PgEstablishmentExportQueries
  implements EstablishmentExportQueries
{
  constructor(private client: PoolClient) {}

  public async getAllEstablishmentsForExport(): Promise<
    EstablishmentRawProps[]
  > {
    const pgEstablishmentResult = await this.client.query(`
      SELECT 
        establishments.siret, 
        establishments.name, 
        establishments.address,
        establishments.naf_code,
        establishments.customized_name, 
        establishments.creation_date, 
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
      `);

    return pgEstablishmentResult.rows.map((row) => ({
      siret: row.siret,
      name: row.name,
      customizedName: optional(row.customized_name),
      address: row.address,
      nafCode: optional(row.naf_code),
      createdAt: format(row.creation_date, "dd/MM/yyyy"),
      isCommited: valueOrFalse(row.is_commited),
      professions: `${row.rome_code} - ${row.libelle_appellation_court}`,
      preferredContactMethods: row.contact_mode,
    }));
  }
}
