import { PoolClient } from "pg";
import format from "pg-format";
import { ContactEntityV2 } from "../../../domain/immersionOffer/entities/ContactEntity";
import {
  AnnotatedEstablishmentEntityV2,
  EstablishmentAggregate,
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

const logger = createLogger(__filename);

type PgContactMethod = "phone" | "mail" | "in_person";
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
    ]);

    if (establishmentFields.length === 0) return;

    try {
      const query = buildUpsertEstablishmentsQuery(establishmentFields);
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
      const query = buildInsertContactsQuery(contactFields);
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

    //Deduplication in case we have multiple times the same SIRET + ROMES, this due to the fact that different appellations can be transformed in the same ROME
    const deduplicatedArrayOfImmersionOffers: any[][] =
      immersionOfferFields.reduce((acc, cur) => {
        const alreadyExist = acc.some(
          (item: any[]) => item[1] == cur[1] && item[3] == cur[3], //ROME is at position 1 and SIRET at position 3
        );
        if (alreadyExist) return acc;
        return [...acc, cur];
      }, []);

    try {
      const query = buildUpsertImmersionOffersQuery(
        deduplicatedArrayOfImmersionOffers,
      );
      await this.client.query(query);
    } catch (e: any) {
      logger.error(e, "Error inserting immersion offers");
    }
  }

  async getFromSearch(
    searchMade: SearchMade,
    withContactDetails = false,
  ): Promise<SearchImmersionResultDto[]> {
    const parameters = [
      searchMade.rome,
      `POINT(${searchMade.lon} ${searchMade.lat})`,
      searchMade.distance_km * 1000,
    ];

    let nafDivisionFilter = "";
    if (searchMade.nafDivision) {
      parameters.push(searchMade.nafDivision);
      nafDivisionFilter = `AND immersion_offers.naf_division = $${parameters.length}`;
    }

    let siretFilter = "";
    if (searchMade.siret) {
      parameters.push(searchMade.siret);
      siretFilter = `AND immersion_offers.siret = $${parameters.length}`;
    }

    return this.client
      .query(
        `SELECT
            immersion_offers.* AS immersion_offers,
            romes_public_data.libelle_rome,
            naf_classes_2008.class_label,
            immersion_contacts.uuid AS immersion_contacts_uuid,
            immersion_contacts.name AS immersion_contacts_name,
            immersion_contacts.firstname AS immersion_contacts_firstname,
            immersion_contacts.email AS immersion_contacts_email,
            immersion_contacts.role AS immersion_contacts_role,
            immersion_contacts.siret_establishment AS immersion_contacts_siret_establishment,
            immersion_contacts.phone AS immersion_contacts_phone,
            establishments.contact_mode AS establishment_contact_mode,
            establishments.address AS establishment_address,
            establishments.naf AS establishment_naf,
            ST_Distance(immersion_offers.gps, ST_GeographyFromText($2)) AS distance_m,
            ST_AsGeoJSON(immersion_offers.gps) AS position
        FROM
          immersion_offers
          LEFT JOIN immersion_contacts
            ON (immersion_offers.contact_in_establishment_uuid = immersion_contacts.uuid)
          LEFT JOIN establishments
            ON (immersion_offers.siret = establishments.siret)
          LEFT OUTER JOIN romes_public_data
            ON (immersion_offers.rome = romes_public_data.code_rome)
          LEFT OUTER JOIN naf_classes_2008
            ON (naf_classes_2008.class_id =
                REGEXP_REPLACE(establishments.naf,'(\\d\\d)(\\d\\d).', '\\1.\\2'))
        WHERE
          immersion_offers.rome = $1
          ${nafDivisionFilter}
          ${siretFilter}
          AND ST_DWithin(immersion_offers.gps, ST_GeographyFromText($2), $3)
        ORDER BY
          immersion_offers.data_source ASC,
          distance_m`,
        parameters,
      )
      .then((res) =>
        res.rows.map((result) =>
          this.buildImmersionOfferFromResults(result, withContactDetails),
        ),
      )
      .catch((e) => {
        logger.error(e);
        return [];
      });
  }

  buildImmersionOfferFromResults(
    result: any,
    withContactDetails: boolean,
  ): SearchImmersionResultDto {
    let immersionContact: SearchContact | null = null;
    if (result.contact_in_establishment_uuid != null) {
      immersionContact = {
        id: result.immersion_contacts_uuid,
        firstName: result.immersion_contacts_firstname,
        lastName: result.immersion_contacts_name,
        email: result.immersion_contacts_email,
        role: result.immersion_contacts_role,
        phone: result.immersion_contacts_phone,
      };
    }

    return {
      id: result.uuid,
      rome: result.rome,
      romeLabel: result.libelle_rome,
      naf: result.establishment_naf,
      nafLabel: result.class_label,
      siret: result.siret,
      name: result.name,
      voluntaryToImmersion: result.voluntary_to_immersion,
      address: result.establishment_address,
      city: extractCityFromAddress(result.establishment_address),
      contactMode:
        result.establishment_contact_mode &&
        parseContactMethod(result.establishment_contact_mode),
      location: result.position && parseGeoJson(result.position),
      distance_m: Math.round(result.distance_m),
      ...(withContactDetails &&
        immersionContact && { contactDetails: immersionContact }),
    };
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
        establishments.number_employees
      FROM
        establishments
        JOIN immersion_offers
          ON (immersion_offers.siret = establishments.siret)
        LEFT OUTER JOIN naf_classes_2008
          ON (naf_classes_2008.class_id =
              REGEXP_REPLACE(establishments.naf,'(\\d\\d)(\\d\\d).', '\\1.\\2'))
      WHERE
        immersion_offers.uuid = %L`,
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
    };
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

const buildUpsertEstablishmentsQuery = (establishmentFields: any[][]) => {
  const query = format(
    `INSERT INTO establishments (
      siret, name, address, number_employees, naf, contact_mode, data_source, gps
    ) VALUES %L
    ON CONFLICT
      ON CONSTRAINT pk_establishments
        DO UPDATE
          SET
            name=EXCLUDED.name,
            address=EXCLUDED.address,
            number_employees=EXCLUDED.number_employees,
            naf=EXCLUDED.naf,
            contact_mode=EXCLUDED.contact_mode,
            data_source=EXCLUDED.data_source,
            update_date=NOW()
          WHERE
            EXCLUDED.data_source='form'
            OR (
              establishments.data_source != 'form'
              AND (
                establishments.data_source = 'api_labonneboite'
              )
            )`,
    establishmentFields,
  );
  return fixStGeographyEscapingInQuery(query);
};

const buildInsertContactsQuery = (contactFields: any[][]) =>
  format(
    `INSERT INTO immersion_contacts (
    uuid, name, firstname, email, role, siret_establishment, phone
  ) VALUES %L`,
    contactFields,
  );

const buildUpsertImmersionOffersQuery = (immersionOfferFields: any[][]) => {
  const query = format(
    `INSERT INTO immersion_offers (
      uuid, rome, naf_division, siret, naf,  name, voluntary_to_immersion, data_source,
      contact_in_establishment_uuid, score, gps
    ) VALUES %L
    ON CONFLICT
      ON CONSTRAINT pk_immersion_offers
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
    immersionOfferFields,
  );
  return fixStGeographyEscapingInQuery(query);
};

// Extract the NAF division (e.g. 84) from a NAF code (e.g. 8413Z)
const extractNafDivision = (naf: string) => parseInt(naf.substring(0, 2));

const convertPositionToStGeography = ({ lat, lon }: LatLonDto) =>
  `ST_GeographyFromText('POINT(${lon} ${lat})')`;

const reStGeographyFromText =
  /'ST_GeographyFromText\(''POINT\((-?\d+(\.\d+)?)\s(-?\d+(\.\d+)?)\)''\)'/g;

// Remove any repeated single quotes ('') inside ST_GeographyFromText.
const fixStGeographyEscapingInQuery = (query: string) =>
  query.replace(reStGeographyFromText, "ST_GeographyFromText('POINT($1 $3)')");
