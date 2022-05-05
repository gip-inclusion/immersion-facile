import { PoolClient } from "pg";
import format from "pg-format";
import {
  EstablishmentAggregate,
  EstablishmentEntityV2,
} from "../../../domain/immersionOffer/entities/EstablishmentEntity";
import { SearchMade } from "../../../domain/immersionOffer/entities/SearchMadeEntity";
import { EstablishmentAggregateRepository } from "../../../domain/immersionOffer/ports/EstablishmentAggregateRepository";
import { LatLonDto } from "shared/src/latLon";
import { AppellationDto } from "shared/src/romeAndAppellationDtos/romeAndAppellation.dto";
import { SearchImmersionResultDto } from "shared/src/searchImmersion/SearchImmersionResult.dto";
import { SiretDto } from "shared/src/siret";

import { createLogger } from "../../../utils/logger";
import { optional } from "./pgUtils";

const logger = createLogger(__filename);

export type PgDataSource = "api_labonneboite" | "form";

export class PgEstablishmentAggregateRepository
  implements EstablishmentAggregateRepository
{
  constructor(private client: PoolClient) {}

  public async insertEstablishmentAggregates(
    aggregates: EstablishmentAggregate[],
  ) {
    await this._upsertEstablishmentsFromAggregates(aggregates);
    await this._insertContactsFromAggregates(aggregates);
    await this._upsertImmersionOffersFromAggregates(aggregates);

    return;
  }
  public async updateEstablishmentAggregate(aggregate: EstablishmentAggregate) {
    await this._upsertEstablishmentsFromAggregates([aggregate]);
    throw new Error("Not implemented");
  }
  private async _upsertEstablishmentsFromAggregates(
    aggregates: EstablishmentAggregate[],
  ) {
    const establishmentFields = aggregates.map(({ establishment }) => [
      establishment.siret,
      establishment.name,
      establishment.customizedName,
      establishment.address,
      establishment.numberEmployeesRange,
      establishment.nafDto.code,
      establishment.nafDto.nomenclature,
      establishment.dataSource,
      establishment.sourceProvider,
      convertPositionToStGeography(establishment.position),
      establishment.position.lon,
      establishment.position.lat,
      establishment.updatedAt ? establishment.updatedAt.toISOString() : null,
      establishment.isActive,
      establishment.isSearchable,
      establishment.isCommited,
    ]);

    if (establishmentFields.length === 0) return;

    try {
      const query = fixStGeographyEscapingInQuery(
        format(
          `INSERT INTO establishments (
          siret, name, customized_name, address, number_employees, naf_code, naf_nomenclature, data_source, source_provider, gps, lon, lat, update_date, is_active, is_searchable, is_commited
        ) VALUES %L
        ON CONFLICT
          ON CONSTRAINT establishments_pkey
            DO UPDATE
              SET
                name=EXCLUDED.name,
                address=EXCLUDED.address,
                number_employees=EXCLUDED.number_employees,
                naf_code=EXCLUDED.naf_code,
                data_source=EXCLUDED.data_source
              WHERE
                EXCLUDED.data_source='form'
                OR (
                  establishments.data_source != 'form'
                  AND (
                    establishments.data_source = 'api_labonneboite'
                  )
                )`,
          establishmentFields,
        ),
      );
      await this.client.query(query);
    } catch (e: any) {
      logger.error(e, "Error inserting establishments");
      throw e;
    }
  }

  private async _insertContactsFromAggregates(
    aggregates: EstablishmentAggregate[],
  ) {
    const aggregatesWithContact = aggregates.filter(
      (establishment): establishment is Required<EstablishmentAggregate> =>
        !!establishment.contact,
    );

    if (aggregatesWithContact.length === 0) return;

    const contactFields = aggregatesWithContact.map((aggregate) => {
      const contact = aggregate.contact;
      return [
        contact.id,
        contact.lastName,
        contact.firstName,
        contact.email,
        contact.job,
        contact.phone,
        contact.contactMethod,
        JSON.stringify(contact.copyEmails),
      ];
    });

    const establishmentContactFields = aggregatesWithContact.map(
      ({ establishment, contact }) => [establishment.siret, contact.id],
    );

    try {
      const insertContactsQuery = format(
        `INSERT INTO immersion_contacts (
        uuid, lastname, firstname, email, role, phone, contact_mode, copy_emails
      ) VALUES %L`,
        contactFields,
      );

      const insertEstablishmentsContactsQuery = format(
        `INSERT INTO establishments__immersion_contacts (
        establishment_siret, contact_uuid) VALUES %L`,
        establishmentContactFields,
      );

      await this.client.query(insertContactsQuery);
      await this.client.query(insertEstablishmentsContactsQuery);
    } catch (e: any) {
      logger.error(e, "Error inserting contacts");
    }
  }

  private async _upsertImmersionOffersFromAggregates(
    aggregates: EstablishmentAggregate[],
  ) {
    const immersionOfferFields: any[][] = aggregates.flatMap(
      ({ establishment, immersionOffers }) =>
        immersionOffers.map((immersionOffer) => [
          immersionOffer.id,
          immersionOffer.romeCode,
          immersionOffer.appellationCode,
          establishment.siret,
          immersionOffer.score,
        ]),
    );

    if (immersionOfferFields.length === 0) return;

    try {
      const query = format(
        `INSERT INTO immersion_offers (
          uuid, rome_code, rome_appellation, siret, score
        ) VALUES %L`,
        immersionOfferFields,
      );

      await this.client.query(query);
    } catch (e: any) {
      logger.error(e, "Error inserting immersion offers");
    }
  }

  async getSearchImmersionResultDtoFromSearchMade({
    searchMade,
    withContactDetails = false,
    maxResults,
  }: {
    searchMade: SearchMade;
    withContactDetails?: boolean;
    maxResults?: number;
  }): Promise<SearchImmersionResultDto[]> {
    const selectedOffersSubQuery = format(
      `
    WITH active_establishments_within_area AS (SELECT siret, (data_source = 'form')::boolean AS voluntary_to_immersion, gps FROM establishments WHERE is_active AND is_searchable AND ST_DWithin(gps, ST_GeographyFromText($1), $2) ${filterOnVoluntaryToImmersion(
      searchMade.voluntary_to_immersion,
    )}) 
        SELECT aewa.siret, rome_code, prd.libelle_rome as rome_label, ST_Distance(gps, ST_GeographyFromText($1)) AS distance_m,
        COALESCE(json_agg(distinct libelle_appellation_long) FILTER (WHERE libelle_appellation_long IS NOT NULL), '[]') AS appellation_labels
        FROM active_establishments_within_area aewa 
        LEFT JOIN immersion_offers io ON io.siret = aewa.siret 
        LEFT JOIN public_appellations_data pad ON io.rome_appellation = pad.ogr_appellation
        LEFT JOIN public_romes_data prd ON io.rome_code = prd.code_rome
        ${searchMade.rome ? "WHERE rome_code = %1$L" : ""}
        GROUP BY(aewa.siret, aewa.gps, aewa.voluntary_to_immersion, io.rome_code, prd.libelle_rome)
        ORDER BY aewa.voluntary_to_immersion DESC
        LIMIT $3`,
      searchMade.rome,
    ); // Formats optional litterals %1$L

    const immersionSearchResultDtos =
      await this.selectImmersionSearchResultDtoQueryGivenSelectedOffersSubQuery(
        selectedOffersSubQuery,
        [
          `POINT(${searchMade.lon} ${searchMade.lat})`,
          searchMade.distance_km * 1000, // Formats parameters $1, $2
          maxResults,
        ],
      );
    return immersionSearchResultDtos.map((dto) => ({
      ...dto,
      contactDetails: withContactDetails ? dto.contactDetails : undefined,
    }));
  }

  public async getActiveEstablishmentSiretsFromLaBonneBoiteNotUpdatedSince(
    since: Date,
  ): Promise<string[]> {
    const query = `
      SELECT siret FROM establishments
      WHERE is_active AND 
      data_source = 'api_labonneboite' AND
      (update_date IS NULL OR 
       update_date < $1)`;
    const pgResult = await this.client.query(query, [since.toISOString()]);
    return pgResult.rows.map((row) => row.siret);
  }

  public async getSiretOfEstablishmentsFromFormSource(): Promise<string[]> {
    const query = `
      SELECT siret FROM establishments
      WHERE data_source = 'form'`;
    const pgResult = await this.client.query(query);
    return pgResult.rows.map((row) => row.siret);
  }

  public async removeEstablishmentAndOffersAndContactWithSiret(
    siret: string,
  ): Promise<void> {
    const query = `
      DELETE FROM establishments WHERE siret = $1;`;
    await this.client.query(query, [siret]);
  }

  public async updateEstablishment(
    siret: string,
    propertiesToUpdate: Partial<
      Pick<
        EstablishmentEntityV2,
        "address" | "position" | "nafDto" | "numberEmployeesRange" | "isActive"
      >
    > & { updatedAt: Date },
  ): Promise<void> {
    const updateQuery = `UPDATE establishments
                   SET update_date = %1$L
                   ${
                     propertiesToUpdate.isActive !== undefined
                       ? ", is_active=%2$L"
                       : ""
                   }
                   ${propertiesToUpdate.nafDto ? ", naf_code=%3$L" : ""}
                   ${propertiesToUpdate.nafDto ? ", naf_nomenclature=%4$L" : ""}
                   ${
                     propertiesToUpdate.numberEmployeesRange
                       ? ", number_employees=%5$L"
                       : ""
                   }
                   ${
                     propertiesToUpdate.address && propertiesToUpdate.position // Update address and position together.
                       ? ", address=%6$L, gps=ST_GeographyFromText(%7$L), lon=%8$L, lat=%9$L"
                       : ""
                   }
                   WHERE siret=%10$L;`;
    const queryArgs = [
      propertiesToUpdate.updatedAt.toISOString(),
      propertiesToUpdate.isActive,
      propertiesToUpdate.nafDto?.code,
      propertiesToUpdate.nafDto?.nomenclature,
      propertiesToUpdate.numberEmployeesRange,
      propertiesToUpdate.address,
      propertiesToUpdate.position
        ? `POINT(${propertiesToUpdate.position.lon} ${propertiesToUpdate.position.lat})`
        : undefined,
      propertiesToUpdate.position?.lon,
      propertiesToUpdate.position?.lat,
      siret,
    ];
    const formatedQuery = format(updateQuery, ...queryArgs);
    await this.client.query(formatedQuery);
  }

  public async hasEstablishmentFromFormWithSiret(
    siret: string,
  ): Promise<boolean> {
    const pgResult = await this.client.query(
      `SELECT EXISTS (SELECT 1 FROM establishments WHERE siret = $1 AND data_source='form');`,
      [siret],
    );
    return pgResult.rows[0].exists;
  }

  public async getOffersAsAppelationDtoForFormEstablishment(
    siret: string,
  ): Promise<AppellationDto[]> {
    const pgResult = await this.client.query(
      `SELECT io.*, libelle_rome, libelle_appellation_long, ogr_appellation
       FROM immersion_offers io
       JOIN public_romes_data prd ON prd.code_rome = io.rome_code 
       LEFT JOIN public_appellations_data pad on io.rome_appellation = pad.ogr_appellation
       WHERE siret = $1;`,
      [siret],
    );
    return pgResult.rows.map((row: any) => ({
      romeCode: row.rome_code,
      appellationCode:
        optional(row.ogr_appellation) && row.ogr_appellation.toString(),
      romeLabel: row.libelle_rome,
      appellationLabel: row.libelle_appellation_long, // libelle_appellation_long should not be undefined
    }));
  }

  public async getSearchImmersionResultDtoBySiretAndRome(
    siret: SiretDto,
    rome: string,
  ): Promise<SearchImmersionResultDto | undefined> {
    const immersionSearchResultDtos =
      await this.selectImmersionSearchResultDtoQueryGivenSelectedOffersSubQuery(
        `
      SELECT siret, io.rome_code, rome_label, COALESCE(json_agg(appellation_label) FILTER (WHERE appellation_label IS NOT NULL), '[]') AS appellation_labels, null AS distance_m
      FROM immersion_offers AS io
      LEFT JOIN view_appellations_dto AS vad ON vad.appellation_code = io.rome_appellation 
      WHERE io.siret = $1 AND io.rome_code = $2
      GROUP BY (siret, io.rome_code, rome_label)`,
        [siret, rome],
      );
    return immersionSearchResultDtos[0];
  }
  private async selectImmersionSearchResultDtoQueryGivenSelectedOffersSubQuery(
    selectedOffersSubQuery: string,
    selectedOffersSubQueryParams: any[],
  ): Promise<SearchImmersionResultDto[]> {
    // Given a subquery and its parameters to select immersion offers (with columns siret, rome_code, rome_label, appellation_labels and distance_m),
    // this method returns a list of SearchImmersionResultDto
    const pgResult = await this.client.query(
      makeSelectImmersionSearchResultDtoQueryGivenSelectedOffersSubQuery(
        selectedOffersSubQuery,
      ),
      selectedOffersSubQueryParams,
    );
    return pgResult.rows.map((row) => ({
      ...row.search_immersion_result,
      // TODO : find a way to return 'undefined' instead of 'null' from query
      customizedName: optional(row.search_immersion_result.customizedName),
      contactMode: optional(row.search_immersion_result.contactMode),
      contactDetails: optional(row.search_immersion_result.contactDetails),
      distance_m: optional(row.search_immersion_result.distance_m),
      numberOfEmployeeRange: optional(
        row.search_immersion_result.numberOfEmployeeRange,
      ),
    }));
  }
  async getEstablishmentAggregateBySiret(
    _siret: SiretDto,
  ): Promise<EstablishmentAggregate | undefined> {
    await this.client.query(``);
    throw new Error("Not implemented");
  }
}

