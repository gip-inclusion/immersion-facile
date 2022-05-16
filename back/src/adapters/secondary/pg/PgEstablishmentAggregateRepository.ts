import { PoolClient } from "pg";
import format from "pg-format";
import R from "ramda";
import { ContactEntityV2 } from "../../../domain/immersionOffer/entities/ContactEntity";
import {
  DataSource,
  EstablishmentAggregate,
  EstablishmentEntityV2,
} from "../../../domain/immersionOffer/entities/EstablishmentEntity";
import { ImmersionOfferEntityV2 } from "../../../domain/immersionOffer/entities/ImmersionOfferEntity";
import { SearchMade } from "../../../domain/immersionOffer/entities/SearchMadeEntity";
import {
  EstablishmentAggregateRepository,
  OfferWithSiret,
} from "../../../domain/immersionOffer/ports/EstablishmentAggregateRepository";
import { LatLonDto } from "shared/src/latLon";
import { AppellationDto } from "shared/src/romeAndAppellationDtos/romeAndAppellation.dto";
import { SearchImmersionResultDto } from "shared/src/searchImmersion/SearchImmersionResult.dto";
import { SiretDto } from "shared/src/siret";

import { createLogger } from "../../../utils/logger";
import { NotFoundError } from "../../primary/helpers/httpErrors";
import { optional } from "./pgUtils";

const logger = createLogger(__filename);

export type PgDataSource = "api_labonneboite" | "form";

const offersEqual = (a: ImmersionOfferEntityV2, b: ImmersionOfferEntityV2) =>
  // Only compare romeCode and appellationCode
  a.romeCode === b.romeCode && a.appellationCode == b.appellationCode;

const objectsDeepEqual = <T>(a: T, b: T) =>
  R.equals(JSON.parse(JSON.stringify(a)), JSON.parse(JSON.stringify(b)));

