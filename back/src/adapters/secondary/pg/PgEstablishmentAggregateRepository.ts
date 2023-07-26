import { PoolClient } from "pg";
import format from "pg-format";
import { equals, keys } from "ramda";
import {
  AppellationAndRomeDto,
  AppellationCode,
  GeoPositionDto,
  RomeCode,
  SearchImmersionResultDto,
  SearchSortedBy,
  SiretDto,
} from "shared";
import { ContactEntity } from "../../../domain/immersionOffer/entities/ContactEntity";
import {
  EstablishmentAggregate,
  EstablishmentEntity,
} from "../../../domain/immersionOffer/entities/EstablishmentEntity";
import { ImmersionOfferEntityV2 } from "../../../domain/immersionOffer/entities/ImmersionOfferEntity";
import { SearchMade } from "../../../domain/immersionOffer/entities/SearchMadeEntity";
import {
  EstablishmentAggregateRepository,
  OfferWithSiret,
  SearchImmersionResult,
  UpdateEstablishmentsWithInseeDataParams,
} from "../../../domain/immersionOffer/ports/EstablishmentAggregateRepository";
import { createLogger } from "../../../utils/logger";
import {
  BadRequestError,
  NotFoundError,
} from "../../primary/helpers/httpErrors";
import { optional } from "./pgUtils";

const logger = createLogger(__filename);

