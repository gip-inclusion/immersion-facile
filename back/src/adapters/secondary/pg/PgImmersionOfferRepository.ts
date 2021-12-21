import { PoolClient } from "pg";
import format from "pg-format";
import {
  EstablishmentAggregate,
  EstablishmentEntityV2,
} from "../../../domain/immersionOffer/entities/EstablishmentAggregate";
import { EstablishmentEntity } from "../../../domain/immersionOffer/entities/EstablishmentEntity";
import {
  ContactEntityV2,
  ImmersionEstablishmentContact,
  ImmersionOfferEntity,
  ImmersionOfferEntityV2,
} from "../../../domain/immersionOffer/entities/ImmersionOfferEntity";
import { SearchParams } from "../../../domain/immersionOffer/entities/SearchParams";
import { Position } from "../../../domain/immersionOffer/ports/AdresseAPI";
import { ImmersionOfferRepository } from "../../../domain/immersionOffer/ports/ImmersionOfferRepository";
import { ContactMethod } from "../../../shared/FormEstablishmentDto";
import {
  ImmersionOfferId,
  SearchContact,
  SearchImmersionResultDto,
} from "../../../shared/SearchImmersionDto";
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

const parseGeoJson = (raw: string): Position => {
  const json = JSON.parse(raw);
  return {
    lat: json.coordinates[1],
    lon: json.coordinates[0],
  };
};

export class PgImmersionOfferRepository implements ImmersionOfferRepository {
  constructor(private client: PoolClient) {}

  async insertSearch(searchParams: SearchParams) {
    this.client
      .query(
        `INSERT INTO searches_made (ROME, lat, lon ,distance, needsToBeSearched, gps)
        VALUES ($1, $2, $3, $4, $5, ST_GeographyFromText($6))
        ON CONFLICT
          ON CONSTRAINT pk_searches_made
            DO UPDATE SET needstobesearched=true, update_date=NOW()`,
        [
          searchParams.rome,
          searchParams.lat,
          searchParams.lon,
          searchParams.distance_km,
          true,
          `POINT(${searchParams.lon} ${searchParams.lat})`,
        ],
      )
      .catch((e) => {
        logger.error(e);
      });
  }

  async markPendingResearchesAsProcessedAndRetrieveThem(): Promise<
    SearchParams[]
  > {
    /*
    In order to lower the amount of request made to third-party services,
    after grouping by ROME searched,
    we make an aggregation of the searches made in a radius of 0.3 degrees (=29.97 kilometers)
    and take the max distance searched
    */
    return this.client
      .query(
        `SELECT
          requestGroupBy.rome as rome,
          requestGroupBy.max_distance AS distance_km,
          ST_Y(requestGroupBy.point) AS lat,
          ST_X(requestGroupBy.point) AS lon
        FROM (
          SELECT
            rome,
            MAX(distance) AS max_distance,
            ST_AsText(ST_GeometryN(unnest(ST_ClusterWithin(gps::geometry, 0.27)),1)) AS point
          FROM searches_made
          WHERE needstobesearched=true
          GROUP BY rome
        ) AS requestGroupBy`,
      )
      .then((res) => {
        this.client.query("UPDATE searches_made SET needstobesearched=false");
        return res.rows as SearchParams[];
      })
      .catch((e) => {
        logger.error(e);
        return [];
      });
  }

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
    const immersionOfferFields = aggregates.flatMap(
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

    try {
      const query = buildUpsertImmersionOffersQuery(immersionOfferFields);
      await this.client.query(query);
    } catch (e: any) {
      logger.error(e, "Error inserting contacts");
    }
  }

