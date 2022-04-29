import { PoolClient } from "pg";
import format from "pg-format";
import { ContactEntityV2 } from "../../../domain/immersionOffer/entities/ContactEntity";
import {
  AnnotatedEstablishmentEntityV2,
  DataSource,
  EstablishmentAggregate,
  EstablishmentEntityV2,
} from "../../../domain/immersionOffer/entities/EstablishmentEntity";
import { SearchMade } from "../../../domain/immersionOffer/entities/SearchMadeEntity";
import { EstablishmentAggregateRepository } from "../../../domain/immersionOffer/ports/EstablishmentAggregateRepository";
import { LatLonDto } from "../../../shared/latLon";
import { AppellationDto } from "../../../shared/romeAndAppellationDtos/romeAndAppellation.dto";
import {
  SearchContactDto,
  SearchImmersionResultDto,
} from "../../../shared/searchImmersion/SearchImmersionResult.dto";
import { SiretDto } from "../../../shared/siret";

import { extractCityFromAddress } from "../../../utils/extractCityFromAddress";
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
    const query = `
      WITH unique_establishments__immersion_contacts AS (
        SELECT DISTINCT ON (establishment_siret) establishment_siret, contact_uuid FROM establishments__immersion_contacts
      ),
           matching_offers AS
            (WITH active_establishments_within_area AS (
                SELECT siret, 
                (data_source = 'form')::boolean AS voluntary_to_immersion
                FROM establishments 
                WHERE is_active AND is_searchable AND ST_DWithin(gps, ST_GeographyFromText($1), $2)
                ${filterOnVoluntaryToImmersion(
                  searchMade.voluntary_to_immersion,
                )}
                ) 
        SELECT aewa.siret, rome_code, voluntary_to_immersion,
        JSONB_AGG(distinct libelle_appellation_long) filter(WHERE libelle_appellation_long is not null) AS appellation_labels
        FROM immersion_offers io 
        RIGHT JOIN active_establishments_within_area aewa ON io.siret = aewa.siret 
        LEFT JOIN public_appellations_data pad ON (io.rome_appellation = pad.ogr_appellation) 
        ${searchMade.rome ? "WHERE rome_code = %1$L" : ""}
        GROUP BY(aewa.siret, voluntary_to_immersion, rome_code)
        ORDER BY aewa.voluntary_to_immersion DESC
        LIMIT $3
        )
    SELECT 
        establishments.name as establishment_name,
        establishments.customized_name as establishment_customized_name,
        number_employees, 
        address,
        naf_code,
        voluntary_to_immersion,
        establishments.siret AS establishment_siret,
        contact_uuid as contact_in_establishment_uuid,
        gps,
        ST_Distance(gps, ST_GeographyFromText($1)) AS distance_m,
        lon as establishment_lon,
        lat as establishment_lat,

        immersion_contacts.lastname,
        immersion_contacts.firstname,
        immersion_contacts.contact_mode,
        immersion_contacts.email,
        immersion_contacts.role,
        immersion_contacts.phone AS contact_phone,

        rome_code, 
        appellation_labels,

        public_naf_classes_2008.class_label,
        libelle_rome

    FROM establishments 
      RIGHT join matching_offers on establishments.siret = matching_offers.siret
      LEFT JOIN unique_establishments__immersion_contacts ue_ic ON ue_ic.establishment_siret = establishments.siret 
      LEFT JOIN immersion_contacts ON (contact_uuid = immersion_contacts.uuid)
      LEFT OUTER JOIN public_naf_classes_2008 ON (public_naf_classes_2008.class_id = REGEXP_REPLACE(naf_code,'(\\d\\d)(\\d\\d).', '\\1.\\2'))
      LEFT OUTER JOIN public_romes_data ON (rome_code = public_romes_data.code_rome)
      ORDER BY voluntary_to_immersion DESC, distance_m
    `;
    const formatedQuery = format(query, searchMade.rome); // Formats optional litterals %1$L and %2$L
    return this.client
      .query(formatedQuery, [
        `POINT(${searchMade.lon} ${searchMade.lat})`,
        searchMade.distance_km * 1000, // Formats parameters $1, $2
        maxResults,
      ])
      .then((res) =>
        res.rows.map((result) => {
          const immersionContact: SearchContactDto | null =
            result.contact_in_establishment_uuid != null
              ? {
                  id: result.contact_in_establishment_uuid,
                  firstName: result.contact_firstname,
                  lastName: result.contact_name,
                  email: result.contact_email,
                  role: result.contact_role,
                  phone: result.contact_phone,
                }
              : null;

          const searchImmersionResultDto: SearchImmersionResultDto = {
            rome: result.rome_code,
            romeLabel: result.libelle_rome,
            appellationLabels: result.appellation_labels ?? [],
            naf: result.naf_code,
            nafLabel: result.class_label,
            siret: result.establishment_siret,
            name:
              result.establishment_customized_name ?? result.establishment_name,
            voluntaryToImmersion: result.voluntary_to_immersion,
            numberOfEmployeeRange: result.number_employees,
            address: result.address,
            city: extractCityFromAddress(result.address),
            contactMode: optional(result.contact_mode) && result.contact_mode,
            location: optional(result.establishment_lon) && {
              lon: result.establishment_lon,
              lat: result.establishment_lat,
            },
            distance_m: Math.round(result.distance_m),
            ...(withContactDetails &&
              immersionContact && { contactDetails: immersionContact }),
          };
          return searchImmersionResultDto;
        }),
      )
      .catch((e) => {
        logger.error(
          e,
          "Error in Pg implementation of getSearchImmersionResultDtoFromSearchMade",
        );
        throw e;
      });
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
  public async getEstablishmentDataSourceFromSiret(
    siret: string,
  ): Promise<DataSource | undefined> {
    const query = `
      SELECT data_source FROM establishments
      WHERE siret = $1`;
    const pgResult = await this.client.query(query, [siret]);
    return pgResult.rows[0]?.data_source;
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
  public async getEstablishmentForSiret(
    siret: string,
  ): Promise<AnnotatedEstablishmentEntityV2 | undefined> {
    const pgResult = await this.client.query(
      `
        SELECT establishments.*, public_naf_classes_2008.class_label AS naf_label, lon, lat
        FROM establishments
        LEFT OUTER JOIN public_naf_classes_2008
          ON (public_naf_classes_2008.class_id =
              REGEXP_REPLACE(establishments.naf_code,'(\\d\\d)(\\d\\d).', '\\1.\\2'))
        WHERE siret = $1;`,
      [siret],
    );
    const row = pgResult.rows[0];

    if (!row) return;

    const establishmentForSiret: AnnotatedEstablishmentEntityV2 = {
      siret: row.siret,
      name: row.name,
      address: row.address,
      dataSource: row.data_source,
      sourceProvider: row.source_provider,
      isActive: row.is_active,
      nafDto: { code: row.naf_code, nomenclature: row.naf_nomenclature },
      position: optional(row.lon) && { lon: row.lon, lat: row.lat },
      numberEmployeesRange: row.number_employees,
      voluntaryToImmersion: row.data_source == "form",
      isCommited: optional(row.is_commited),
      customizedName: optional(row.customized_name),
      nafLabel: row.naf_label ?? "",
      updatedAt: row.update_date,
      isSearchable: row.is_searchable,
    };
    return establishmentForSiret;
  }
  public async getContactForEstablishmentSiret(
    siret: string,
  ): Promise<ContactEntityV2 | undefined> {
    const pgResult = await this.client.query(
      `SELECT * FROM immersion_contacts ic
       JOIN establishments__immersion_contacts eic ON ic.uuid = eic.contact_uuid
       WHERE establishment_siret = $1;`,
      [siret],
    );
    const row = pgResult.rows[0];

    if (!row) return;
    return {
      id: row.uuid,
      firstName: row.firstname,
      lastName: row.lastname,
      email: row.email,
      phone: optional(row.phone) && row.phone,
      contactMethod: optional(row.contact_mode) && row.contact_mode,
      job: row.role,
      copyEmails: row.copy_emails,
    };
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
    const pgResult = await this.client.query(
      `WITH match_immersion_offer AS (
        SELECT siret, io.rome_code, rome_label, json_agg(appellation_label) AS appellation_labels
        FROM immersion_offers AS io
        LEFT JOIN view_appellations_dto AS vad ON vad.appellation_code = io.rome_appellation 
        WHERE io.siret = $1 AND io.rome_code = $2
        GROUP BY (siret, io.rome_code, rome_label) 
        ) 
        SELECT JSONB_BUILD_OBJECT(
         'rome', io.rome_code, 
         'siret', io.siret, 
         'name', e.name, 
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
        LEFT JOIN establishments__immersion_contacts AS eic ON eic.establishment_siret = e.siret
        LEFT JOIN immersion_contacts AS ic ON ic.uuid = eic.contact_uuid
        `,
      [siret, rome],
    );
    return pgResult.rows[0]?.search_immersion_result;
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
