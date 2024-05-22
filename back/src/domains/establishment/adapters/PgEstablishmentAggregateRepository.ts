import { sql } from "kysely";
import format from "pg-format";
import { equals, keys } from "ramda";
import {
  AppellationAndRomeDto,
  AppellationCode,
  LocationId,
  RomeCode,
  SearchResultDto,
  SearchSortedBy,
  SiretDto,
  castError,
} from "shared";
import {
  BadRequestError,
  NotFoundError,
} from "../../../config/helpers/httpErrors";
import {
  KyselyDb,
  executeKyselyRawSqlQuery,
} from "../../../config/pg/kysely/kyselyUtils";
import { optional } from "../../../config/pg/pgUtils";
import { createLogger } from "../../../utils/logger";
import { ContactEntity } from "../entities/ContactEntity";
import {
  EstablishmentAggregate,
  EstablishmentEntity,
} from "../entities/EstablishmentEntity";
import { OfferEntity } from "../entities/OfferEntity";
import { SearchMade } from "../entities/SearchMadeEntity";
import {
  EstablishmentAggregateRepository,
  OfferWithSiret,
  SearchImmersionResult,
  UpdateEstablishmentsWithInseeDataParams,
} from "../ports/EstablishmentAggregateRepository";

const logger = createLogger(__filename);

