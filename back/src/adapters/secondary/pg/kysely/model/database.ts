import { ColumnType, Generated } from "kysely";
import { AbsoluteUrl } from "shared";

export interface Database {
  discussions: Discussions;
  exchanges: Exchanges;
  groups: Groups;
  groups__sirets: GroupsSirets;
  agencies: Agencies;
  saved_errors: SavedErrors;
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

export interface Discussions {
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
  subject: Generated<string>;
  id: Generated<number>;
}

export interface Groups {
  slug: string;
  created_at: Generated<Timestamp>;
  updated_at: Generated<Timestamp>;
  name: string;
  hero_header_title: string;
  hero_header_description: string;
  hero_header_logo_url: AbsoluteUrl | null;
  hero_header_background_color: string | null;
  tint_color: string | null;
}

export interface GroupsSirets {
  group_slug: string;
  siret: string;
}

export interface Agencies {
  id: string;
  name: string;
  counsellor_emails: Json;
  validator_emails: Json;
  admin_emails: Json;
  questionnaire_url: string;
  email_signature: string;
  legacy_address: string | null;
  position: Generated<string>;
  created_at: Generated<Timestamp>;
  updated_at: Generated<Timestamp>;
  status: Generated<string>;
  kind: string;
  agency_siret: string | null;
  code_safir: string | null;
  logo_url: string | null;
  street_number_and_address: string;
  post_code: string;
  city: string;
  department_code: string;
  refers_to_agency_id: string | null;
}

export interface SavedErrors {
  id: Generated<number>;
  service_name: string;
  message: string;
  params: Json | null;
  occurred_at: Timestamp;
  handled_by_agency: Generated<boolean>;
}
