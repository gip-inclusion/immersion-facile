import { PoolClient } from "pg";
import format from "pg-format";
import {
  ContactEntityV2,
  ContactMethod,
} from "../../../domain/immersionOffer/entities/ContactEntity";
import {
  AnnotatedEstablishmentEntityV2,
  employeeRangeByTefenCode,
  EstablishmentAggregate,
  TefenCode,
  EstablishmentEntityV2,
  DataSource,
} from "../../../domain/immersionOffer/entities/EstablishmentEntity";
import { AnnotatedImmersionOfferEntityV2 } from "../../../domain/immersionOffer/entities/ImmersionOfferEntity";
import { SearchMade } from "../../../domain/immersionOffer/entities/SearchMadeEntity";
import { EstablishmentAggregateRepository } from "../../../domain/immersionOffer/ports/EstablishmentAggregateRepository";
import { ImmersionOfferId } from "../../../shared/ImmersionOfferId";
import { LatLonDto } from "../../../shared/latLon";
import { AppellationDto } from "../../../shared/romeAndAppellationDtos/romeAndAppellation.dto";
import {
  SearchContactDto,
  SearchImmersionResultDto,
} from "../../../shared/searchImmersion/SearchImmersionResult.dto";

import { extractCityFromAddress } from "../../../utils/extractCityFromAddress";
import { createLogger } from "../../../utils/logger";
import { optional } from "./pgUtils";

const logger = createLogger(__filename);

export type PgContactMethod = "phone" | "mail" | "in_person";
export type PgDataSource = "api_labonneboite" | "form";

type KnownContactMethod = Exclude<ContactMethod, "UNKNOWN">;
const contactModeMap: Record<KnownContactMethod, PgContactMethod> = {
  PHONE: "phone",
  EMAIL: "mail",
  IN_PERSON: "in_person",
};

const pgContactToContactMethod = Object.fromEntries(
  Object.entries(contactModeMap).map(([method, pgMethod]) => [
    pgMethod,
    method,
  ]),
) as Record<PgContactMethod, KnownContactMethod>;

const parseContactMethod = (raw: string): ContactMethod => {
  const pgContactMethod = raw as PgContactMethod;
  return pgContactToContactMethod[pgContactMethod];
};