export class PgEstablishmentAggregateRepository
  implements EstablishmentAggregateRepository
{
  constructor(private transaction: KyselyDb) {}

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
          rome_code, appellation_code, siret, score, created_at
        ) VALUES %L`,
      immersionOfferFields,
    );
    await executeKyselyRawSqlQuery(this.transaction, query);
  }

  public async delete(siret: string): Promise<void> {
    try {
      logger.info({
        message: `About to delete establishment with siret : ${siret}`,
      });

      await this.#deleteEstablishmentContactBySiret(siret);

      const { numAffectedRows } = await executeKyselyRawSqlQuery(
        this.transaction,
        `
        DELETE
        FROM establishments
        WHERE siret = $1;
      `,
        [siret],
      );
      if (Number(numAffectedRows) !== 1)
        throw new NotFoundError(
          `Establishment with siret ${siret} missing on Establishment Aggregate Repository.`,
        );
      logger.info({
        message: `Deleted establishment successfully. Siret was : ${siret}`,
      });
    } catch (error: any) {
      logger.info({
        message: `Error when deleting establishment with siret ${siret} : ${error.message}`,
      });
      logger.info({ message: "Full Error", error });
      throw error;
    }
  }

  public async getEstablishmentAggregateBySiret(
    siret: SiretDto,
  ): Promise<EstablishmentAggregate | undefined> {
    const aggregateWithStringDates = (
      await executeKyselyRawSqlQuery(
        this.transaction,
        `WITH unique_establishments_contacts AS (
          SELECT 
            DISTINCT ON (siret) siret, 
            uuid 
          FROM 
            establishments_contacts
        ), 
        filtered_immersion_offers AS (
          SELECT 
            siret, 
            JSON_AGG(
              JSON_BUILD_OBJECT(
                'romeCode', rome_code, 
                'romeLabel', libelle_rome,
                'score', score, 
                'appellationCode', appellation_code::text, 
                'appellationLabel', pad.libelle_appellation_long::text,
                'createdAt', 
                to_char(
                  created_at::timestamp, 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'
                )
              )
              ORDER BY appellation_code
            ) as immersionOffers 
          FROM 
            immersion_offers
          LEFT JOIN public_appellations_data AS pad ON pad.ogr_appellation = immersion_offers.appellation_code
          LEFT JOIN public_romes_data AS prd ON prd.code_rome = immersion_offers.rome_code
          WHERE 
            siret = $1 
          GROUP BY 
            siret
        ),
        ${withEstablishmentAggregateSubQuery}
         SELECT 
          JSON_STRIP_NULLS(
            JSON_BUILD_OBJECT(
              'establishment', JSON_BUILD_OBJECT(
                'acquisitionCampaign', e.acquisition_campaign,
                'acquisitionKeyword' , e.acquisition_keyword,
                'siret', e.siret, 
                'name', e.name, 
                'customizedName', e.customized_name, 
                'website', e.website, 
                'additionalInformation', e.additional_information,
                'locations', ela.locations,  
                'sourceProvider', e.source_provider,  
                'nafDto', JSON_BUILD_OBJECT(
                  'code', e.naf_code, 
                  'nomenclature', e.naf_nomenclature
                ), 
                'numberEmployeesRange', e.number_employees, 
                'updatedAt', to_char(
                  e.update_date::timestamp, 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'
                ), 
                'createdAt', to_char(
                  e.created_at::timestamp, 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'
                ), 
                'lastInseeCheckDate', to_char(
                  e.last_insee_check_date::timestamp, 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'
                ), 
                'isOpen', e.is_open, 
                'isSearchable', e.is_searchable, 
                'isCommited', e.is_commited,
                'fitForDisabledWorkers', e.fit_for_disabled_workers,
                'maxContactsPerWeek', e.max_contacts_per_week,
                'nextAvailabilityDate', date_to_iso(e.next_availability_date),
                'searchableBy', JSON_BUILD_OBJECT(
                  'jobSeekers', e.searchable_by_job_seekers,
                  'students', e.searchable_by_students
                )
              ), 
              'immersionOffers', io.immersionOffers, 
              'contact', JSON_BUILD_OBJECT(
                'id', ec.uuid, 'firstName', ec.firstname, 
                'lastName', ec.lastname, 'job', ec.job, 
                'contactMethod', ec.contact_mode, 
                'phone', ec.phone, 'email', ec.email, 
                'copyEmails', ec.copy_emails
              )
            )
          ) AS aggregate 
        FROM 
          filtered_immersion_offers AS io 
          LEFT JOIN establishments AS e ON e.siret = io.siret 
          LEFT JOIN unique_establishments_contacts AS uec ON e.siret = uec.siret 
          LEFT JOIN establishments_contacts AS ec ON uec.uuid = ec.uuid
          LEFT JOIN establishment_locations_agg AS ela ON e.siret = ela.establishment_siret
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
          createdAt: new Date(aggregateWithStringDates.establishment.createdAt),
          lastInseeCheckDate: aggregateWithStringDates.establishment
            .lastInseeCheckDate
            ? new Date(
                aggregateWithStringDates.establishment.lastInseeCheckDate,
              )
            : undefined,
          voluntaryToImmersion: true,
        },
        offers: aggregateWithStringDates.immersionOffers.map(
          (immersionOfferWithStringDate: any) => ({
            ...immersionOfferWithStringDate,
            createdAt: new Date(immersionOfferWithStringDate.createdAt),
          }),
        ),
        contact: aggregateWithStringDates.contact,
      }
    );
  }

  public async getEstablishmentAggregates({
    contactEmail,
  }: { contactEmail: string }): Promise<EstablishmentAggregate[]> {
    const aggregateWithStringDates = await executeKyselyRawSqlQuery(
      this.transaction,
      `WITH unique_establishments_contacts AS (
          SELECT 
            DISTINCT ON (siret) siret, 
            uuid 
          FROM 
            establishments_contacts
          WHERE establishments_contacts.email = $1
        ), 
        filtered_immersion_offers AS (
          SELECT
            immersion_offers.siret as siret, 
            JSON_AGG(
              JSON_BUILD_OBJECT(
                'romeCode', rome_code, 
                'romeLabel', libelle_rome,
                'score', score, 
                'appellationCode', appellation_code::text, 
                'appellationLabel', pad.libelle_appellation_long::text,
                'createdAt', 
                to_char(
                  created_at::timestamp, 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'
                )
              )
              ORDER BY appellation_code
            ) as immersionOffers 
          FROM 
            immersion_offers
          LEFT JOIN public_appellations_data AS pad ON pad.ogr_appellation = immersion_offers.appellation_code
          LEFT JOIN public_romes_data AS prd ON prd.code_rome = immersion_offers.rome_code
          RIGHT JOIN unique_establishments_contacts as uec ON uec.siret = immersion_offers.siret
          GROUP BY
              immersion_offers.siret
        ),
        ${withEstablishmentAggregateSubQuery}
         SELECT 
          JSON_STRIP_NULLS(
            JSON_BUILD_OBJECT(
              'establishment', JSON_BUILD_OBJECT(
                'siret', e.siret, 
                'name', e.name, 
                'customizedName', e.customized_name, 
                'website', e.website, 
                'additionalInformation', e.additional_information,
                'locations', ela.locations,  
                'sourceProvider', e.source_provider,  
                'nafDto', JSON_BUILD_OBJECT(
                  'code', e.naf_code, 
                  'nomenclature', e.naf_nomenclature
                ), 
                'numberEmployeesRange', e.number_employees, 
                'updatedAt', to_char(
                  e.update_date::timestamp, 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'
                ), 
                'createdAt', to_char(
                  e.created_at::timestamp, 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'
                ), 
                'lastInseeCheckDate', to_char(
                  e.last_insee_check_date::timestamp, 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'
                ), 
                'isOpen', e.is_open, 
                'isSearchable', e.is_searchable, 
                'isCommited', e.is_commited,
                'fitForDisabledWorkers', e.fit_for_disabled_workers,
                'maxContactsPerWeek', e.max_contacts_per_week,
                'nextAvailabilityDate', date_to_iso(e.next_availability_date),
                'searchableBy', JSON_BUILD_OBJECT(
                  'jobSeekers', e.searchable_by_job_seekers,
                  'students', e.searchable_by_students
                )
              ), 
              'immersionOffers', io.immersionOffers, 
              'contact', JSON_BUILD_OBJECT(
                'id', ec.uuid, 'firstName', ec.firstname, 
                'lastName', ec.lastname, 'job', ec.job, 
                'contactMethod', ec.contact_mode, 
                'phone', ec.phone, 'email', ec.email, 
                'copyEmails', ec.copy_emails
              )
            )
          ) AS aggregate 
        FROM 
          filtered_immersion_offers AS io 
          LEFT JOIN establishments AS e ON e.siret = io.siret 
          LEFT JOIN unique_establishments_contacts AS uec ON e.siret = uec.siret 
          LEFT JOIN establishments_contacts AS ec ON uec.uuid = ec.uuid
          LEFT JOIN establishment_locations_agg AS ela ON e.siret = ela.establishment_siret
        `,
      [contactEmail],
    );
    const results = aggregateWithStringDates.rows;
    return results.map(({ aggregate }) => ({
      establishment: {
        ...aggregate.establishment,
        updatedAt: aggregate.establishment.updatedAt
          ? new Date(aggregate.establishment.updatedAt)
          : undefined,
        createdAt: new Date(aggregate.establishment.createdAt),
        lastInseeCheckDate: aggregate.establishment.lastInseeCheckDate
          ? new Date(aggregate.establishment.lastInseeCheckDate)
          : undefined,
        voluntaryToImmersion: true,
      },
      offers: aggregate.immersionOffers.map(
        (immersionOfferWithStringDate: any) => ({
          ...immersionOfferWithStringDate,
          createdAt: new Date(immersionOfferWithStringDate.createdAt),
        }),
      ),
      contact: aggregate.contact,
    }));
  }

  public async getOffersAsAppellationDtoEstablishment(
    siret: string,
  ): Promise<AppellationAndRomeDto[]> {
    const pgResult = await executeKyselyRawSqlQuery(
      this.transaction,
      `SELECT io.*, libelle_rome, libelle_appellation_long, ogr_appellation
       FROM immersion_offers io
       JOIN public_romes_data prd ON prd.code_rome = io.rome_code 
       LEFT JOIN public_appellations_data pad on io.appellation_code = pad.ogr_appellation
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

  public async getSearchImmersionResultDtoBySearchQuery(
    siret: SiretDto,
    appellationCode: AppellationCode,
    locationId: LocationId,
  ): Promise<SearchResultDto | undefined> {
    const subQuery = `
      SELECT 
        io.siret,
        io.rome_code,
        prd.libelle_rome as rome_label,
        ${buildAppellationsArray},
        null AS distance_m,
        1 AS row_number,
        loc.*,
        loc.id AS location_id,
        e.naf_code,
        e.is_searchable,
        date_to_iso(e.next_availability_date) as next_availability_date,
        e.name,
        e.website,
        e.additional_information,
        e.customized_name,
        e.fit_for_disabled_workers,
        e.number_employees
      FROM immersion_offers AS io
      LEFT JOIN establishments e ON io.siret = e.siret
      LEFT JOIN public_appellations_data AS pad ON pad.ogr_appellation = io.appellation_code 
      LEFT JOIN public_romes_data AS prd ON prd.code_rome = io.rome_code 
      LEFT JOIN establishments_locations AS loc ON loc.establishment_siret = io.siret
      WHERE io.siret = $1 AND io.appellation_code = $2 AND loc.id = $3
      GROUP BY (io.siret, io.rome_code, prd.libelle_rome, location_id, e.naf_code, e.is_searchable, e.next_availability_date, e.name, e.website,
               e.additional_information, e.customized_name, e.fit_for_disabled_workers, e.number_employees)`;

    const immersionSearchResultDtos =
      await this.#selectImmersionSearchResultDtoQueryGivenSelectedOffersSubQuery(
        subQuery,
        [siret, appellationCode, locationId],
      );
    const immersionSearchResultDto = immersionSearchResultDtos.at(0);
    if (!immersionSearchResultDto) return;
    const { isSearchable: _, ...rest } = immersionSearchResultDto;
    return rest;
  }

  public async getSiretOfEstablishmentsToSuggestUpdate(
    before: Date,
  ): Promise<SiretDto[]> {
    const response = await executeKyselyRawSqlQuery(
      this.transaction,
      `SELECT DISTINCT e.siret 
       FROM establishments e
       WHERE e.update_date < $1 
       AND NOT EXISTS (
          SELECT 1 
          FROM outbox o
          WHERE o.topic='FormEstablishmentEditLinkSent' 
          AND o.occurred_at > $1
          AND o.payload ->> 'siret' = e.siret
       )
       AND NOT EXISTS (
          SELECT 1 
          FROM notifications_email n
          WHERE n.email_kind='SUGGEST_EDIT_FORM_ESTABLISHMENT' 
          AND n.created_at > $1
          AND n.establishment_siret = e.siret
       )`,
      [before],
    );

    return response.rows.map(({ siret }) => siret);
  }

  public async getSiretsOfEstablishmentsNotCheckedAtInseeSince(
    checkDate: Date,
    maxResults: number,
  ): Promise<SiretDto[]> {
    if (maxResults > 1000)
      throw new BadRequestError(
        "Querying getSiretsOfEstablishmentsNotCheckedAtInseeSince, maxResults must be <= 1000",
      );

    const result = await executeKyselyRawSqlQuery(
      this.transaction,
      `
        SELECT siret
        FROM establishments
        WHERE last_insee_check_date IS NULL OR last_insee_check_date < $1
        LIMIT $2
    `,
      [checkDate.toISOString(), maxResults],
    );

    return result.rows.map(({ siret }) => siret);
  }

  public async getSiretsOfEstablishmentsWithRomeCode(
    rome: string,
  ): Promise<string[]> {
    const pgResult = await executeKyselyRawSqlQuery(
      this.transaction,
      "SELECT siret FROM immersion_offers WHERE rome_code = $1",
      [rome],
    );
    return pgResult.rows.map((row) => row.siret);
  }

  public async hasEstablishmentWithSiret(siret: string): Promise<boolean> {
    const pgResult = await executeKyselyRawSqlQuery(
      this.transaction,
      "SELECT EXISTS (SELECT 1 FROM establishments WHERE siret = $1);",
      [siret],
    );
    return pgResult.rows[0].exists;
  }

  public async insertEstablishmentAggregate(aggregate: EstablishmentAggregate) {
    await this.#insertEstablishmentFromAggregate(aggregate);
    await this.#insertLocations(aggregate);
    await this.#insertContactFromAggregate(aggregate);
    await this.createImmersionOffersToEstablishments(
      aggregate.offers.map((immersionOffer) => ({
        siret: aggregate.establishment.siret,
        ...immersionOffer,
      })),
    );
  }

  public async markEstablishmentAsSearchableWhenRecentDiscussionAreUnderMaxContactPerWeek(
    since: Date,
  ): Promise<number> {
    const querySiretsOfEstablishmentsWhichHaveReachedMaxContactPerWeek = `
      SELECT e.siret
      FROM establishments e
      LEFT JOIN discussions d ON e.siret = d.siret
      WHERE is_searchable = false
        AND max_contacts_per_week > 0
        AND d.created_at > $1
      GROUP BY e.siret HAVING COUNT(*) >= e.max_contacts_per_week
      `;

    const result = await executeKyselyRawSqlQuery(
      this.transaction,
      `
        UPDATE establishments
        SET is_searchable = true 
        WHERE is_searchable = false
          AND max_contacts_per_week > 0
          AND siret NOT IN (${querySiretsOfEstablishmentsWhichHaveReachedMaxContactPerWeek})
        `,
      [since],
    );

    return Number(result.numAffectedRows);
  }

  public async searchImmersionResults({
    searchMade,
    maxResults,
  }: {
    searchMade: SearchMade;
    maxResults?: number;
  }): Promise<SearchImmersionResult[]> {
    const romeCodes =
      searchMade.romeCode ??
      (await this.#getRomeCodeFromAppellationCode(searchMade.appellationCodes));
    const andSearchableByFilter = searchMade.establishmentSearchableBy
      ? `AND (searchable_by_students IS ${
          searchMade.establishmentSearchableBy === "students"
        } OR searchable_by_job_seekers IS ${
          searchMade.establishmentSearchableBy === "jobSeekers"
        })`
      : "";
    const sortExpression = makeOrderByStatement(searchMade.sortedBy);
    const selectedOffersSubQuery = format(
      `WITH
        active_establishments_within_area AS (
          SELECT
              e.siret,
              e.fit_for_disabled_workers,
              date_to_iso(e.next_availability_date) as next_availability_date,
              e.additional_information,
              e.customized_name,
              e.is_searchable,
              e.naf_code,
              e.name,
              e.number_employees,
              e.website,
              loc.*
          FROM establishments e
          LEFT JOIN establishments_locations loc ON loc.establishment_siret = e.siret
          WHERE is_open 
          ${andSearchableByFilter}
          AND ST_DWithin(loc.position, ST_GeographyFromText($1), $2)
        ),
        matching_offers AS (
          SELECT 
            aewa.siret, 
            aewa.position,
            aewa.lat,
            aewa.lon,
            aewa.city,
            aewa.street_number_and_address,
            aewa.department_code,
            aewa.post_code,
            aewa.id as location_id,
            rome_code, 
            prd.libelle_rome AS rome_label, 
            ST_Distance(aewa.position, ST_GeographyFromText($1)) AS distance_m,
            aewa.fit_for_disabled_workers,
            aewa.next_availability_date,
            aewa.additional_information,
            aewa.customized_name,
            aewa.is_searchable,
            aewa.naf_code,
            aewa.name,
            aewa.number_employees,
            aewa.website,
            ${buildAppellationsArray},
            ${
              searchMade.sortedBy === "score"
                ? "MAX(io.score) AS max_score,"
                : ""
            }
            MAX(created_at) AS max_created_at
            
          FROM active_establishments_within_area aewa 
          LEFT JOIN immersion_offers io ON io.siret = aewa.siret 
          LEFT JOIN public_appellations_data pad ON io.appellation_code = pad.ogr_appellation
          LEFT JOIN public_romes_data prd ON io.rome_code = prd.code_rome
          ${romeCodes ? "WHERE rome_code in (%1$L)" : ""}
          GROUP BY(aewa.siret, aewa.position, aewa.fit_for_disabled_workers, io.rome_code, prd.libelle_rome, aewa.lat, aewa.lon,
              aewa.city, aewa.position, aewa.street_number_and_address, aewa.department_code, aewa.post_code, aewa.id,
              aewa.next_availability_date, aewa.additional_information, aewa.customized_name, aewa.is_searchable, aewa.naf_code, aewa.name, aewa.number_employees, aewa.website)
        )
        SELECT *, 
        (
          ROW_NUMBER () OVER (${sortExpression})
        )::integer AS row_number 
        FROM matching_offers
        ${sortExpression}
        LIMIT $3`,
      romeCodes,
    ); // Formats optional litterals %1$L
    const immersionSearchResultDtos =
      await this.#selectImmersionSearchResultDtoQueryGivenSelectedOffersSubQuery(
        selectedOffersSubQuery,
        [
          `POINT(${searchMade.lon} ${searchMade.lat})`,
          searchMade.distanceKm * 1000, // Formats parameters $1, $2
          maxResults,
        ],
      );
    return immersionSearchResultDtos.map((dto) => ({
      ...dto,
      voluntaryToImmersion: true,
    }));
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
    await this.#updateImmersionOffersFromAggregates(
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
      await this.#updateEstablishmentEntity(
        updatedAggregate.establishment,
        updatedAt,
      );
    }

    if (
      !existingAggregate.contact ||
      keys(existingAggregate.contact).length === 0
    ) {
      await this.#insertContactFromAggregate(updatedAggregate);
    } else {
      // Update contact if it has changed
      await this.#updateContactFromAggregates(
        { ...existingAggregate, contact: existingAggregate.contact },
        updatedAggregate,
      );
    }
  }

  public async updateEstablishmentsWithInseeData(
    inseeCheckDate: Date,
    params: UpdateEstablishmentsWithInseeDataParams,
  ): Promise<void> {
    const queries = keys(params).map((siret) => {
      const values = params[siret];
      return format(
        `
            UPDATE establishments
            SET last_insee_check_date = %1$L 
              ${values?.isOpen !== undefined ? ", is_open=%3$L" : ""}
              ${values?.nafDto ? ", naf_code=%4$L" : ""}
              ${values?.nafDto ? ", naf_nomenclature=%5$L" : ""}
              ${values?.name ? ", name=%6$L" : ""}
              ${values?.numberEmployeesRange ? ", number_employees=%7$L" : ""}
            WHERE siret = %2$L;`,
        inseeCheckDate.toISOString(),
        siret,
        ...[
          values?.isOpen,
          values?.nafDto?.code,
          values?.nafDto?.nomenclature,
          values?.name,
          values?.numberEmployeesRange,
        ],
      );
    });

    await executeKyselyRawSqlQuery(this.transaction, queries.join("\n"));
  }

  async #updateEstablishmentEntity(
    establishment: EstablishmentEntity,
    updatedAt: Date,
  ): Promise<void> {
    await this.transaction
      .updateTable("establishments")
      .set({
        additional_information: establishment.additionalInformation ?? null,
        customized_name: establishment.customizedName ?? null,
        fit_for_disabled_workers: establishment.fitForDisabledWorkers ?? null,
        is_commited: establishment.isCommited ?? null,
        is_open: establishment.isOpen,
        is_searchable: establishment.isSearchable,
        last_insee_check_date: establishment.lastInseeCheckDate ?? null,
        max_contacts_per_week: establishment.maxContactsPerWeek,
        naf_code: establishment.nafDto.code,
        naf_nomenclature: establishment.nafDto.nomenclature,
        name: establishment.name,
        next_availability_date: establishment.nextAvailabilityDate ?? null,
        number_employees: establishment.numberEmployeesRange,
        searchable_by_job_seekers: establishment.searchableBy.jobSeekers,
        searchable_by_students: establishment.searchableBy.students,
        siret: establishment.siret,
        source_provider: establishment.sourceProvider,
        update_date: updatedAt,
        website: establishment.website ?? null,
      })
      .where("siret", "=", establishment.siret)
      .execute();

    await this.transaction
      .deleteFrom("establishments_locations")
      .where("establishment_siret", "=", establishment.siret)
      .execute();

    await this.transaction
      .insertInto("establishments_locations")
      .values(
        establishment.locations.map(({ address, id, position }) => ({
          id,
          establishment_siret: establishment.siret,
          city: address.city,
          department_code: address.departmentCode,
          post_code: address.postcode,
          street_number_and_address: address.streetNumberAndAddress,
          lat: position.lat,
          lon: position.lon,
          position: sql`ST_MakePoint(${position.lon}, ${position.lat})`,
        })),
      )
      .execute();
  }

  async #deleteEstablishmentContactBySiret(siret: SiretDto): Promise<void> {
    await executeKyselyRawSqlQuery(
      this.transaction,
      `
        DELETE
        FROM establishments_contacts
        WHERE siret = $1
      `,
      [siret],
    );
  }

  async #selectImmersionSearchResultDtoQueryGivenSelectedOffersSubQuery(
    selectedOffersSubQuery: string,
    selectedOffersSubQueryParams: any[],
  ): Promise<SearchImmersionResult[]> {
    // Given a subquery and its parameters to select immersion offers (with columns siret, rome_code, rome_label, appellations and distance_m),
    // this method returns a list of SearchImmersionResultDto

    const pgResult = await executeKyselyRawSqlQuery(
      this.transaction,
      makeSelectImmersionSearchResultDtoQueryGivenSelectedOffersSubQuery(
        selectedOffersSubQuery,
      ),
      selectedOffersSubQueryParams,
    );

    return pgResult.rows.map(
      (row): SearchImmersionResult => ({
        ...row.search_immersion_result,
        // TODO : find a way to return 'undefined' instead of 'null' from query
        customizedName: optional(row.search_immersion_result.customizedName),
        contactMode: optional(row.search_immersion_result.contactMode),
        distance_m: optional(row.search_immersion_result.distance_m),
        numberOfEmployeeRange: optional(
          row.search_immersion_result.numberOfEmployeeRange,
        ),
        fitForDisabledWorkers: optional(
          row.search_immersion_result.fitForDisabledWorkers,
        ),
        voluntaryToImmersion: true,
        isSearchable: row.search_immersion_result.isSearchable,
        nextAvailabilityDate: row.search_immersion_result.nextAvailabilityDate,
        locationId: row.search_immersion_result.locationId,
      }),
    );
  }

  async #insertEstablishmentFromAggregate(aggregate: EstablishmentAggregate) {
    await this.transaction
      .insertInto("establishments")
      .values({
        siret: aggregate.establishment.siret,
        name: aggregate.establishment.name,
        customized_name: aggregate.establishment.customizedName,
        website: aggregate.establishment.website,
        additional_information: aggregate.establishment.additionalInformation,
        number_employees: aggregate.establishment.numberEmployeesRange,
        naf_code: aggregate.establishment.nafDto.code,
        naf_nomenclature: aggregate.establishment.nafDto.nomenclature,
        source_provider: aggregate.establishment.sourceProvider,
        update_date: aggregate.establishment.updatedAt,
        is_open: aggregate.establishment.isOpen,
        is_searchable: aggregate.establishment.isSearchable,
        is_commited: aggregate.establishment.isCommited,
        fit_for_disabled_workers: aggregate.establishment.fitForDisabledWorkers,
        max_contacts_per_week: aggregate.establishment.maxContactsPerWeek,
        last_insee_check_date: aggregate.establishment.lastInseeCheckDate,
        created_at: aggregate.establishment.createdAt,
        next_availability_date: aggregate.establishment.nextAvailabilityDate,
        searchable_by_students: aggregate.establishment.searchableBy.students,
        searchable_by_job_seekers:
          aggregate.establishment.searchableBy.jobSeekers,
        acquisition_keyword: aggregate.establishment.acquisitionKeyword,
        acquisition_campaign: aggregate.establishment.acquisitionCampaign,
      })
      .execute();
  }

  async #insertContactFromAggregate(aggregate: EstablishmentAggregate) {
    const contact = aggregate.contact;
    if (!contact) return;
    const contactFields = [
      contact.id,
      contact.lastName,
      contact.firstName,
      contact.email,
      contact.job,
      contact.phone,
      contact.contactMethod,
      JSON.stringify(contact.copyEmails),
      aggregate.establishment.siret,
    ];

    try {
      const insertContactsQuery = format(
        `INSERT INTO establishments_contacts (
        uuid, lastname, firstname, email, job, phone, contact_mode, copy_emails, siret
      ) VALUES ( %L )`,
        contactFields,
      );

      await executeKyselyRawSqlQuery(this.transaction, insertContactsQuery);
    } catch (error) {
      logger.error({
        error: castError(error),
        message: "Error inserting contacts",
      });
      throw error;
    }
  }

  async #getRomeCodeFromAppellationCode(
    appellationCodes: AppellationCode[] | undefined,
  ): Promise<RomeCode[] | undefined> {
    if (!appellationCodes) return;

    const result = await executeKyselyRawSqlQuery(
      this.transaction,
      format(
        `SELECT code_rome
        from public_appellations_data
        where ogr_appellation in (%L)`,
        appellationCodes,
      ),
    );

    const romeCodes: RomeCode[] | undefined =
      result.rows.length > 0
        ? result.rows.map(({ code_rome }) => code_rome)
        : undefined;
    if (!romeCodes)
      throw new Error(
        `No Rome code found for appellation codes ${appellationCodes}`,
      );

    return romeCodes;
  }

  async #updateImmersionOffersFromAggregates(
    existingAggregate: EstablishmentAggregate,
    updatingAggregate: EstablishmentAggregate,
  ) {
    const updatedOffers = updatingAggregate.offers;
    const existingOffers = existingAggregate.offers;
    const siret = existingAggregate.establishment.siret;

    const offersToAdd = updatedOffers.filter(
      (updatedOffer) =>
        !existingOffers.find((existingOffer) =>
          offersEqual(existingOffer, updatedOffer),
        ),
    );

    if (offersToAdd.length > 0)
      await executeKyselyRawSqlQuery(
        this.transaction,
        format(
          `INSERT INTO immersion_offers (
            rome_code, appellation_code, score, created_at, siret
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
        `DELETE FROM immersion_offers WHERE siret = '%s' AND appellation_code IS NULL AND rome_code IN (%L); `,
        siret,
        offersToRemoveByRomeCode,
      );
      await executeKyselyRawSqlQuery(
        this.transaction,
        queryToRemoveOffersFromRome,
      );
    }

    const offersToRemoveByRomeAppellation = offersToRemove
      .filter((offer) => !!offer.appellationCode)
      .map((offer) => offer.appellationCode);

    if (offersToRemoveByRomeAppellation.length > 0) {
      const queryToRemoveOffersFromAppellationCode = format(
        `DELETE FROM immersion_offers WHERE siret = '%s' AND appellation_code::text IN (%L); `,
        siret,
        offersToRemoveByRomeAppellation,
      );
      await executeKyselyRawSqlQuery(
        this.transaction,
        queryToRemoveOffersFromAppellationCode,
      );
    }
  }

  async #updateContactFromAggregates(
    existingAggregate: EstablishmentAggregate & {
      contact: ContactEntity;
    },
    updatedAggregate: EstablishmentAggregate,
  ) {
    if (
      !!updatedAggregate.contact &&
      !contactsEqual(updatedAggregate.contact, existingAggregate.contact)
    ) {
      await executeKyselyRawSqlQuery(
        this.transaction,
        ` UPDATE establishments_contacts
          SET lastname = $1, 
            firstname = $2, 
            email = $3, 
            job = $4, 
            phone = $5, 
            contact_mode = $6, 
            copy_emails = $7,
            siret = $8
          WHERE uuid = $9`,
        [
          updatedAggregate.contact.lastName,
          updatedAggregate.contact.firstName,
          updatedAggregate.contact.email,
          updatedAggregate.contact.job,
          updatedAggregate.contact.phone,
          updatedAggregate.contact.contactMethod,
          JSON.stringify(updatedAggregate.contact.copyEmails),
          updatedAggregate.establishment.siret,
          existingAggregate.contact.id,
        ],
      );
    }
  }

  async #insertLocations(aggregate: EstablishmentAggregate) {
    const convertPositionToStGeography = ({ lat, lon }: any) =>
      `ST_GeographyFromText('POINT(${lon} ${lat})')`;

    const locationFields = aggregate.establishment.locations.map(
      ({ address, id, position }) => [
        id,
        aggregate.establishment.siret,
        address.city,
        address.departmentCode,
        address.postcode,
        address.streetNumberAndAddress,
        position.lat,
        position.lon,
        convertPositionToStGeography(position),
      ],
    );

    const insertLocationsQuery = fixStGeographyEscapingInQuery(
      format(
        `INSERT INTO establishments_locations (
        id, establishment_siret, city, department_code, post_code, street_number_and_address, lat, lon, position
      ) VALUES %L`,
        locationFields,
      ),
    );

    await executeKyselyRawSqlQuery(this.transaction, insertLocationsQuery);
  }
}