  // DEPRECATED.
  public async insertEstablishments(
    establishments: EstablishmentEntity[],
  ): Promise<void> {
    if (establishments.length == 0)
      throw new Error(
        "Inavlid argument 'establishments': array must not be empty",
      );

    const arrayOfEstablishments = establishments.map((establishment) =>
      establishment.toArrayOfProps(),
    );

    //We deduplicate establishments because postgres does not support duplicate rows
    const deduplicatedArrayOfEstablishments: any[][] =
      arrayOfEstablishments.reduce((acc, cur) => {
        const alreadyExist = acc.some((item: any[]) => item[0] === cur[0]);
        if (alreadyExist) return acc;
        return [...acc, cur];
      }, []);

    const contactModeIndex = 5;
    const positionIndex = 7;
    const uniqImmersionsOffersWithCorrectPosition =
      deduplicatedArrayOfEstablishments.map((establishment) => {
        const position: Position = establishment[positionIndex];
        const newPosition = `ST_GeographyFromText('POINT(${position.lon} ${position.lat})')`;
        const contactMethod = establishment[contactModeIndex] as
          | ContactMethod
          | undefined;
        const existingContactMethod = contactMethod
          ? contactMethod !== "UNKNOWN"
          : false;
        const pgContactMethod = existingContactMethod
          ? contactModeMap[contactMethod as KnownContactMethod]
          : null;

        return [
          ...establishment.slice(0, contactModeIndex),
          pgContactMethod,
          ...establishment.slice(contactModeIndex + 1, positionIndex),
          newPosition,
        ];
      });

    const query = buildUpsertEstablishmentsQuery(
      uniqImmersionsOffersWithCorrectPosition,
    );

    await this.client.query(query).catch((e) => {
      logger.error("Error when trying to insert establishment " + e);
    });
  }

  // DEPRECATED.
  async insertEstablishmentContact(
    immersionEstablishmentContact: ImmersionEstablishmentContact,
  ) {
    const {
      id,
      lastName: name,
      firstName: firstname,
      email,
      role,
      siretEstablishment,
      phone,
    } = immersionEstablishmentContact;
    const query = buildInsertContactsQuery([
      [id, name, firstname, email, role, siretEstablishment, phone],
    ]);
    await this.client.query(query);
  }

  // DEPRECATED.
  async insertImmersions(
    immersionOffers: ImmersionOfferEntity[],
  ): Promise<void> {
    if (immersionOffers.length === 0) return;
    const arrayOfImmersionsOffers = immersionOffers.map((immersion) =>
      immersion.toArrayOfProps(),
    );
    //We deduplicate establishments because postgres does not support duplicate rows
    const deduplicatedArrayOfImmersionsOffers = arrayOfImmersionsOffers.reduce(
      (acc: any[][], cur: any[]) => {
        const alreadyExist = acc.some(
          (item: any[]) =>
            item[1] === cur[1] && item[2] === cur[2] && item[3] === cur[3],
        );
        if (alreadyExist) return acc;
        return [...acc, cur];
      },
      [],
    );

    const positionIndex = 10;
    const contactIndex = 8;

    const uniqImmersionsOffersWithCorrectPosition =
      deduplicatedArrayOfImmersionsOffers.map((offer) => {
        const position: Position = offer[positionIndex];
        const newPosition = `ST_GeographyFromText('POINT(${position.lon} ${position.lat})')`;
        const contactUuid = offer[contactIndex]?.id;

        return [
          ...offer.slice(0, contactIndex),
          contactUuid,
          ...offer.slice(contactIndex + 1, positionIndex),
          newPosition,
          ...offer.slice(positionIndex + 1),
        ];
      });

    const query = buildUpsertImmersionOffersQuery(
      uniqImmersionsOffersWithCorrectPosition,
    );

    await this.client.query(query).catch((e) => {
      console.error("Error Inserting immersions " + e); // we keep this one too because otherwise the error does not appear in tests
      logger.error("Error Inserting immersions " + e);
    });
  }

  async getImmersionsFromSiret(siret: string) {
    return this.client
      .query("SELECT * FROM immersion_offers WHERE siret=$1", [siret])
      .then((res) => res.rows)
      .catch((e) => {
        logger.error(e);
        return [];
      });
  }

  async getImmersionFromUuid(
    uuid: string,
    withContactDetails = false,
  ): Promise<SearchImmersionResultDto | undefined> {
    return this.client
      .query(
        `SELECT
          immersion_offers.* AS immersion_offers,
          immersion_contacts.uuid AS immersion_contacts_uuid,
          immersion_contacts.name AS immersion_contacts_name,
          immersion_contacts.firstname AS immersion_contacts_firstname,
          immersion_contacts.email AS immersion_contacts_email,
          immersion_contacts.role AS immersion_contacts_role,
          immersion_contacts.siret_establishment AS immersion_contacts_siret_establishment,
          immersion_contacts.phone AS immersion_contacts_phone,
          establishments.contact_mode AS establishment_contact_mode,
          establishments.address as establishment_address
      FROM
        immersion_offers
        LEFT JOIN immersion_contacts
          ON immersion_offers.contact_in_establishment_uuid = immersion_contacts.uuid
        LEFT JOIN establishments
          ON immersion_offers.siret = establishments.siret
      WHERE
        immersion_offers.uuid=$1`,
        [uuid],
      )
      .then((res) => {
        const firstResult = res.rows[0];
        return (
          firstResult &&
          this.buildImmersionOfferFromResults(firstResult, withContactDetails)
        );
      })
      .catch((e) => {
        logger.error(e);
        throw e;
      });
  }