export const parseGeoJson = (raw: string): LatLonDto => {
  const json = JSON.parse(raw);
  return {
    lat: json.coordinates[1],
    lon: json.coordinates[0],
  };
};

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
      establishment.updatedAt ? establishment.updatedAt.toISOString() : null,
      establishment.isActive,
      establishment.isCommited,
    ]);

    if (establishmentFields.length === 0) return;

    try {
      const query = fixStGeographyEscapingInQuery(
        format(
          `INSERT INTO establishments (
          siret, name, customized_name, address, number_employees, naf_code, naf_nomenclature, data_source, source_provider, gps, update_date, is_active, is_commited
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
        contactModeMap[contact.contactMethod as KnownContactMethod],
      ];
    });

    const establishmentContactFields = aggregatesWithContact.map(
      ({ establishment, contact }) => [establishment.siret, contact.id],
    );

    try {
      const insertContactsQuery = format(
        `INSERT INTO immersion_contacts (
        uuid, lastname, firstname, email, role, phone, contact_mode
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
          immersionOffer.romeAppellation,
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
        WITH active_establishments_with_contact_uuid AS (
          SELECT 
            establishments.name as establishment_name,
            number_employees AS establishment_tefen_code, 
            address,
            naf_code,
            data_source,
            siret AS establishment_siret,
            contact_uuid as contact_in_establishment_uuid,
            gps,
            ST_Distance(gps, ST_GeographyFromText($1)) AS distance_m,
            ST_AsGeoJSON(gps) AS establishment_position
          FROM establishments 
          LEFT JOIN establishments__immersion_contacts e_ic ON e_ic.establishment_siret = establishments.siret
          WHERE is_active
          ),
        filtered_immersion_offers AS (
          SELECT 
            uuid as offer_uuid, 
            siret as offer_siret, 
            rome_code
          FROM immersion_offers 
          ${searchMade.rome ? "WHERE rome_code = %1$L" : ""} 
          )
      SELECT
          filtered_immersion_offers.*,
          active_establishments_with_contact_uuid.*,
          immersion_contacts.uuid AS contact_uuid,
          immersion_contacts.lastname,
          immersion_contacts.firstname,
          immersion_contacts.contact_mode,
          immersion_contacts.email,
          immersion_contacts.role,
          immersion_contacts.phone AS contact_phone,
          public_naf_classes_2008.class_label,
          libelle_rome
      FROM
        filtered_immersion_offers
      RIGHT JOIN active_establishments_with_contact_uuid
        ON (offer_siret = establishment_siret)
      LEFT JOIN immersion_contacts
        ON (contact_in_establishment_uuid = immersion_contacts.uuid)
      LEFT OUTER JOIN public_naf_classes_2008
        ON (public_naf_classes_2008.class_id =
            REGEXP_REPLACE(naf_code,'(\\d\\d)(\\d\\d).', '\\1.\\2'))
      LEFT OUTER JOIN public_romes_data
        ON (rome_code = public_romes_data.code_rome)
        WHERE 
        offer_uuid IS NOT NULL AND
        ST_DWithin(gps, ST_GeographyFromText($1), $2) 
      ORDER BY
        data_source ASC,
        distance_m
      LIMIT $3;`;
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
            id: result.offer_uuid,
            rome: result.rome_code,
            romeLabel: result.libelle_rome,
            naf: result.naf_code,
            nafLabel: result.class_label,
            siret: result.establishment_siret,
            name: result.establishment_name,
            voluntaryToImmersion: result.data_source == "form",
            numberOfEmployeeRange:
              employeeRangeByTefenCode[
                result.establishment_tefen_code as TefenCode
              ],
            address: result.address,
            city: extractCityFromAddress(result.address),
            contactMode:
              optional(result.contact_mode) &&
              parseContactMethod(result.contact_mode),
            location:
              optional(result.establishment_position) &&
              parseGeoJson(result.establishment_position),
            distance_m: Math.round(result.distance_m),
            ...(withContactDetails &&
              immersionContact && { contactDetails: immersionContact }),
          };
          return searchImmersionResultDto;
        }),
      )
      .catch((e) => {
        logger.error("Error in Pg implementation of getFromSearch", e);
        console.log(e);
        throw e;
        //return [];
      });
  }

  public async getAnnotatedEstablishmentByImmersionOfferId(
    immersionOfferId: ImmersionOfferId,
  ): Promise<AnnotatedEstablishmentEntityV2 | undefined> {
    const query = format(
      `SELECT
        establishments.siret,
        establishments.name,
        establishments.customized_name,
        establishments.is_commited,
        establishments.address,
        establishments.data_source,
        establishments.source_provider,
        ST_AsGeoJSON(establishments.gps) AS position,
        establishments.naf_code,
        establishments.naf_nomenclature,
        public_naf_classes_2008.class_label AS naf_label,
        establishments.number_employees,
        establishments.update_date as establishments_update_date,
        contact_mode
      FROM
        establishments
        JOIN immersion_offers
          ON (immersion_offers.siret = establishments.siret)
        LEFT JOIN establishments__immersion_contacts e_ic
          ON e_ic.establishment_siret = establishments.siret
        LEFT JOIN immersion_contacts ic
          ON ic.uuid = e_ic.contact_uuid
        LEFT OUTER JOIN public_naf_classes_2008
          ON (public_naf_classes_2008.class_id =
              REGEXP_REPLACE(establishments.naf_code,'(\\d\\d)(\\d\\d).', '\\1.\\2'))
      WHERE
        establishments.is_active
        AND immersion_offers.uuid = %L`,
      immersionOfferId,
    );
    const pgResult = await this.client.query(query);
    const row = pgResult.rows[0];

    if (!row) return;
    return {
      siret: row.siret,
      name: row.name,
      customizedName: optional(row.customized_name),
      address: row.address,
      voluntaryToImmersion: row.data_source == "form",
      dataSource: row.data_source,
      sourceProvider: row.source_provider,
      position: row.position && parseGeoJson(row.position),
      nafDto: { code: row.naf_code, nomenclature: row.naf_nomenclature },
      nafLabel: row.naf_label,
      numberEmployeesRange: row.number_employees,
      isActive: true,
      isCommited: optional(row.is_commited),
      updatedAt: row.establishments_update_date,
    };
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
  public async removeEstablishmentAndOffersWithSiret(
    siret: string,
  ): Promise<void> {
    const query = `
      DELETE FROM establishments WHERE siret = $1;`;
    await this.client.query(query, [siret]);
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
      DELETE FROM establishments WHERE siret = $1;;`;
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
                       ? ", address=%6$L, gps=ST_GeographyFromText(%7$L)"
                       : ""
                   }
                   WHERE siret=%8$L;`;
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
      siret,
    ];
    const formatedQuery = format(updateQuery, ...queryArgs);
    await this.client.query(formatedQuery);
  }

  async getContactByImmersionOfferId(
    immersionOfferId: ImmersionOfferId,
  ): Promise<ContactEntityV2 | undefined> {
    const query = format(
      `WITH filtered_offers as (SELECT siret from immersion_offers WHERE uuid = %L)    
      SELECT
              immersion_contacts.uuid,
              immersion_contacts.lastname,
              immersion_contacts.firstname,
              immersion_contacts.email,
              immersion_contacts.role,
              immersion_contacts.phone,
              immersion_contacts.contact_mode,
              establishment_siret
            FROM
              immersion_contacts
              RIGHT JOIN establishments__immersion_contacts
                ON (establishments__immersion_contacts.contact_uuid = immersion_contacts.uuid)
              RIGHT JOIN filtered_offers 
                ON (filtered_offers.siret = establishment_siret)
            WHERE immersion_contacts.uuid IS NOT NULL 
            LIMIT 1`,

      immersionOfferId,
    );
    const pgResult = await this.client.query(query);
    const row = pgResult.rows[0];

    if (!row) return;
    return {
      id: row.uuid,
      lastName: row.lastname,
      firstName: row.firstname,
      email: row.email,
      job: row.role,
      phone: row.phone,
      contactMethod:
        optional(row.contact_mode) && parseContactMethod(row.contact_mode),
    };
  }

  async getAnnotatedImmersionOfferById(
    immersionOfferId: ImmersionOfferId,
  ): Promise<AnnotatedImmersionOfferEntityV2 | undefined> {
    const query = format(
      `SELECT
        immersion_offers.uuid,
        immersion_offers.rome_code,
        public_romes_data.libelle_rome,
        immersion_offers.score
      FROM
        immersion_offers
        LEFT OUTER JOIN public_romes_data
          ON (immersion_offers.rome_code = public_romes_data.code_rome)
      WHERE uuid = %L`,
      immersionOfferId,
    );

    const pgResult = await this.client.query(query);
    const row = pgResult.rows[0];

    if (!row) return;
    return {
      id: row.uuid,
      romeCode: row.rome_code,
      romeLabel: row.libelle_rome,
      score: row.score,
    };
  }
  public async getContactEmailFromSiret(
    siret: string,
  ): Promise<string | undefined> {
    const query = format(
      `SELECT
        immersion_contacts.email
      FROM
        immersion_contacts
      RIGHT JOIN establishments__immersion_contacts
        ON (establishments__immersion_contacts.contact_uuid = immersion_contacts.uuid)
      WHERE establishments__immersion_contacts.establishment_siret = %L`,
      siret,
    );
    const pgResult = await this.client.query(query);
    const row = pgResult.rows[0];
    if (!row) return;
    return row.email;
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
  ): Promise<EstablishmentEntityV2 | undefined> {
    const pgResult = await this.client.query(
      `SELECT *, ST_AsGeoJSON(gps) AS position FROM establishments WHERE siret = $1;`,
      [siret],
    );
    const row = pgResult.rows[0];

    if (!row) return;

    const establishmentForSiret: EstablishmentEntityV2 = {
      siret: row.siret,
      name: row.name,
      address: row.address,
      dataSource: row.data_source,
      sourceProvider: row.source_provider,
      isActive: row.is_active,
      nafDto: { code: row.naf_code, nomenclature: row.naf_nomenclature },
      position: optional(row.position) && parseGeoJson(row.position),
      numberEmployeesRange: row.number_employees,
      voluntaryToImmersion: row.data_source == "form",
      isCommited: optional(row.is_commited),
      customizedName: optional(row.customized_name),
      updatedAt: row.update_date,
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
      contactMethod:
        optional(row.contact_mode) && parseContactMethod(row.contact_mode),
      job: row.role,
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
}

const convertPositionToStGeography = ({ lat, lon }: LatLonDto) =>
  `ST_GeographyFromText('POINT(${lon} ${lat})')`;

const reStGeographyFromText =
  /'ST_GeographyFromText\(''POINT\((-?\d+(\.\d+)?)\s(-?\d+(\.\d+)?)\)''\)'/g;

// Remove any repeated single quotes ('') inside ST_GeographyFromText.
// TODO : find a better way than that : This is due to the Literal formatting that turns all simple quote into double quote.
const fixStGeographyEscapingInQuery = (query: string) =>
  query.replace(reStGeographyFromText, "ST_GeographyFromText('POINT($1 $3)')");