const makeOrderByStatement = (sortedBy?: SearchSortedBy): string => {
  switch (sortedBy) {
    case "distance":
      return "ORDER BY distance_m ASC, RANDOM()";
    case "date":
      return "ORDER BY max_created_at DESC, RANDOM()";
    case "score":
      return "ORDER BY max_score DESC, RANDOM()";
    default: // undefined
      return "ORDER BY RANDOM()";
  }
};
const makeSelectImmersionSearchResultDtoQueryGivenSelectedOffersSubQuery = (
  selectedOffersSubQuery: string, // Query should return a view with required columns siret, rome_code, rome_label, appellations and distance_m
) => `
WITH 
  unique_establishments_contacts AS ( 
    SELECT DISTINCT ON (siret) siret, uuid 
    FROM establishments_contacts
  ), 
  match_immersion_offer AS (
    ${selectedOffersSubQuery}
  ),
  ${withEstablishmentAggregateSubQuery}
  SELECT 
  row_number,
  JSON_STRIP_NULLS(
      JSON_BUILD_OBJECT(
        'rome', io.rome_code,
        'siret', io.siret,
        'distance_m', io.distance_m,
        'isSearchable',io.is_searchable,
        'nextAvailabilityDate', io.next_availability_date,
        'name', io.name,
        'website', io.website,
        'additionalInformation', io.additional_information,
        'customizedName', io.customized_name,
        'fitForDisabledWorkers', io.fit_for_disabled_workers,
        'romeLabel', io.rome_label,
        'appellations',  io.appellations,
        'naf', io.naf_code,
        'nafLabel', public_naf_classes_2008.class_label,
        'address', JSON_BUILD_OBJECT(
          'streetNumberAndAddress', io.street_number_and_address,
          'postcode', io.post_code,
          'city', io.city,
          'departmentCode', io.department_code
          ),
        'position', JSON_BUILD_OBJECT('lon', io.lon, 'lat', io.lat),
        'locationId', io.location_id,
        'contactMode', ec.contact_mode,
        'numberOfEmployeeRange', io.number_employees
      )
    ) AS search_immersion_result
FROM match_immersion_offer AS io   
LEFT JOIN public_naf_classes_2008 ON (public_naf_classes_2008.class_id = REGEXP_REPLACE(io.naf_code,'(\\d\\d)(\\d\\d).', '\\1.\\2'))
LEFT JOIN unique_establishments_contacts AS uec ON uec.siret = io.siret
LEFT JOIN establishments_contacts AS ec ON ec.uuid = uec.uuid
ORDER BY row_number ASC, io.location_id ASC; `;