export class PgEstablishmentAggregateRepository
  implements EstablishmentAggregateRepository
{
  constructor(private client: PoolClient) {}

  public async insertEstablishmentAggregates(
    aggregates: EstablishmentAggregate[],
  ) {
    await this.upsertEstablishmentsFromAggregates(aggregates);
    await this.insertContactsFromAggregates(aggregates);
    await this.createImmersionOffersToEstablishments(
      aggregates.reduce<OfferWithSiret[]>(
        (offersWithSiret, aggregate) => [
          ...offersWithSiret,
          ...aggregate.immersionOffers.map((immersionOffer) => ({
            siret: aggregate.establishment.siret,
            ...immersionOffer,
          })),
        ],
        [],
      ),
    );
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
      await this.insertContactsFromAggregates([updatedAggregate]);
    } else {
      // Update contact if it has changed
      await this._updateContactFromAggregates(
        { ...existingAggregate, contact: existingAggregate.contact },
        updatedAggregate,
      );
    }
  }

  private async upsertEstablishmentsFromAggregates(
    aggregates: EstablishmentAggregate[],
  ) {
    const establishmentFields = aggregates.map(({ establishment }) => [
      establishment.siret,
      establishment.name,
      establishment.customizedName,
      establishment.website,
      establishment.additionalInformation,
      establishment.address.streetNumberAndAddress,
      establishment.address.postcode,
      establishment.address.city,
      establishment.address.departmentCode,
      establishment.numberEmployeesRange,
      establishment.nafDto.code,
      establishment.nafDto.nomenclature,
      establishment.sourceProvider,
      convertPositionToStGeography(establishment.position),
      establishment.position.lon,
      establishment.position.lat,
      establishment.updatedAt ? establishment.updatedAt.toISOString() : null,
      establishment.isOpen,
      establishment.isSearchable,
      establishment.isCommited,
      establishment.fitForDisabledWorkers,
      establishment.maxContactsPerWeek,
      establishment.lastInseeCheckDate
        ? establishment.lastInseeCheckDate.toISOString()
        : null,
    ]);

    if (establishmentFields.length === 0) return;

    try {
      const query = fixStGeographyEscapingInQuery(
        format(
          `INSERT INTO establishments (
          siret, name, customized_name, website, additional_information, street_number_and_address, post_code, city, department_code, number_employees, naf_code, naf_nomenclature, source_provider, gps, lon, lat, update_date, is_open, is_searchable, is_commited, fit_for_disabled_workers, max_contacts_per_week, last_insee_check_date 
        ) VALUES %L
        ON CONFLICT
          ON CONSTRAINT establishments_pkey
            DO UPDATE
              SET
                name=EXCLUDED.name,
                street_number_and_address=EXCLUDED.street_number_and_address,
                post_code=EXCLUDED.post_code,
                city=EXCLUDED.city,
                department_code=EXCLUDED.department_code,
                number_employees=EXCLUDED.number_employees,
                naf_code=EXCLUDED.naf_code,
                fit_for_disabled_workers=EXCLUDED.fit_for_disabled_workers,
                max_contacts_per_week=EXCLUDED.max_contacts_per_week
              `,
          establishmentFields,
        ),
      );

      await this.client.query(query);
    } catch (e: any) {
      logger.error(e, "Error inserting establishments");
      throw e;
    }
  }

  private async insertContactsFromAggregates(
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
      throw e;
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
      await this.client.query(queryToRemoveOffersFromRome);
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
      await this.client.query(queryToRemoveOffersFromAppellationCode);
    }
  }

  private async _updateContactFromAggregates(
    existingAggregate: EstablishmentAggregate & {
      contact: ContactEntity;
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

  async searchImmersionResults({
    searchMade,
    maxResults,
  }: {
    searchMade: SearchMade;
    maxResults?: number;
  }): Promise<SearchImmersionResult[]> {
    const romeCode = await this.getRomeCodeFromAppellationCode(
      searchMade.appellationCode,
    );
    const sortExpression = makeOrderByStatement(searchMade.sortedBy);
    const selectedOffersSubQuery = format(
      `WITH active_establishments_within_area AS 
        (SELECT siret, fit_for_disabled_workers, gps
         FROM establishments 
         WHERE is_open 
         AND ST_DWithin(gps, ST_GeographyFromText($1), $2)),
        matching_offers AS (
          SELECT 
            aewa.siret, rome_code, prd.libelle_rome AS rome_label, ST_Distance(gps, ST_GeographyFromText($1)) AS distance_m,
            ${buildAppellationsArray} AS appellations,
            MAX(created_at) AS max_created_at, 
            fit_for_disabled_workers
          FROM active_establishments_within_area aewa 
            LEFT JOIN immersion_offers io ON io.siret = aewa.siret 
            LEFT JOIN public_appellations_data pad ON io.appellation_code = pad.ogr_appellation
            LEFT JOIN public_romes_data prd ON io.rome_code = prd.code_rome
            ${romeCode ? "WHERE rome_code = %1$L" : ""}
            GROUP BY(aewa.siret, aewa.gps, aewa.fit_for_disabled_workers, io.rome_code, prd.libelle_rome)
          )
        SELECT *, (ROW_NUMBER () OVER (${sortExpression}))::integer as row_number from matching_offers ${sortExpression}
        LIMIT $3`,
      romeCode,
    ); // Formats optional litterals %1$L
    const immersionSearchResultDtos =
      await this.selectImmersionSearchResultDtoQueryGivenSelectedOffersSubQuery(
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
    try {
      logger.info(`About to delete establishment with siret : ${siret}`);
      const query = `DELETE FROM establishments WHERE siret = $1;`;
      await this.client.query(query, [siret]);
      logger.info(`Deleted establishment successfully. Siret was : ${siret}`);
    } catch (error: any) {
      logger.info(
        `Error when deleting establishment with siret ${siret} : ${error.message}`,
      );
      logger.info({ error }, "Full Error");
      throw error;
    }
  }

  public async updateEstablishment(
    propertiesToUpdate: Partial<EstablishmentEntity> & {
      updatedAt: Date;
      siret: SiretDto;
    },
  ): Promise<void> {
    const updateQuery = `
          UPDATE establishments
                   SET update_date = %1$L
                   ${
                     propertiesToUpdate.isOpen !== undefined
                       ? ", is_open=%2$L"
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
                       ? ", street_number_and_address=%6$L, post_code=%7$L, city=%8$L, department_code=%9$L, gps=ST_GeographyFromText(%10$L), lon=%11$L, lat=%12$L"
                       : ""
                   }
                   ${propertiesToUpdate.name ? ", name=%13$L" : ""}
                   ${
                     propertiesToUpdate.customizedName
                       ? ", customized_name=%14$L"
                       : ""
                   }
                   ${
                     propertiesToUpdate.isSearchable !== undefined
                       ? ", is_searchable=%15$L"
                       : ""
                   }
                   ${
                     propertiesToUpdate.isCommited !== undefined
                       ? ", is_commited=%16$L"
                       : ""
                   }
                   ${
                     propertiesToUpdate.website !== undefined
                       ? ", website=%17$L"
                       : ""
                   }
                  ${
                    propertiesToUpdate.additionalInformation !== undefined
                      ? ", additional_information=%18$L"
                      : ""
                  }
                  ${
                    propertiesToUpdate.fitForDisabledWorkers !== undefined
                      ? ", fit_for_disabled_workers=%19$L"
                      : ""
                  }
                  ${
                    propertiesToUpdate.maxContactsPerWeek !== undefined
                      ? ", max_contacts_per_week=%20$L"
                      : ""
                  }
                   WHERE siret=%21$L;`;
    const queryArgs = [
      propertiesToUpdate.updatedAt.toISOString(),
      propertiesToUpdate.isOpen,
      propertiesToUpdate.nafDto?.code,
      propertiesToUpdate.nafDto?.nomenclature,
      propertiesToUpdate.numberEmployeesRange,
      propertiesToUpdate.address?.streetNumberAndAddress,
      propertiesToUpdate.address?.postcode,
      propertiesToUpdate.address?.city,
      propertiesToUpdate.address?.departmentCode,
      propertiesToUpdate.position
        ? `POINT(${propertiesToUpdate.position.lon} ${propertiesToUpdate.position.lat})`
        : undefined,
      propertiesToUpdate.position?.lon,
      propertiesToUpdate.position?.lat,

      propertiesToUpdate.name,
      propertiesToUpdate.customizedName,
      propertiesToUpdate.isSearchable,
      propertiesToUpdate.isCommited,
      propertiesToUpdate.website,
      propertiesToUpdate.additionalInformation,
      propertiesToUpdate.fitForDisabledWorkers,
      propertiesToUpdate.maxContactsPerWeek,
      propertiesToUpdate.siret,
    ];
    const formatedQuery = format(updateQuery, ...queryArgs);
    await this.client.query(formatedQuery);
  }

  public async hasEstablishmentWithSiret(siret: string): Promise<boolean> {
    const pgResult = await this.client.query(
      `SELECT EXISTS (SELECT 1 FROM establishments WHERE siret = $1);`,
      [siret],
    );
    return pgResult.rows[0].exists;
  }

  public async getOffersAsAppellationDtoEstablishment(
    siret: string,
  ): Promise<AppellationAndRomeDto[]> {
    const pgResult = await this.client.query(
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

  public async getSearchImmersionResultDtoBySiretAndRome(
    siret: SiretDto,
    rome: RomeCode,
  ): Promise<SearchImmersionResultDto | undefined> {
    const immersionSearchResultDtos =
      await this.selectImmersionSearchResultDtoQueryGivenSelectedOffersSubQuery(
        `
        SELECT siret, io.rome_code, prd.libelle_rome as rome_label, ${buildAppellationsArray} AS appellations, null AS distance_m, 1 AS row_number
        FROM immersion_offers AS io
        LEFT JOIN public_appellations_data AS pad ON pad.ogr_appellation = io.appellation_code 
        LEFT JOIN public_romes_data AS prd ON prd.code_rome = io.rome_code 
        WHERE io.siret = $1 AND io.rome_code = $2
        GROUP BY (siret, io.rome_code, prd.libelle_rome)`,
        [siret, rome],
      );

    const result = immersionSearchResultDtos.at(0);
    if (!result) return;
    const {
      isSearchable,
      ...searchResultWithoutContactDetailsAndIsSearchable
    } = result;
    return searchResultWithoutContactDetailsAndIsSearchable;
  }

  public async getSearchImmersionResultDtoBySiretAndAppellationCode(
    siret: SiretDto,
    appellationCode: AppellationCode,
  ): Promise<SearchImmersionResultDto | undefined> {
    const immersionSearchResultDtos =
      await this.selectImmersionSearchResultDtoQueryGivenSelectedOffersSubQuery(
        `
        SELECT siret, io.rome_code, prd.libelle_rome as rome_label, ${buildAppellationsArray} AS appellations, null AS distance_m, 1 AS row_number
        FROM immersion_offers AS io
        LEFT JOIN public_appellations_data AS pad ON pad.ogr_appellation = io.appellation_code 
        LEFT JOIN public_romes_data AS prd ON prd.code_rome = io.rome_code 
        WHERE io.siret = $1 AND io.appellation_code = $2
        GROUP BY (siret, io.rome_code, prd.libelle_rome)`,
        [siret, appellationCode],
      );
    const immersionSearchResultDto = immersionSearchResultDtos.at(0);
    if (!immersionSearchResultDto) return;
    const { isSearchable, ...rest } = immersionSearchResultDto;
    return rest;
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
          rome_code, appellation_code, siret, score, created_at
        ) VALUES %L`,
      immersionOfferFields,
    );
    await this.client.query(query);
  }

  private async selectImmersionSearchResultDtoQueryGivenSelectedOffersSubQuery(
    selectedOffersSubQuery: string,
    selectedOffersSubQueryParams: any[],
  ): Promise<SearchImmersionResult[]> {
    // Given a subquery and its parameters to select immersion offers (with columns siret, rome_code, rome_label, appellations and distance_m),
    // this method returns a list of SearchImmersionResultDto
    const pgResult = await this.client.query(
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
      }),
    );
  }

  async getEstablishmentAggregateBySiret(
    siret: SiretDto,
  ): Promise<EstablishmentAggregate | undefined> {
    const aggregateWithStringDates = (
      await this.client.query(
        `WITH unique_establishments__immersion_contacts AS (
          SELECT 
            DISTINCT ON (establishment_siret) establishment_siret, 
            contact_uuid 
          FROM 
            establishments__immersion_contacts
        ), 
        filtered_immersion_offers AS (
          SELECT 
            siret, 
            JSON_AGG(
              JSON_BUILD_OBJECT(
                'romeCode', rome_code, 
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
          WHERE 
            siret = $1 
          GROUP BY 
            siret
        ) 
        SELECT 
          JSON_STRIP_NULLS(
            JSON_BUILD_OBJECT(
              'establishment', JSON_BUILD_OBJECT(
                'siret', e.siret, 
                'name', e.name, 
                'customizedName', e.customized_name, 
                'website', e.website, 
                'additionalInformation', e.additional_information, 
                'address', JSON_BUILD_OBJECT(
                  'streetNumberAndAddress', e.street_number_and_address, 
                  'postcode', e.post_code,
                  'city', e.city,
                  'departmentCode', e.department_code
                ),  
                'sourceProvider', e.source_provider, 
                'position', JSON_BUILD_OBJECT('lon', e.lon, 'lat', e.lat), 
                'nafDto', JSON_BUILD_OBJECT(
                  'code', e.naf_code, 
                  'nomenclature', e.naf_nomenclature
                ), 
                'numberEmployeesRange', e.number_employees, 
                'updatedAt', to_char(
                  e.update_date::timestamp, 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'
                ), 
                'lastInseeCheckDate', to_char(
                  e.last_insee_check_date::timestamp, 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'
                ), 
                'isOpen', e.is_open, 
                'isSearchable', e.is_searchable, 
                'isCommited', e.is_commited,
                'fitForDisabledWorkers', e.fit_for_disabled_workers,
                'maxContactsPerWeek', e.max_contacts_per_week
              ), 
              'immersionOffers', io.immersionOffers, 
              'contact', JSON_BUILD_OBJECT(
                'id', ic.uuid, 'firstName', ic.firstname, 
                'lastName', ic.lastname, 'job', ic.job, 
                'contactMethod', ic.contact_mode, 
                'phone', ic.phone, 'email', ic.email, 
                'copyEmails', ic.copy_emails
              )
            )
          ) AS aggregate 
        FROM 
          filtered_immersion_offers AS io 
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
          lastInseeCheckDate: aggregateWithStringDates.establishment
            .lastInseeCheckDate
            ? new Date(
                aggregateWithStringDates.establishment.lastInseeCheckDate,
              )
            : undefined,
          voluntaryToImmersion: true,
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

  async markEstablishmentAsSearchableWhenRecentDiscussionAreUnderMaxContactPerWeek(
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

    const result = await this.client.query(
      `
        UPDATE establishments
        SET is_searchable = true 
        WHERE is_searchable = false
          AND max_contacts_per_week > 0
          AND siret NOT IN (${querySiretsOfEstablishmentsWhichHaveReachedMaxContactPerWeek})
        `,
      [since],
    );

    return result.rowCount;
  }

  public async getSiretOfEstablishmentsToSuggestUpdate(
    before: Date,
  ): Promise<SiretDto[]> {
    const response = await this.client.query(
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

    const result = await this.client.query(
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

    await this.client.query(queries.join("\n"));
  }

  private async getRomeCodeFromAppellationCode(
    appellationCode: AppellationCode | undefined,
  ): Promise<RomeCode | undefined> {
    if (!appellationCode) return;

    const result = await this.client.query(
      `SELECT code_rome
        from public_appellations_data
        where ogr_appellation = $1`,
      [appellationCode],
    );

    const romeCode: RomeCode | undefined = result.rows[0]?.code_rome;
    if (!romeCode)
      throw new Error(
        `No Rome code found for appellation code ${appellationCode}`,
      );

    return romeCode;
  }
}

const convertPositionToStGeography = ({ lat, lon }: GeoPositionDto) =>
  `ST_GeographyFromText('POINT(${lon} ${lat})')`;

const reStGeographyFromText =
  /'ST_GeographyFromText\(''POINT\((-?\d+(\.\d+)?)\s(-?\d+(\.\d+)?)\)''\)'/g;

// Remove any repeated single quotes ('') inside ST_GeographyFromText.
// TODO : find a better way than that : This is due to the Literal formatting that turns all simple quote into double quote.
const fixStGeographyEscapingInQuery = (query: string) =>
  query.replace(reStGeographyFromText, "ST_GeographyFromText('POINT($1 $3)')");

const makeOrderByStatement = (sortedBy?: SearchSortedBy): string => {
  switch (sortedBy) {
    case "distance":
      return "ORDER BY distance_m ASC, RANDOM()";
    case "date":
      return "ORDER BY max_created_at DESC, RANDOM()";
    default: // undefined
      return "ORDER BY RANDOM()";
  }
};
const makeSelectImmersionSearchResultDtoQueryGivenSelectedOffersSubQuery = (
  selectedOffersSubQuery: string, // Query should return a view with required columns siret, rome_code, rome_label, appellations and distance_m
) => `
      WITH unique_establishments__immersion_contacts AS ( SELECT DISTINCT ON (establishment_siret) establishment_siret, contact_uuid FROM establishments__immersion_contacts ), 
           match_immersion_offer AS (${selectedOffersSubQuery})
      SELECT 
      row_number,
      JSONB_BUILD_OBJECT(
        'rome', io.rome_code, 
        'siret', io.siret, 
        'distance_m', io.distance_m, 
        'isSearchable',e.is_searchable,
        'name', e.name, 
        'website', e.website, 
        'additionalInformation', e.additional_information, 
        'customizedName', e.customized_name, 
        'fitForDisabledWorkers', e.fit_for_disabled_workers,
        'position', JSON_BUILD_OBJECT('lon', e.lon, 'lat', e.lat), 
        'romeLabel', io.rome_label,
        'appellations',  io.appellations,
        'naf', e.naf_code,
        'nafLabel', public_naf_classes_2008.class_label,
        'address', JSON_BUILD_OBJECT('streetNumberAndAddress', e.street_number_and_address, 
                                      'postcode', e.post_code,
                                      'city', e.city,
                                      'departmentCode', e.department_code),
        'contactMode', ic.contact_mode,
        'numberOfEmployeeRange', e.number_employees 
      ) AS search_immersion_result
      FROM match_immersion_offer AS io 
      LEFT JOIN establishments AS e ON e.siret = io.siret  
      LEFT JOIN public_naf_classes_2008 ON (public_naf_classes_2008.class_id = REGEXP_REPLACE(naf_code,'(\\d\\d)(\\d\\d).', '\\1.\\2'))
      LEFT JOIN unique_establishments__immersion_contacts AS eic ON eic.establishment_siret = e.siret
      LEFT JOIN immersion_contacts AS ic ON ic.uuid = eic.contact_uuid
      ORDER BY row_number ASC; `;

const offersEqual = (a: ImmersionOfferEntityV2, b: ImmersionOfferEntityV2) =>
  // Only compare romeCode and appellationCode
  a.appellationCode == b.appellationCode;

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

const buildAppellationsArray = `JSON_AGG(
  JSON_BUILD_OBJECT(
    'appellationCode', ogr_appellation::text,
    'appellationLabel', libelle_appellation_long
  )
  ORDER BY ogr_appellation
)`;
