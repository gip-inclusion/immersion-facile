import { PoolClient } from "pg";
import {
  AddressDto,
  FormEstablishmentSource,
  GeoPositionDto,
  NumberEmployeesRange,
} from "shared";
import { KyselyDb } from "../../../config/pg/kysely/kyselyUtils";
import { ContactEntity } from "../entities/ContactEntity";
import {
  ContactEntityBuilder,
  EstablishmentAggregateBuilder,
  EstablishmentEntityBuilder,
  OfferEntityBuilder,
  defaultLocation,
} from "../helpers/EstablishmentBuilders";
import { EstablishmentAggregateRepository } from "../ports/EstablishmentAggregateRepository";

export const getAllImmersionOfferRows = async (kyselyDb: KyselyDb) =>
  kyselyDb
    .selectFrom("immersion_offers")
    .selectAll()
    .execute()
    .then((rows) =>
      rows.map((row) => ({
        rome_code: row.rome_code,
        appellation_code: row.appellation_code,
        siret: row.siret,
        score: row.score,
      })),
    );

export const insertImmersionOffer = async (
  client: PoolClient,
  props: {
    romeCode: string;
    siret: string;
    appellationCode: string;
    offerCreatedAt?: Date;
  },
): Promise<void> => {
  const insertQuery = `INSERT INTO immersion_offers (
      rome_code, siret, score, appellation_code, created_at
      ) VALUES
       ($1, $2, $3, $4, $5)`;
  const defaultScore = 4;
  const defaultOfferCreatedAt = new Date("2022-01-08");

  await client.query(insertQuery, [
    props.romeCode,
    props.siret,
    defaultScore,
    props.appellationCode ?? null,
    props.offerCreatedAt ?? defaultOfferCreatedAt,
  ]);
};

export type PgEstablishmentRow = {
  siret: string;
  name: string | null;
  customized_name?: string | null;
  number_employees: string | null;
  naf_code: string;
  naf_nomenclature: string;
  update_date?: Date;
  is_open: boolean;
  is_commited?: boolean | null;
  fit_for_disabled_workers: boolean | null;
  max_contacts_per_week: number;
  last_insee_check_date?: Date;
};

export const getAllEstablishmentsRows = async (kyselyDb: KyselyDb) =>
  kyselyDb.selectFrom("establishments").selectAll().execute();

export const getEstablishmentsRowsBySiret = async (
  kyselyDb: KyselyDb,
  siret: string,
) =>
  kyselyDb
    .selectFrom("establishments")
    .selectAll()
    .where("siret", "=", siret)
    .executeTakeFirst();

export const getAllImmersionContactsRows = async (kyselyDb: KyselyDb) =>
  kyselyDb.selectFrom("establishments_contacts").selectAll().execute();

export type InsertEstablishmentAggregateProps = {
  siret: string;
  romeAndAppellationCodes?: { romeCode: string; appellationCode: string }[];
  establishmentPosition?: GeoPositionDto;
  contact?: ContactEntity;
  sourceProvider?: FormEstablishmentSource;
  createdAt?: Date;
  locationId?: string;
  isOpen?: boolean;
  isSearchable?: boolean;
  address?: AddressDto;
  nafCode?: string;
  numberEmployeesRange?: NumberEmployeesRange;
  offerCreatedAt?: Date;
  fitForDisabledWorkers?: boolean;
  searchableByStudents?: boolean;
  searchableByJobSeekers?: boolean;
};

export const insertEstablishmentAggregate = async (
  establishmentAggregateRepository: EstablishmentAggregateRepository,
  {
    searchableByStudents,
    searchableByJobSeekers,
    siret,
    establishmentPosition = defaultLocation.position,
    romeAndAppellationCodes = [
      {
        romeCode: "A1413",
        appellationCode: "140927", // "Cuviste"
      },
    ],
    contact,
    sourceProvider = "immersion-facile",
    isOpen = true,
    isSearchable = true,
    locationId,
    address,
    nafCode,
    numberEmployeesRange,
    createdAt = new Date(),
    offerCreatedAt,
    fitForDisabledWorkers,
  }: InsertEstablishmentAggregateProps,
  index = 0,
) => {
  const establishment = new EstablishmentEntityBuilder()
    .withSiret(siret)
    .withIsOpen(isOpen)
    .withLocations([
      {
        id: locationId ?? `11111111-1111-4444-1111-11111111000${index}`,
        address: address ?? defaultLocation.address,
        position: establishmentPosition,
      },
    ])
    .withSearchableBy({
      jobSeekers: searchableByJobSeekers ?? false,
      students: searchableByStudents ?? false,
    })
    .withCreatedAt(createdAt)
    .withNumberOfEmployeeRange(numberEmployeesRange ?? "6-9")
    .withNafDto({ code: nafCode ?? "8622B", nomenclature: "8622B" })
    .withSourceProvider(sourceProvider)
    .withFitForDisabledWorkers(fitForDisabledWorkers)
    .withIsSearchable(isSearchable)
    .build();

  const aggregate = new EstablishmentAggregateBuilder()
    .withEstablishment(establishment)
    .withContact(
      contact ??
        new ContactEntityBuilder()
          .withId(`22222222-2222-4444-2222-22222222000${index}`)
          .build(),
    )
    .withOffers(
      romeAndAppellationCodes.map(({ romeCode, appellationCode }) =>
        new OfferEntityBuilder()
          .withRomeCode(romeCode)
          .withAppellationCode(appellationCode)
          .withCreatedAt(offerCreatedAt ?? new Date())
          .build(),
      ),
    )
    .build();

  await establishmentAggregateRepository.insertEstablishmentAggregate(
    aggregate,
  );
};