  async getFromSearch(
    searchParams: SearchParams,
    withContactDetails = false,
  ): Promise<SearchImmersionResultDto[]> {
    const parameters = [
      searchParams.rome,
      `POINT(${searchParams.lon} ${searchParams.lat})`,
      searchParams.distance_km * 1000,
    ];

    let nafDivisionFilter = "";
    if (searchParams.nafDivision) {
      parameters.push(searchParams.nafDivision);
      nafDivisionFilter = `AND immersion_offers.naf_division = $${parameters.length}`;
    }

    let siretFilter = "";
    if (searchParams.siret) {
      parameters.push(searchParams.siret);
      siretFilter = `AND immersion_offers.siret = $${parameters.length}`;
    }

    return this.client
      .query(
        `SELECT
            immersion_offers.* AS immersion_offers,
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
        WHERE
          immersion_offers.rome = $1
          ${nafDivisionFilter}
          ${siretFilter}
          AND ST_DWithin(immersion_offers.gps, ST_GeographyFromText($2), $3)
          AND immersion_offers.data_source != 'api_laplateformedelinclusion'
        ORDER BY
          distance_m,
          immersion_offers.data_source DESC`,
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

    const contactId = immersionContact ? immersionContact.id : undefined;

    return {
      id: result.uuid,
      rome: result.rome,
      naf: result.establishment_naf,
      siret: result.siret,
      name: result.name,
      voluntaryToImmersion: result.voluntary_to_immersion,
      address: result.establishment_address,
      contactId,
      contactMode:
        result.establishment_contact_mode &&
        parseContactMethod(result.establishment_contact_mode),
      location: result.position && parseGeoJson(result.position),
      distance_m: Math.round(result.distance_m),
      city: "xxxx",
      nafLabel: "xxxx",
      romeLabel: "xxxx",
      ...(withContactDetails &&
        immersionContact && { contactDetails: immersionContact }),
    };
  }
  async getEstablishmentByImmersionOfferId(
    immersionOfferId: ImmersionOfferId,
  ): Promise<EstablishmentEntityV2 | undefined> {
    const query = format(
      `SELECT
        establishments.siret,
        establishments.name,
        establishments.address,
        immersion_offers.voluntary_to_immersion,
        establishments.data_source,
        establishments.contact_mode,
        st_asgeojson(establishments.gps) as position,
        establishments.naf,
        establishments.number_employees
      FROM
        establishments
        JOIN immersion_offers
          ON (immersion_offers.siret = establishments.siret)
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

  async getImmersionOfferById(
    immersionOfferId: ImmersionOfferId,
  ): Promise<ImmersionOfferEntityV2 | undefined> {
    const query = format(
      `SELECT uuid, rome, score
      FROM immersion_offers
      WHERE uuid = %L`,
      immersionOfferId,
    );

    const pgResult = await this.client.query(query);
    const row = pgResult.rows[0];

    if (!row) return;
    return {
      id: row.uuid,
      rome: row.rome,
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
                EXCLUDED.data_source = 'api_laplateformedelinclusion'
                AND establishments.data_source = 'api_labonneboite'
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
                EXCLUDED.data_source = 'api_laplateformedelinclusion'
                AND immersion_offers.data_source = 'api_labonneboite'
              )
            )`,
    immersionOfferFields,
  );
  return fixStGeographyEscapingInQuery(query);
};

// Extract the NAF division (e.g. 84) from a NAF code (e.g. 8413Z)
const extractNafDivision = (naf: string) => parseInt(naf.substring(0, 2));

const convertPositionToStGeography = ({ lat, lon }: Position) =>
  `ST_GeographyFromText('POINT(${lon} ${lat})')`;

const reStGeographyFromText =
  /'ST_GeographyFromText\(''POINT\((-?\d+(\.\d+)?)\s(-?\d+(\.\d+)?)\)''\)'/g;

// Remove any repeated single quotes ('') inside ST_GeographyFromText.
const fixStGeographyEscapingInQuery = (query: string) =>
  query.replace(reStGeographyFromText, "ST_GeographyFromText('POINT($1 $3)')");
