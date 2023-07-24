import { ColumnType, CompiledQuery, Kysely } from "kysely";
import { QueryResultRow } from "pg";

export interface ImmersionDatabase {
  discussions: DiscussionsTable;
  exchanges: Exchanges;
}

export type JsonArray = JsonValue[];

export type JsonObject = {
  [K in string]?: JsonValue;
};

export type JsonPrimitive = boolean | null | number | string;
export type JsonValue = JsonArray | JsonObject | JsonPrimitive;
export type Json = ColumnType<JsonValue, string, string>;
export type Timestamp = ColumnType<Date, Date | string, Date | string>;

export type ImmersionObjectives =
  | "Confirmer un projet professionnel"
  | "Découvrir un métier ou un secteur d'activité"
  | "Initier une démarche de recrutement";

export interface DiscussionsTable {
  id: string;
  siret: string;
  contact_method: string;
  potential_beneficiary_first_name: string;
  potential_beneficiary_last_name: string;
  potential_beneficiary_email: string;
  created_at: Timestamp;
  potential_beneficiary_phone: string | null;
  immersion_objective: ImmersionObjectives | null;
  potential_beneficiary_resume_link: string | null;
  appellation_code: number;
  establishment_contact_email: string;
  establishment_contact_first_name: string;
  establishment_contact_last_name: string;
  establishment_contact_phone: string;
  establishment_contact_job: string;
  establishment_contact_copy_emails: Json;
  street_number_and_address: string;
  postcode: string;
  department_code: string;
  city: string;
  business_name: string;
}

type ExchangeRole = "establishment" | "potentialBeneficiary";
interface Exchanges {
  discussion_id: string;
  message: string;
  sender: ExchangeRole;
  recipient: ExchangeRole;
  sent_at: Timestamp;
  subject: string;
}

export const executeKyselyRawSqlQuery = <T extends QueryResultRow>(
  transaction: Kysely<ImmersionDatabase>,
  sqlQuery: string,
  values?: any[],
) => transaction.executeQuery<T>(CompiledQuery.raw(sqlQuery, values));