const offersEqual = (a: OfferEntity, b: OfferEntity) =>
  // Only compare romeCode and appellationCode
  a.appellationCode === b.appellationCode;

const objectsDeepEqual = <T>(a: T, b: T) =>
  equals(JSON.parse(JSON.stringify(a)), JSON.parse(JSON.stringify(b))); // replacing with clone() would does not work here

const establishmentsEqual = (
  a: EstablishmentEntity,
  b: EstablishmentEntity,
) => {
  // Ignore key updatedAt
  const { updatedAt: _unusedUpdatedAtA, ...establishmentAWithoutUpdatedAt } = a;
  const { updatedAt: _unusedUpdatedAtB, ...establishmentBWithoutUpdatedAt } = b;

  return objectsDeepEqual(
    establishmentAWithoutUpdatedAt,
    establishmentBWithoutUpdatedAt,
  );
};
const contactsEqual = (a: ContactEntity, b: ContactEntity) => {
  // Ignore key id
  const { id: _unusedIdA, ...contactAWithoutId } = a;
  const { id: _unusedIdB, ...contactBWithoutId } = b;
  return objectsDeepEqual(contactAWithoutId, contactBWithoutId);
};

const buildAppellationsArray = `(JSON_AGG(JSON_BUILD_OBJECT(
              'appellationCode', ogr_appellation::text,
              'appellationLabel', libelle_appellation_long,
              'score', io.score
            ) ORDER BY ogr_appellation)) AS appellations`;

const reStGeographyFromText =
  /'ST_GeographyFromText\(''POINT\((-?\d+(\.\d+)?)\s(-?\d+(\.\d+)?)\)''\)'/g;

// Remove any repeated single quotes ('') inside ST_GeographyFromText.
// TODO : find a better way than that : This is due to the Literal formatting that turns all simple quote into double quote.
const fixStGeographyEscapingInQuery = (query: string) =>
  query.replace(reStGeographyFromText, "ST_GeographyFromText('POINT($1 $3)')");

const withEstablishmentAggregateSubQuery = `
establishment_locations_agg AS (
  SELECT
    establishment_siret,
    JSON_AGG(
      JSON_BUILD_OBJECT(
        'id', id,
        'position', JSON_BUILD_OBJECT('lon', lon, 'lat', lat),
        'address', JSON_BUILD_OBJECT(
            'streetNumberAndAddress', street_number_and_address,
            'postcode', post_code,
            'city', city,
            'departmentCode', department_code
        )
      )
    ) AS locations
  FROM establishments_locations
  GROUP BY establishment_siret 
)`;
