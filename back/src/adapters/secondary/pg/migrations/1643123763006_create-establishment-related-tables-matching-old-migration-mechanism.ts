import type { MigrationBuilder } from "node-pg-migrate";
import {
  contactMode,
  dataSource,
  establishments,
  immersion_contacts,
  immersion_offers,
} from "../staticData/0_table_names";

const timestamp = (pgm: MigrationBuilder) => ({
  type: "timestamp",
  notNull: true,
  default: pgm.func("now()"),
});

type WithForeighKeyProps = {
  table: string;
  fieldInTable: string;
  referencedTable: string;
  fieldInReferencedTable: string;
};
const makeAddForeighKey =
  (pgm: MigrationBuilder) =>
  ({
    table,
    fieldInTable,
    referencedTable,
    fieldInReferencedTable,
  }: WithForeighKeyProps) => {
    pgm.addConstraint(table, `fk_${fieldInTable}`, {
      foreignKeys: {
        columns: fieldInTable,
        references: `${referencedTable}(${fieldInReferencedTable})`,
      },
    });
  };

export const up = (pgm: MigrationBuilder) => {
  const addForeignKey = makeAddForeighKey(pgm);
  // prettier-ignore
  pgm.createType(dataSource, ["form", "api_sirene", "api_labonneboite", "api_laplateformedelinclusion"]);
  pgm.createType(contactMode, ["phone", "mail", "in_person"]);

  pgm.createTable(establishments, {
    siret: { type: "int8", primaryKey: true },
    name: { type: "text" },
    address: { type: "text" },
    number_employees: { type: "int4" },
    naf: { type: "char(5)" },
    contact_mode: { type: contactMode },
    data_source: { type: dataSource },
    gps: {
      type: "geography",
      notNull: true,
      default: pgm.func("st_geographyfromtext('POINT(0.00 0.00)'::text)"),
    },
    is_active: { type: "bool", notNull: true, default: true },
    creation_date: timestamp(pgm),
    update_date: { type: "timestamp" },
  });

  pgm.createTable(immersion_contacts, {
    uuid: { type: "uuid", primaryKey: true },
    name: { type: "varchar(255)" },
    firstname: { type: "varchar(255)" },
    email: { type: "varchar(255)" },
    role: { type: "varchar(255)" },
    siret_establishment: { type: "int8" },
    phone: { type: "varchar(255)" },
  });
  addForeignKey({
    table: immersion_contacts,
    fieldInTable: "siret_establishment",
    referencedTable: establishments,
    fieldInReferencedTable: "siret",
  });

  pgm.createTable(immersion_offers, {
    uuid: { type: "uuid", unique: true },
    rome: { type: "char(5)", primaryKey: true },
    naf_division: { type: "char(2)", primaryKey: true },
    siret: { type: "int8", primaryKey: true },
    naf: { type: "char(255)", notNull: true },
    name: { type: "varchar(255)", notNull: true },
    number_displays: { type: "int8", default: 0 },
    number_connections: { type: "int4", default: 0 },
    number_immersions: { type: "int4", default: 0 },
    voluntary_to_immersion: { type: "bool", default: false },
    data_source: { type: dataSource },
    contact_in_establishment_uuid: { type: "uuid" },
    creation_date: timestamp(pgm),
    update_date: timestamp(pgm),
    score: { type: "float", default: 0 },
    gps: {
      type: "geography",
      default: pgm.func("st_geographyfromtext('POINT(0.00 0.00)'::text)"),
    },
  });
  addForeignKey({
    table: immersion_offers,
    fieldInTable: "contact_in_establishment_uuid",
    referencedTable: immersion_contacts,
    fieldInReferencedTable: "uuid",
  });
  addForeignKey({
    table: immersion_offers,
    fieldInTable: "siret",
    referencedTable: establishments,
    fieldInReferencedTable: "siret",
  });
};

export const down = (pgm: MigrationBuilder) => {
  pgm.dropTable(immersion_offers);
  pgm.dropTable(immersion_contacts);
  pgm.dropTable(establishments);
  pgm.dropType(contactMode);
  pgm.dropType(dataSource);
};