const convertPositionToStGeography = ({ lat, lon }: LatLonDto) =>
  `ST_GeographyFromText('POINT(${lon} ${lat})')`;

const reStGeographyFromText =
  /'ST_GeographyFromText\(''POINT\((-?\d+(\.\d+)?)\s(-?\d+(\.\d+)?)\)''\)'/g;

// Remove any repeated single quotes ('') inside ST_GeographyFromText.
// TODO : find a better way than that : This is due to the Literal formatting that turns all simple quote into double quote.
const fixStGeographyEscapingInQuery = (query: string) =>
  query.replace(reStGeographyFromText, "ST_GeographyFromText('POINT($1 $3)')");

const filterOnVoluntaryToImmersion = (voluntaryToImmersion?: boolean) => {
  if (voluntaryToImmersion === undefined) return "";

  return voluntaryToImmersion
    ? "AND data_source = 'form'"
    : "AND data_source != 'form'";
};

const makeSelectImmersionSearchResultDtoQueryGivenSelectedOffersSubQuery = (
  selectedOffersSubQuery: string, // Query should return a view with required columns siret, rome_code, rome_label, appellation_labels and distance_m
) => `
      WITH unique_establishments__immersion_contacts AS ( SELECT DISTINCT ON (establishment_siret) establishment_siret, contact_uuid FROM establishments__immersion_contacts ), 
           match_immersion_offer AS (${selectedOffersSubQuery}) 
      SELECT JSONB_BUILD_OBJECT(
      'rome', io.rome_code, 
      'siret', io.siret, 
      'distance_m', io.distance_m, 
      'name', e.name, 
      'customizedName', e.customized_name, 
      'voluntaryToImmersion', e.data_source = 'form',
      'location', JSON_BUILD_OBJECT('lon', e.lon, 'lat', e.lat), 
      'romeLabel', io.rome_label,
      'appellationLabels',  io.appellation_labels,
      'naf', e.naf_code,
      'nafLabel', public_naf_classes_2008.class_label,
      'address', e.address, 
      'city', (REGEXP_MATCH(e.address,  '^.*\\d{5}\\s(.*)$'))[1],
      'contactMode', ic.contact_mode,
      'contactDetails', JSON_BUILD_OBJECT('id', ic.uuid, 'firstName', ic.firstname, 'lastName', ic.lastname, 'email', ic.email, 'role', ic.role, 'phone', ic.phone ),
      'numberOfEmployeeRange', e.number_employees 
      ) AS search_immersion_result
      FROM match_immersion_offer AS io 
      LEFT JOIN establishments AS e ON e.siret = io.siret  
      LEFT OUTER JOIN public_naf_classes_2008 ON (public_naf_classes_2008.class_id = REGEXP_REPLACE(naf_code,'(\\d\\d)(\\d\\d).', '\\1.\\2'))
      LEFT JOIN unique_establishments__immersion_contacts AS eic ON eic.establishment_siret = e.siret
      LEFT JOIN immersion_contacts AS ic ON ic.uuid = eic.contact_uuid`;
