import { PoolClient } from "pg";
import {
  AddressDto,
  ContactMethod,
  defaultMaxContactsPerWeek,
  FormEstablishmentSource,
  GeoPositionDto,
  NumberEmployeesRange,
} from "shared";
import { rueGuillaumeTellDto } from "../../../_testBuilders/addressDtos";
import { EstablishmentAggregate } from "../../../domain/immersionOffer/entities/EstablishmentEntity";

type PgImmersionOfferRow = {
  rome_code: string;
  rome_nomenclature: number | undefined;
  //created_at: Date;
  //update_date: Date;
  appellation_code: number;
  siret: string;
  score: number;
};

export const getAllImmersionOfferRows = async (
  client: PoolClient,
): Promise<PgImmersionOfferRow[]> =>
  client.query("SELECT * FROM immersion_offers").then(({ rows }) =>
    rows.map((row) => ({
      rome_code: row.rome_code,
      rome_nomenclature: row.rome_nomenclature,
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

export const insertImmersionContact = async (
  client: PoolClient,
  props: {
    uuid: string;
    lastName?: string;
    email?: string;
    siret_establishment: string;
  },
): Promise<void> => {
  await client.query(
    `
  INSERT INTO immersion_contacts (
  uuid, lastname, firstname, job, email, phone, contact_mode
) VALUES
 ($1, $2, '', '', $3, '', 'EMAIL');`,
    [
      props.uuid,
      props.lastName ?? "Jacques",
      props.email ?? "jacques@gmail.com",
    ],
  );

  await client.query(
    `INSERT INTO establishments__immersion_contacts (establishment_siret, contact_uuid) VALUES ($1, $2)`,
    [props.siret_establishment, props.uuid],
  );
};

export const insertEstablishment = async (
  client: PoolClient,
  props: {
    siret: string;
    updatedAt?: Date;
    isActive?: boolean;
    isSearchable?: boolean;
    nafCode?: string;
    numberEmployeesRange?: NumberEmployeesRange;
    address?: AddressDto;
    sourceProvider?: FormEstablishmentSource;
    position?: GeoPositionDto;
    fitForDisabledWorkers?: boolean;
    maxContactsPerWeek?: number;
  },
) => {
  const defaultPosition = { lon: 12.2, lat: 2.1 };
  const position = props.position ?? defaultPosition;
  const insertQuery = `
  INSERT INTO establishments (
    siret, name, street_number_and_address, post_code, city, department_code, number_employees, naf_code, source_provider, update_date, is_active, is_searchable, fit_for_disabled_workers, gps, lon, lat, max_contacts_per_week
  ) VALUES ($1, '', $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, ST_GeographyFromText('POINT(${position.lon} ${position.lat})'), $13, $14, $15)`;
  const addressDto = props.address ?? rueGuillaumeTellDto;
  await client.query(insertQuery, [
    props.siret,
    addressDto.streetNumberAndAddress,
    addressDto.postcode,
    addressDto.city,
    addressDto.departmentCode,
    props.numberEmployeesRange ?? null,
    props.nafCode ?? "8622B",
    props.sourceProvider ?? "api_labonneboite",
    props.updatedAt ? `'${props.updatedAt.toISOString()}'` : null,
    props.isActive ?? true,
    props.isSearchable ?? true,
    props.fitForDisabledWorkers,
    position.lon,
    position.lat,
    props.maxContactsPerWeek ?? defaultMaxContactsPerWeek,
  ]);
};

export const expectAggregateEqual = (
  actual: EstablishmentAggregate,
  expected: EstablishmentAggregate,
) => {
  expect(JSON.parse(JSON.stringify(actual))).toEqual(
    JSON.parse(JSON.stringify(expected)),
  ); // parse and stringify to avoid comparing no key vs. undefined key (Does not work with clone() from ramda)
};

export type PgEstablishmentRow = {
  siret: string;
  name: string;
  customized_name?: string | null;
  street_number_and_address: string;
  post_code: string;
  department_code: string;
  city: string;
  number_employees: string;
  naf_code: string;
  naf_nomenclature: string;
  gps: string;
  update_date?: Date;
  is_active: boolean;
  is_commited?: boolean | null;
  fit_for_disabled_workers: boolean | null;
  max_contacts_per_week: number;
  last_insee_check_date?: Date;
};

export const getAllEstablishmentsRows = async (
  client: PoolClient,
): Promise<PgEstablishmentRow[]> =>
  client.query("SELECT * FROM establishments").then((res) => res.rows);

export const getEstablishmentsRowsBySiret = async (
  client: PoolClient,
  siret: string,
): Promise<PgEstablishmentRow | undefined> =>
  client
    .query("SELECT * FROM establishments WHERE siret=$1", [siret])
    .then((res) => res.rows[0]);

export type PgImmersionContactWithSiretRow = {
  uuid: string;
  lastname: string;
  firstname: string;
  job: string;
  email: string;
  phone: string;
  establishment_siret: string;
  contact_mode: ContactMethod;
  copy_emails: string[];
};

export const getAllImmersionContactsRows = async (
  client: PoolClient,
): Promise<PgImmersionContactWithSiretRow[]> =>
  client
    .query(
      `SELECT * FROM immersion_contacts AS ic JOIN establishments__immersion_contacts AS eic
       ON ic.uuid = eic.contact_uuid WHERE contact_uuid IS NOT NULL`,
    )
    .then((res) => res.rows);

export type PgEstablishmentRowWithGeo = PgEstablishmentRow & {
  longitude: number;
  latitude: number;
};

export const retrieveEstablishmentWithSiret = async (
  client: PoolClient,
  siret: string,
): Promise<PgEstablishmentRowWithGeo | undefined> => {
  const pgResult = await client.query(
    `SELECT *, ST_X(gps::geometry) AS longitude, ST_Y(gps::geometry) AS latitude 
     FROM establishments WHERE siret='${siret}' LIMIT 1;`,
  );
  return pgResult.rows[0] ?? (pgResult.rows[0] as PgEstablishmentRowWithGeo);
};

export const insertActiveEstablishmentAndOfferAndEventuallyContact = async (
  client: PoolClient,
  {
    siret,
    rome,
    establishmentPosition,
    appellationCode,
    offerContactUid,
    sourceProvider = "immersion-facile",
    address,
    nafCode,
    numberEmployeesRange,
    offerCreatedAt,
    fitForDisabledWorkers,
  }: {
    siret: string;
    rome: string;
    establishmentPosition: GeoPositionDto;
    appellationCode: string;
    offerContactUid?: string;
    sourceProvider?: FormEstablishmentSource;
    address?: AddressDto;
    nafCode?: string;
    numberEmployeesRange?: NumberEmployeesRange;
    offerCreatedAt?: Date;
    fitForDisabledWorkers?: boolean;
  },
) => {
  await insertEstablishment(client, {
    siret,
    isActive: true,
    position: establishmentPosition,
    sourceProvider,
    address,
    nafCode,
    numberEmployeesRange,
    fitForDisabledWorkers,
  });
  if (offerContactUid) {
    await insertImmersionContact(client, {
      uuid: offerContactUid,
      siret_establishment: siret,
    });
  }
  await insertImmersionOffer(client, {
    siret,
    romeCode: rome,
    appellationCode,
    offerCreatedAt,
  });
};