const establishmentsEqual = (
  a: EstablishmentEntityV2,
  b: EstablishmentEntityV2,
) => {
  // Ignore key updatedAt
  const { updatedAt: _unusedUpdatedAtA, ...establishmentAWithoutUpdatedAt } = a;
  const { updatedAt: _unusedUpdatedAtB, ...establishmentBWithoutUpdatedAt } = b;

  return objectsDeepEqual(
    establishmentAWithoutUpdatedAt,
    establishmentBWithoutUpdatedAt,
  );
};
const contactsEqual = (a: ContactEntityV2, b: ContactEntityV2) => {
  // Ignore key id
  const { id: _unusedIdA, ...contactAWithoutId } = a;
  const { id: _unusedIdB, ...contactBWithoutId } = b;
  return objectsDeepEqual(contactAWithoutId, contactBWithoutId);
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

    const offersWithSiret: OfferWithSiret[] = aggregates.reduce(
      (offersWithSiret, aggregate) => [
        ...offersWithSiret,
        ...aggregate.immersionOffers.map((immersionOffer) => ({
          siret: aggregate.establishment.siret,
          ...immersionOffer,
        })),
      ],
      [] as OfferWithSiret[],
    );
    await this.createImmersionOffersToEstablishments(offersWithSiret);

    return;
  }
  public async updateEstablishmentAggregate(
    updatedAggregate: EstablishmentAggregate,
    updatedAt: Date,
  ) {
    const existingAggregate = await this.getEstablishmentAggregateBySiret(
      updatedAggregate.establishment.siret,
    );
    if (!existingAggregate)
      throw new NotFoundError(
        `We do not have an establishment with siret ${updatedAggregate.establishment.siret} to update`,
      );
    // Remove offers that don't exist anymore and create those that did not exist before
    await this._updateImmersionOffersFromAggregates(
      existingAggregate,
      updatedAggregate,
    );
    // Update establishment if it has changed
    if (
      !establishmentsEqual(
        existingAggregate.establishment,
        updatedAggregate.establishment,
      )
    ) {
      await this.updateEstablishment({
        ...updatedAggregate.establishment,
        updatedAt,
      });
    }

    // Create contact if it does'not exist
    if (!existingAggregate.contact) {
      await this._insertContactsFromAggregates([updatedAggregate]);
    } else {
      // Update contact if it has changed
      await this._updateContactFromAggregates(
        { ...existingAggregate, contact: existingAggregate.contact },
        updatedAggregate,
      );
    }
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
        uuid, lastname, firstname, email, job, phone, contact_mode, copy_emails
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

  private async _updateImmersionOffersFromAggregates(
    existingAggregate: EstablishmentAggregate,
    updatingAggregate: EstablishmentAggregate,
  ) {
    const updatedOffers = updatingAggregate.immersionOffers;
    const existingOffers = existingAggregate.immersionOffers;
    const siret = existingAggregate.establishment.siret;

    const offersToAdd = updatedOffers.filter(
      (updatedOffer) =>
        !existingOffers.find((existingOffer) =>
          offersEqual(existingOffer, updatedOffer),
        ),
    );

    if (offersToAdd.length > 0)
      await this.client.query(
        format(
          `INSERT INTO immersion_offers (
            rome_code, rome_appellation, score, created_at, siret
          ) VALUES %L`,
          offersToAdd.map((offerToAdd) => [
            offerToAdd.romeCode,
            offerToAdd.appellationCode,
            offerToAdd.score,
            offerToAdd.createdAt,
            siret,
          ]),
        ),
      );

    const offersToRemove = existingOffers.filter(
      (updatedOffer) =>
        !updatedOffers.find((existingOffer) =>
          offersEqual(existingOffer, updatedOffer),
        ),
    );
    const offersToRemoveByRomeCode = offersToRemove
      .filter((offer) => !offer.appellationCode)
      .map((offer) => offer.romeCode);

    if (offersToRemoveByRomeCode.length > 0) {
      const queryToRemoveOffersFromRome = format(
        `DELETE FROM immersion_offers WHERE siret = '%s' AND rome_appellation IS NULL AND rome_code IN (%L); `,
        siret,
        offersToRemoveByRomeCode,
      );
      await this.client.query(queryToRemoveOffersFromRome);
    }

    const offersToRemoveByRomeAppellation = offersToRemove
      .filter((offer) => !!offer.appellationCode)
      .map((offer) => offer.appellationCode);

    if (offersToRemoveByRomeAppellation.length > 0) {
      const queryToRemoveOffersFromAppellationCode = format(
        `DELETE FROM immersion_offers WHERE siret = '%s' AND rome_appellation::text IN (%L); `,
        siret,
        offersToRemoveByRomeAppellation,
      );
      await this.client.query(queryToRemoveOffersFromAppellationCode);
    }
  }

  private async _updateContactFromAggregates(
    existingAggregate: EstablishmentAggregate & {
      contact: ContactEntityV2;
    },
    updatedAggregate: EstablishmentAggregate,
  ) {
    if (
      !!updatedAggregate.contact &&
      !contactsEqual(updatedAggregate.contact, existingAggregate.contact)
    ) {
      await this.client.query(
        `UPDATE immersion_contacts 
       SET lastname = $1, 
            firstname = $2, 
            email = $3, 
            job = $4, 
            phone = $5, 
            contact_mode = $6, 
            copy_emails = $7
       WHERE uuid = $8`,
        [
          updatedAggregate.contact.lastName,
          updatedAggregate.contact.firstName,
          updatedAggregate.contact.email,
          updatedAggregate.contact.job,
          updatedAggregate.contact.phone,
          updatedAggregate.contact.contactMethod,
          JSON.stringify(updatedAggregate.contact.copyEmails),
          existingAggregate.contact.id,
        ],
      );
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
    const sortExpression =
      searchMade.sortedBy === "distance"
        ? "ORDER BY voluntary_to_immersion DESC, distance_m ASC, max_created_at DESC"
        : "ORDER BY voluntary_to_immersion DESC, max_created_at DESC, distance_m ASC";

    const selectedOffersSubQuery = format(
      `WITH active_establishments_within_area AS 
        (SELECT siret, (data_source = 'form')::boolean AS voluntary_to_immersion, gps 
         FROM establishments WHERE is_active AND is_searchable AND ST_DWithin(gps, ST_GeographyFromText($1), $2) ${filterOnVoluntaryToImmersion(
           searchMade.voluntaryToImmersion,
         )}),
        matching_offers AS (
          SELECT 
            aewa.siret, rome_code, prd.libelle_rome AS rome_label, ST_Distance(gps, ST_GeographyFromText($1)) AS distance_m,
            COALESCE(JSON_AGG(DISTINCT libelle_appellation_long) FILTER (WHERE libelle_appellation_long IS NOT NULL), '[]') AS appellation_labels,
            MAX(created_at) AS max_created_at, 
            voluntary_to_immersion
            FROM active_establishments_within_area aewa 
            LEFT JOIN immersion_offers io ON io.siret = aewa.siret 
            LEFT JOIN public_appellations_data pad ON io.rome_appellation = pad.ogr_appellation
            LEFT JOIN public_romes_data prd ON io.rome_code = prd.code_rome
            ${searchMade.rome ? "WHERE rome_code = %1$L" : ""}
            GROUP BY(aewa.siret, aewa.gps, aewa.voluntary_to_immersion, io.rome_code, prd.libelle_rome)
          )
        SELECT *, (ROW_NUMBER () OVER (${sortExpression}))::integer as row_number from matching_offers ${sortExpression}
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

  public async getSiretsOfEstablishmentsWithRomeCode(
    rome: string,
  ): Promise<string[]> {
    const pgResult = await this.client.query(
      `SELECT siret FROM immersion_offers WHERE rome_code = $1`,
      [rome],
    );
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
    propertiesToUpdate: Partial<EstablishmentEntityV2> & {
      updatedAt: Date;
      siret: SiretDto;
    },
  ): Promise<void> {
    const updateQuery = `
          UPDATE establishments
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
                   ${propertiesToUpdate.name ? ", name=%10$L" : ""}
                   ${
                     propertiesToUpdate.customizedName
                       ? ", customized_name=%11$L"
                       : ""
                   }
                   ${
                     propertiesToUpdate.isSearchable !== undefined
                       ? ", is_searchable=%12$L"
                       : ""
                   }
                   ${
                     propertiesToUpdate.isCommited !== undefined
                       ? ", is_commited=%13$L"
                       : ""
                   }

                   WHERE siret=%14$L;`;
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

      propertiesToUpdate.name,
      propertiesToUpdate.customizedName,
      propertiesToUpdate.isSearchable,
      propertiesToUpdate.isCommited,

      propertiesToUpdate.siret,
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
        SELECT siret, io.rome_code, prd.libelle_rome as rome_label, COALESCE(json_agg(pad.libelle_appellation_long) 
        FILTER (WHERE libelle_appellation_long IS NOT NULL), '[]') AS appellation_labels, null AS distance_m, 1 AS row_number
        FROM immersion_offers AS io
        LEFT JOIN public_appellations_data AS pad ON pad.ogr_appellation = io.rome_appellation 
        LEFT JOIN public_romes_data AS prd ON prd.code_rome = io.rome_code 
        WHERE io.siret = $1 AND io.rome_code = $2
        GROUP BY (siret, io.rome_code, prd.libelle_rome)`,
        [siret, rome],
      );
    return immersionSearchResultDtos[0];
  }

  public async groupEstablishmentSiretsByDataSource(
    sirets: SiretDto[],
  ): Promise<Record<DataSource, SiretDto[]>> {
    if (!sirets.length)
      return {
        api_labonneboite: [],
        form: [],
      };

    const query = format(
      `
      WITH grouped_sirets AS (SELECT data_source, JSONB_AGG(siret) AS sirets
              FROM establishments
              WHERE siret IN (%1$L)
              GROUP BY data_source) 
      SELECT JSONB_OBJECT_AGG(data_source, sirets) AS sirets_by_data_source FROM grouped_sirets`,
      sirets,
    );
    const pgResult = await this.client.query(query);
    const row = pgResult.rows[0].sirets_by_data_source;
    return {
      api_labonneboite: row?.api_labonneboite ?? [],
      form: row?.form ?? [],
    };
  }

  public async createImmersionOffersToEstablishments(
    offersWithSiret: OfferWithSiret[],
  ) {
    if (offersWithSiret.length === 0) return;

    const immersionOfferFields: any[][] = offersWithSiret.map(
      (offerWithSiret) => [
        offerWithSiret.romeCode,
        offerWithSiret.appellationCode,
        offerWithSiret.siret,
        offerWithSiret.score,
        offerWithSiret.createdAt,
      ],
    );
    const query = format(
      `INSERT INTO immersion_offers (
          rome_code, rome_appellation, siret, score, created_at
        ) VALUES %L`,
      immersionOfferFields,
    );
    await this.client.query(query);
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
      contactDetails: row.search_immersion_result.contactDetails?.id
        ? row.search_immersion_result.contactDetails
        : undefined,
      distance_m: optional(row.search_immersion_result.distance_m),
      numberOfEmployeeRange: optional(
        row.search_immersion_result.numberOfEmployeeRange,
      ),
    }));
  }
  async getEstablishmentAggregateBySiret(
    siret: SiretDto,
  ): Promise<EstablishmentAggregate | undefined> {
    const aggregateWithStringDates = (
      await this.client.query(
        `WITH 
          unique_establishments__immersion_contacts AS ( SELECT DISTINCT ON (establishment_siret) establishment_siret, contact_uuid FROM establishments__immersion_contacts ),
          filtered_immersion_offers AS (SELECT siret, JSON_AGG(JSON_BUILD_OBJECT('romeCode', rome_code, 'score', score, 'id', uuid, 'appellationCode', rome_appellation::text, 'createdAt',  to_char(created_at::timestamp, 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'))) as immersionOffers
             FROM immersion_offers WHERE siret = $1 GROUP BY siret)
        SELECT JSON_STRIP_NULLS(JSON_BUILD_OBJECT(
          'establishment', JSON_BUILD_OBJECT(
            'siret', e.siret, 
            'name', e.name, 
            'customizedName', e.customized_name, 
            'address', e.address, 
            'voluntaryToImmersion', e.data_source = 'form',
            'dataSource', e.data_source, 
            'sourceProvider', e.source_provider, 
            'position', JSON_BUILD_OBJECT('lon', e.lon, 'lat', e.lat), 
            'nafDto',JSON_BUILD_OBJECT('code', e.naf_code, 'nomenclature', e.naf_nomenclature), 
            'numberEmployeesRange', e.number_employees, 
            'updatedAt', to_char(e.update_date::timestamp, 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'), 
            'isActive', e.is_active, 
            'isSearchable', e.is_searchable, 
            'isCommited', e.is_commited
            ),
          'immersionOffers', io.immersionOffers,
          'contact', JSON_BUILD_OBJECT(
            'id', ic.uuid,
            'firstName', ic.firstname,
            'lastName', ic.lastname,
            'job', ic.job,
            'contactMethod', ic.contact_mode,
            'phone', ic.phone,
            'email', ic.email,
            'copyEmails', ic.copy_emails)
          )) AS aggregate
          FROM filtered_immersion_offers AS io
          LEFT JOIN establishments AS e ON e.siret = io.siret
          LEFT JOIN unique_establishments__immersion_contacts AS eic ON e.siret = eic.establishment_siret
          LEFT JOIN immersion_contacts AS ic ON eic.contact_uuid = ic.uuid; 
        `,
        [siret],
      )
    ).rows[0]?.aggregate;
    // Convert date fields from string to Date
    return (
      aggregateWithStringDates && {
        establishment: {
          ...aggregateWithStringDates.establishment,
          updatedAt: aggregateWithStringDates.establishment.updatedAt
            ? new Date(aggregateWithStringDates.establishment.updatedAt)
            : undefined,
        },
        immersionOffers: aggregateWithStringDates.immersionOffers.map(
          (immersionOfferWithStringDate: any) => ({
            ...immersionOfferWithStringDate,
            createdAt: new Date(immersionOfferWithStringDate.createdAt),
          }),
        ),
        contact: aggregateWithStringDates.contact,
      }
    );
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
      SELECT 
      row_number,
      JSONB_BUILD_OBJECT(
      'rome', io.rome_code, 
      'siret', io.siret, 
      'distance_m', io.distance_m, 
      'name', e.name, 
      'customizedName', e.customized_name, 
      'voluntaryToImmersion', e.data_source = 'form',
      'position', JSON_BUILD_OBJECT('lon', e.lon, 'lat', e.lat), 
      'romeLabel', io.rome_label,
      'appellationLabels',  io.appellation_labels,
      'naf', e.naf_code,
      'nafLabel', public_naf_classes_2008.class_label,
      'address', e.address, 
      'city', (REGEXP_MATCH(e.address,  '^.*\\d{5}\\s(.*)$'))[1],
      'contactMode', ic.contact_mode,
      'contactDetails', JSON_BUILD_OBJECT('id', ic.uuid, 'firstName', ic.firstname, 'lastName', ic.lastname, 'email', ic.email, 'job', ic.job, 'phone', ic.phone ),
      'numberOfEmployeeRange', e.number_employees 
      ) AS search_immersion_result
      FROM match_immersion_offer AS io 
      LEFT JOIN establishments AS e ON e.siret = io.siret  
      LEFT JOIN public_naf_classes_2008 ON (public_naf_classes_2008.class_id = REGEXP_REPLACE(naf_code,'(\\d\\d)(\\d\\d).', '\\1.\\2'))
      LEFT JOIN unique_establishments__immersion_contacts AS eic ON eic.establishment_siret = e.siret
      LEFT JOIN immersion_contacts AS ic ON ic.uuid = eic.contact_uuid
      ORDER BY row_number ASC; `;
