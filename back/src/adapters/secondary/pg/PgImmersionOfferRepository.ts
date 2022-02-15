import { PoolClient } from "pg";
import format from "pg-format";
import { ContactEntityV2 } from "../../../domain/immersionOffer/entities/ContactEntity";
import {
  AnnotatedEstablishmentEntityV2,
  employeeRangeByTefenCode,
  EstablishmentAggregate,
  TefenCode,
  EstablishmentEntityV2,
} from "../../../domain/immersionOffer/entities/EstablishmentEntity";
import { AnnotatedImmersionOfferEntityV2 } from "../../../domain/immersionOffer/entities/ImmersionOfferEntity";
import { SearchMade } from "../../../domain/immersionOffer/entities/SearchMadeEntity";
import { ImmersionOfferRepository } from "../../../domain/immersionOffer/ports/ImmersionOfferRepository";
import { ContactMethod } from "../../../shared/FormEstablishmentDto";
import {
  ImmersionOfferId,
  LatLonDto,
  SearchContact,
  SearchImmersionResultDto,
} from "../../../shared/SearchImmersionDto";
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
  if (pgContactMethod == null) return "UNKNOWN";
  return pgContactToContactMethod[pgContactMethod];
};

export const parseGeoJson = (raw: string): LatLonDto => {
  const json = JSON.parse(raw);
  return {
    lat: json.coordinates[1],
    lon: json.coordinates[0],
  };
};

