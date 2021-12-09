import { PoolClient } from "pg";
import format from "pg-format";
import {
  EstablishmentEntity,
  Position,
} from "../../../domain/immersionOffer/entities/EstablishmentEntity";
import {
  ImmersionEstablishmentContact,
  ImmersionOfferEntity,
} from "../../../domain/immersionOffer/entities/ImmersionOfferEntity";
import {
  ImmersionOfferRepository,
  SearchParams,
} from "../../../domain/immersionOffer/ports/ImmersionOfferRepository";
import { ContactMethod } from "../../../shared/FormEstablishmentDto";
import { SearchImmersionResultDto } from "../../../shared/SearchImmersionDto";
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

    const formatedQuery = format(
      `
      INSERT INTO establishments (
        siret, name, address, number_employees, naf, contact_mode, data_source, gps)
      VALUES %L
      ON CONFLICT
        ON CONSTRAINT pk_establishments
          DO UPDATE
            SET
              name=EXCLUDED.name, address=EXCLUDED.address,
              number_employees=EXCLUDED.number_employees, naf=EXCLUDED.naf,
              contact_mode=EXCLUDED.contact_mode, data_source=EXCLUDED.data_source,
              update_date=NOW()
            WHERE
              EXCLUDED.data_source='form'
              OR (
                establishments.data_source != 'form'
                AND (
                  EXCLUDED.data_source = 'api_laplateformedelinclusion'
                  AND establishments.data_source = 'api_labonneboite'))
      `,
      uniqImmersionsOffersWithCorrectPosition,
    );

    //We remove the dashes around method ST_GeographyFromText to make it work
    const re =
      /'ST_GeographyFromText\(''POINT\((-?\d+(\.\d+)?)\s(-?\d+(\.\d+)?)\)''\)'/g;
    const formatedQueryWorking = formatedQuery.replace(
      re,
      "ST_GeographyFromText('POINT($1 $3)')",
    );
    const query = format(formatedQueryWorking);
    await this.client.query(query).catch((e) => {
      logger.error("Error when trying to insert establishment " + e);
    });
  }

  async insertEstablishmentContact(
    immersionEstablishmentContact: ImmersionEstablishmentContact,
  ) {
    const { id, name, firstname, email, role, siretEstablishment, phone } =
      immersionEstablishmentContact;
    await this.client.query(
      `INSERT INTO immersion_contacts (uuid, name, firstname, email, role,  siret_establishment, phone)
        VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [id, name, firstname, email, role, siretEstablishment, phone],
    );
  }
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

    const formatedQuery = format(
      "INSERT INTO immersion_offers (uuid, rome, naf_division, siret, naf,  name, voluntary_to_immersion, data_source, contact_in_establishment_uuid, score, gps) \
        VALUES %L \
          ON CONFLICT ON CONSTRAINT pk_immersion_offers \
            DO UPDATE SET \
              naf=EXCLUDED.naf,\
              name=EXCLUDED.name,\
              voluntary_to_immersion=EXCLUDED.voluntary_to_immersion, \
              data_source=EXCLUDED.data_source,\
              score=EXCLUDED.score,\
              update_date=NOW() \
        WHERE EXCLUDED.data_source='form' OR (immersion_offers.data_source != 'form' \
        AND (EXCLUDED.data_source = 'api_laplateformedelinclusion' \
        AND immersion_offers.data_source = 'api_labonneboite'))",
      uniqImmersionsOffersWithCorrectPosition,
    );

    // Replace the escaped quotes ('') with single quotes (') in ST_GeographyFromText.
    const re =
      /'ST_GeographyFromText\(''POINT\((-?\d+(\.\d+)?)\s(-?\d+(\.\d+)?)\)''\)'/g;
    const formatedQueryWorking = formatedQuery.replace(
      re,
      "ST_GeographyFromText('POINT($1 $3)')",
    );
    await this.client.query(formatedQueryWorking).catch((e) => {
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
          establishments.contact_mode AS establishment_contact_mode
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
        return firstResult && this.buildImmersionOfferFromResults(firstResult);
      })
      .catch((e) => {
        logger.error(e);
        throw e;
      });
  }

  async getFromSearch(
    searchParams: SearchParams,
  ): Promise<SearchImmersionResultDto[]> {
    let nafCategoryFilter = "";
    let siretCategoryFilter = "";

    const parameters = [
      searchParams.rome,
      `POINT(${searchParams.lon} ${searchParams.lat})`,
      searchParams.distance_km * 1000,
    ];

    if (searchParams.nafDivision) {
      nafCategoryFilter = "AND naf_division=$" + (parameters.length + 1);
      parameters.push(searchParams.nafDivision);
    }

    if (searchParams.siret) {
      siretCategoryFilter = "AND siret=$" + (parameters.length + 1);
      parameters.push(searchParams.siret);
    }
    //             establishments.id as establishment_id,
    //             establishments.voluntaryToImmersion as establishment_voluntaryToImmersion,

    return this.client
      .query(
        `SELECT
            immersion_offers.* as immersion_offers,
            immersion_contacts.uuid as immersion_contacts_uuid,
            immersion_contacts.name as immersion_contacts_name,
            immersion_contacts.firstname as immersion_contacts_firstname,
            immersion_contacts.email as immersion_contacts_email,
            immersion_contacts.role as immersion_contacts_role,
            immersion_contacts.siret_establishment as immersion_contacts_siret_establishment,
            immersion_contacts.phone as immersion_contacts_phone,
            establishments.contact_mode as establishment_contact_mode,
            establishments.address as establishment_address,
            establishments.naf as establishment_naf,
            st_distance(immersion_offers.gps, st_geographyfromtext($2)) as distance_m,
            st_asgeojson(immersion_offers.gps) as position
         FROM (SELECT * FROM immersion_offers WHERE ROME=$1 ${nafCategoryFilter} ${siretCategoryFilter} AND ST_DWithin(
         immersion_offers.gps, st_geographyfromtext($2), $3)
          AND data_source != 'api_laplateformedelinclusion' ORDER BY data_source DESC) as immersion_offers
         LEFT JOIN immersion_contacts as immersion_contacts
         ON immersion_offers.contact_in_establishment_uuid = immersion_contacts.uuid
         LEFT JOIN establishments as establishments
         ON immersion_offers.siret = establishments.siret
         `,
        parameters,
      )
      .then((res) => {
        return res.rows.map((result) => {
          return this.buildImmersionOfferFromResults(result);
        });
      })
      .catch((e) => {
        logger.error(e);
        return [];
      });
  }

  buildImmersionOfferFromResults(result: any): SearchImmersionResultDto {
    let immersionContact: ImmersionEstablishmentContact | null = null;
    if (result.contact_in_establishment_uuid != null) {
      immersionContact = {
        id: result.immersion_contacts_uuid,
        name: result.immersion_contacts_name,
        firstname: result.immersion_contacts_firstname,
        email: result.immersion_contacts_email,
        role: result.immersion_contacts_role,
        siretEstablishment: result.immersion_contacts_siret_institution,
        phone: result.immersion_contacts_phone,
      };
    }

    const pgContactMode = result.establishment_contact_mode as PgContactMethod;

    const contactMode: ContactMethod =
      pgContactMode !== null
        ? pgContactToContactMethod[pgContactMode]
        : "UNKNOWN";

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
      contactMode,
      location: result.position && parseGeoJson(result.position),
      distance_m: Math.round(result.distance_m),
      city: "xxxx",
      nafLabel: "xxxx",
      romeLabel: "xxxx",
    };
  }

  async getAllSearches() {
    return this.client.query("SELECT * FROM searches_made");
  }

  async getSearchInDatabase(searchParams: SearchParams) {
    return this.client
      .query(
        "SELECT * FROM searches_made WHERE rome=$1 AND lat=$2 AND lon=$3 AND distance=$4",
        [
          searchParams.rome,
          searchParams.lat,
          searchParams.lon,
          searchParams.distance_km,
        ],
      )
      .then((res) => res.rows)
      .catch((e) => {
        logger.error(e);
        return [];
      });
  }
}