export class PgImmersionOfferRepository implements ImmersionOfferRepository {
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
      establishment.address,
      establishment.numberEmployeesRange,
      establishment.naf,
      contactModeMap[establishment.contactMethod as KnownContactMethod] || null,
      establishment.dataSource,
      convertPositionToStGeography(establishment.position),
      establishment.updatedAt ? establishment.updatedAt.toISOString() : null,
      establishment.isActive,
    ]);

    if (establishmentFields.length === 0) return;

    try {
      const query = fixStGeographyEscapingInQuery(
        format(
          `INSERT INTO establishments (
          siret, name, address, number_employees, naf, contact_mode, data_source, gps, update_date, is_active
        ) VALUES %L
        ON CONFLICT
          ON CONSTRAINT establishments_pkey
            DO UPDATE
              SET
                name=EXCLUDED.name,
                address=EXCLUDED.address,
                number_employees=EXCLUDED.number_employees,
                naf=EXCLUDED.naf,
                contact_mode=EXCLUDED.contact_mode,
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
    const contactFields = aggregates.flatMap(({ establishment, contacts }) =>
      contacts.map((contact) => [
        contact.id,
        contact.lastName,
        contact.firstName,
        contact.email,
        contact.job,
        establishment.siret,
        contact.phone,
      ]),
    );

    if (contactFields.length === 0) return;

    try {
      const query = format(
        `INSERT INTO immersion_contacts (
        uuid, name, firstname, email, role, siret_establishment, phone
      ) VALUES %L`,
        contactFields,
      );
      await this.client.query(query);
    } catch (e: any) {
      logger.error(e, "Error inserting contacts");
    }
  }

  private async _upsertImmersionOffersFromAggregates(
    aggregates: EstablishmentAggregate[],
  ) {
    const immersionOfferFields: any[][] = aggregates.flatMap(
      ({ establishment, contacts, immersionOffers }) =>
        immersionOffers.map((immersionOffer) => [
          immersionOffer.id,
          immersionOffer.rome,
          extractNafDivision(establishment.naf),
          establishment.siret,
          establishment.naf,
          establishment.name,
          establishment.voluntaryToImmersion,
          establishment.dataSource,
          contacts[0]?.id,
          immersionOffer.score,
          convertPositionToStGeography(establishment.position),
        ]),
    );

    if (immersionOfferFields.length === 0) return;

    // Deduplication in case we have multiple times the same SIRET + ROMES, this due to the fact that different appellations can be transformed in the same ROME
    const deduplicatedArrayOfImmersionOffers: any[][] =
      immersionOfferFields.reduce((acc, cur) => {
        const alreadyExist = acc.some(
          (item: any[]) => item[1] == cur[1] && item[3] == cur[3], //ROME is at position 1 and SIRET at position 3
        );
        if (alreadyExist) return acc;
        return [...acc, cur];
      }, []);

    try {
      const query = fixStGeographyEscapingInQuery(
        format(
          `INSERT INTO immersion_offers (
          uuid, rome, naf_division, siret, naf,  name, voluntary_to_immersion, data_source,
          contact_in_establishment_uuid, score, gps
        ) VALUES %L
        ON CONFLICT
          ON CONSTRAINT immersion_offers_pkey
            DO UPDATE
              SET
                naf=EXCLUDED.naf,
                name=EXCLUDED.name,
                voluntary_to_immersion=EXCLUDED.voluntary_to_immersion,
                data_source=EXCLUDED.data_source,
                score=EXCLUDED.score,
                update_date=NOW()
              WHERE
                EXCLUDED.data_source='form'
                OR (
                  immersion_offers.data_source != 'form'
                  AND (
                    immersion_offers.data_source = 'api_labonneboite'
                  )
                )`,
          deduplicatedArrayOfImmersionOffers,
        ),
      );

      await this.client.query(query);
    } catch (e: any) {
      logger.error(e, "Error inserting immersion offers");
    }
  }

  async getSearchImmersionResultDtoFromSearchMade(
    searchMade: SearchMade,
    withContactDetails = false,
  ): Promise<SearchImmersionResultDto[]> {
    const query = `
        WITH 
          active_establishments AS (
            SELECT 
              establishments.name as establishment_name,
              contact_mode AS establishment_contact_mode,
              number_employees AS establishment_tefen_code, 
              address AS establishment_address,
              naf AS establishment_naf,
              siret AS establishment_siret
            FROM establishments 
            WHERE is_active
            ),
          filtered_immersion_offers AS (
            SELECT 
              uuid as offer_uuid, 
              siret as offer_siret, 
              naf_division as offer_naf_division, 
              data_source as offer_data_source,
              contact_in_establishment_uuid, 
              voluntary_to_immersion, 
              rome AS offer_rome, 
              gps AS offer_gps,
              ST_Distance(gps, ST_GeographyFromText($1)) AS distance_m,
              ST_AsGeoJSON(gps) AS offer_position
            FROM immersion_offers 
            ${searchMade.rome ? "WHERE rome = %1$L" : ""}
            )
        SELECT
            filtered_immersion_offers.*,
            active_establishments.*,
            immersion_contacts.uuid AS contact_uuid,
            immersion_contacts.name AS contact_name,
            immersion_contacts.firstname AS contact_firstname,
            immersion_contacts.email AS contact_email,
            immersion_contacts.role AS contact_role,
            immersion_contacts.siret_establishment AS contact_siret_establishment,
            immersion_contacts.phone AS contact_phone,
            naf_classes_2008.class_label,
            libelle_rome
        FROM
          filtered_immersion_offers
        RIGHT JOIN active_establishments
          ON (offer_siret = establishment_siret)
        LEFT JOIN immersion_contacts
          ON (contact_in_establishment_uuid = immersion_contacts.uuid)
        LEFT OUTER JOIN naf_classes_2008
          ON (naf_classes_2008.class_id =
              REGEXP_REPLACE(establishment_naf,'(\\d\\d)(\\d\\d).', '\\1.\\2'))
        LEFT OUTER JOIN romes_public_data
          ON (offer_rome = romes_public_data.code_rome)
        WHERE 
          ST_DWithin(offer_gps, ST_GeographyFromText($1), $2) 
        ORDER BY
          offer_data_source ASC,
          distance_m;`;
    const formatedQuery = format(query, searchMade.rome); // Formats optional litterals %1$L and %2$L
    return this.client
      .query(formatedQuery, [
        `POINT(${searchMade.lon} ${searchMade.lat})`,
        searchMade.distance_km * 1000, // Formats parameters $1, $2
      ])
      .then((res) => {
        return res.rows.map((result) => {
          const immersionContact: SearchContact | null =
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
            rome: result.offer_rome,
            romeLabel: result.libelle_rome,
            naf: result.establishment_naf,
            nafLabel: result.class_label,
            siret: result.establishment_siret,
            name: result.establishment_name,
            voluntaryToImmersion: result.voluntary_to_immersion,
            numberOfEmployeeRange:
              employeeRangeByTefenCode[
                result.establishment_tefen_code as TefenCode
              ],
            address: result.establishment_address,
            city: extractCityFromAddress(result.establishment_address),
            contactMode:
              optional(result.establishment_contact_mode) &&
              parseContactMethod(result.establishment_contact_mode),
            location:
              optional(result.offer_position) &&
              parseGeoJson(result.offer_position),
            distance_m: Math.round(result.distance_m),
            ...(withContactDetails &&
              immersionContact && { contactDetails: immersionContact }),
          };
          return searchImmersionResultDto;
        });
      })
      .catch((e) => {
        logger.error("Error in Pg implementation of getFromSearch", e);
        return [];
      });
  }

  public async getAnnotatedEstablishmentByImmersionOfferId(
    immersionOfferId: ImmersionOfferId,
  ): Promise<AnnotatedEstablishmentEntityV2 | undefined> {
    const query = format(
      `SELECT
        establishments.siret,
        establishments.name,
        establishments.address,
        immersion_offers.voluntary_to_immersion,
        establishments.data_source,
        establishments.contact_mode,
        ST_AsGeoJSON(establishments.gps) AS position,
        establishments.naf,
        naf_classes_2008.class_label AS naf_label,
        establishments.number_employees,
        establishments.update_date as establishments_update_date
      FROM
        establishments
        JOIN immersion_offers
          ON (immersion_offers.siret = establishments.siret)
        LEFT OUTER JOIN naf_classes_2008
          ON (naf_classes_2008.class_id =
              REGEXP_REPLACE(establishments.naf,'(\\d\\d)(\\d\\d).', '\\1.\\2'))
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
      address: row.address,
      voluntaryToImmersion: row.voluntary_to_immersion,
      dataSource: row.data_source,
      contactMethod: row.contact_mode && parseContactMethod(row.contact_mode),
      position: row.position && parseGeoJson(row.position),
      naf: row.naf,
      nafLabel: row.naf_label,
      numberEmployeesRange: row.number_employees,
      isActive: true,
      updatedAt: row.establishments_update_date,
    };
  }
  public async getActiveEstablishmentSiretsNotUpdatedSince(
    since: Date,
  ): Promise<string[]> {
    const query = `
      SELECT siret FROM establishments
      WHERE is_active AND 
      (update_date IS NULL OR 
       update_date < $1)`;
    const pgResult = await this.client.query(query, [since.toISOString()]);
    return pgResult.rows.map((row) => row.siret);
  }

  public async updateEstablishment(
    siret: string,
    propertiesToUpdate: Partial<
      Pick<
        EstablishmentEntityV2,
        "address" | "position" | "naf" | "numberEmployeesRange" | "isActive"
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
                   ${!!propertiesToUpdate.naf ? ", naf=%3$L" : ""}
                   ${
                     !!propertiesToUpdate.numberEmployeesRange
                       ? ", number_employees=%4$L"
                       : ""
                   }
                   ${
                     propertiesToUpdate.address && propertiesToUpdate.position // Update address and position together.
                       ? ", address=%5$L, gps=ST_GeographyFromText(%6$L)"
                       : ""
                   }
                   WHERE siret=%7$L;`;
    const queryArgs = [
      propertiesToUpdate.updatedAt.toISOString(),
      propertiesToUpdate.isActive,
      propertiesToUpdate.naf,
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
      `SELECT
        immersion_contacts.uuid,
        immersion_contacts.name,
        immersion_contacts.firstname,
        immersion_contacts.email,
        immersion_contacts.role,
        immersion_contacts.phone
      FROM
        immersion_contacts
        JOIN immersion_offers
          ON (immersion_offers.siret = immersion_contacts.siret_establishment)
      WHERE
        immersion_offers.uuid = %L`,
      immersionOfferId,
    );
    const pgResult = await this.client.query(query);
    const row = pgResult.rows[0];

    if (!row) return;
    return {
      id: row.uuid,
      lastName: row.name,
      firstName: row.firstname,
      email: row.email,
      job: row.role,
      phone: row.phone,
    };
  }

  async getAnnotatedImmersionOfferById(
    immersionOfferId: ImmersionOfferId,
  ): Promise<AnnotatedImmersionOfferEntityV2 | undefined> {
    const query = format(
      `SELECT
        immersion_offers.uuid,
        immersion_offers.rome,
        romes_public_data.libelle_rome,
        immersion_offers.score
      FROM
        immersion_offers
        LEFT OUTER JOIN romes_public_data
          ON (immersion_offers.rome = romes_public_data.code_rome)
      WHERE uuid = %L`,
      immersionOfferId,
    );

    const pgResult = await this.client.query(query);
    const row = pgResult.rows[0];

    if (!row) return;
    return {
      id: row.uuid,
      rome: row.rome,
      romeLabel: row.libelle_rome,
      score: row.score,
    };
  }
}

// Extract the NAF division (e.g. 84) from a NAF code (e.g. 8413Z)
const extractNafDivision = (naf: string) =>
  parseInt(naf.substring(0, 2)).toString();

const convertPositionToStGeography = ({ lat, lon }: LatLonDto) =>
  `ST_GeographyFromText('POINT(${lon} ${lat})')`;

const reStGeographyFromText =
  /'ST_GeographyFromText\(''POINT\((-?\d+(\.\d+)?)\s(-?\d+(\.\d+)?)\)''\)'/g;

// Remove any repeated single quotes ('') inside ST_GeographyFromText.
// TODO : find a better way than that : This is due to the Literal formatting that turns all simple quote into double quote.
const fixStGeographyEscapingInQuery = (query: string) =>
  query.replace(reStGeographyFromText, "ST_GeographyFromText('POINT($1 $3)')");
