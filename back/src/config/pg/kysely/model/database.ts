import { ColumnType, Generated } from "kysely";
import { AbsoluteUrl, ConventionId } from "shared";

export interface Database {
  actors: Actors;
  agencies: Agencies;
  agency_groups: AgencyGroups;
  agency_groups__agencies: AgencyGroupsAgencies;
  api_consumers: ApiConsumers;
  api_consumers_subscriptions: ApiConsumersSubscriptions;
  authenticated_users: AuthenticatedUsers;
  convention_external_ids: ConventionExternalIds;
  conventions: Conventions;
  discussions: Discussions;
  establishment_lead_events: EstablishmentLeadEvents;
  establishments: Establishments;
  establishments__immersion_contacts: EstablishmentsImmersionContacts;
  establishments_locations: EstablishmentsLocations;
  exchanges: Exchanges;
  form_establishments: PgFormEstablishments;
  groups: Groups;
  groups__sirets: GroupsSirets;
  immersion_contacts: ImmersionContacts;
  immersion_offers: ImmersionOffers;
  nps: Nps;
  ongoing_oauths: OngoingOauths;
  outbox: Outbox;
  partners_pe_connect: PartnersPeConnect;
  saved_errors: SavedErrors;
  view_appellations_dto: ViewAppellationsDto;
}

type JsonArray = JsonValue[];

type JsonObject = {
  [K in string]?: JsonValue;
};

type JsonPrimitive = boolean | null | number | string;
type JsonValue = JsonArray | JsonObject | JsonPrimitive;
type Json = ColumnType<JsonValue, string, string>;
type Timestamp = ColumnType<Date, Date | string, Date | string>;

type ImmersionObjectives =
  | "Confirmer un projet professionnel"
  | "Découvrir un métier ou un secteur d'activité"
  | "Initier une démarche de recrutement";

type InternshipKind = "immersion" | "mini-stage-cci";

interface Discussions {
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

interface Groups {
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

interface GroupsSirets {
  group_slug: string;
  siret: string;
}

interface Agencies {
  id: string;
  name: string;
  counsellor_emails: Json;
  validator_emails: Json;
  admin_emails: Json;
  questionnaire_url: string | null;
  email_signature: string;
  legacy_address: string | null;
  position: Generated<string>;
  created_at: Generated<Timestamp>;
  updated_at: Generated<Timestamp>;
  status: Generated<string>;
  kind: string;
  agency_siret: string;
  code_safir: string | null;
  logo_url: string | null;
  street_number_and_address: string;
  post_code: string;
  city: string;
  department_code: string;
  covered_departments: Json;
  refers_to_agency_id: string | null;
  rejection_justification: string | null;
}

interface SavedErrors {
  id: Generated<number>;
  consumer_id: string | null;
  consumer_name: string;
  service_name: string;
  message: string;
  params: Record<string, unknown> | null;
  occurred_at: Timestamp;
  handled_by_agency: Generated<boolean>;
}

// prettier-ignore
type ConventionObjectiveType =
  | "Confirmer un projet professionnel"
  | "Découvrir un métier ou un secteur d'activité"
  | "Initier une démarche de recrutement";

// prettier-ignore
type ConventionStatusType =
  | "ACCEPTED_BY_COUNSELLOR"
  | "ACCEPTED_BY_VALIDATOR"
  | "CANCELLED"
  | "DEPRECATED"
  | "DRAFT"
  | "IN_REVIEW"
  | "PARTIALLY_SIGNED"
  | "READY_TO_SIGN"
  | "REJECTED";

interface ConventionExternalIds {
  convention_id: string | null;
  external_id: Generated<number>;
}

interface Conventions {
  id: ConventionId;
  created_at: Generated<Timestamp>;
  updated_at: Generated<Timestamp>;
  status: ConventionStatusType;
  agency_id: string;
  date_submission: Timestamp;
  date_start: Timestamp;
  date_end: Timestamp;
  siret: string;
  business_name: string;
  schedule: Json;
  individual_protection: boolean;
  sanitary_prevention: boolean;
  sanitary_prevention_description: string;
  immersion_address: string;
  immersion_objective: ConventionObjectiveType;
  immersion_activities: string;
  immersion_skills: string;
  work_conditions: string | null;
  immersion_appellation: number;
  date_validation: Timestamp | null;
  internship_kind: InternshipKind;
  beneficiary_id: number;
  establishment_tutor_id: number;
  establishment_representative_id: number;
  beneficiary_representative_id: number | null;
  beneficiary_current_employer_id: number | null;
  business_advantages: string | null;
  status_justification: string | null;
  validators: Json | null;
  renewed_from: string | null;
  renewed_justification: string | null;
  date_approval: Timestamp | null;
}

interface Actors {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  signed_at: Timestamp | null;
  extra_fields: Json | null;
  id: Generated<number>;
}

interface PartnersPeConnect {
  user_pe_external_id: string;
  convention_id: Generated<string>;
  firstname: string | null;
  lastname: string | null;
  email: string | null;
  type: string | null;
}

interface ViewAppellationsDto {
  appellation_code: number | null;
  appellation_label: string | null;
  rome_code: string | null;
  rome_label: string | null;
}

interface PgFormEstablishments {
  additional_information: Generated<string | null>;
  business_addresses: Json;
  business_contact: Generated<Json>;
  business_name_customized: string | null;
  business_name: string;
  created_at: Generated<Timestamp | null>;
  fit_for_disabled_workers: Generated<boolean | null>;
  is_engaged_enterprise: boolean | null;
  max_contacts_per_week: number;
  naf: Json | null;
  professions: Json;
  siret: string;
  source: Generated<string>;
  updated_at: Generated<Timestamp | null>;
  website: Generated<string | null>;
  next_availability_date: Timestamp | null;
  searchable_by_students: boolean;
  searchable_by_job_seekers: boolean;
}

type EstablishmentLeadEventsKind =
  | "registration-accepted"
  | "registration-refused"
  | "reminder-sent"
  | "to-be-reminded";

type NotificationKind = "email" | "sms";

interface EstablishmentLeadEvents {
  siret: string;
  kind: EstablishmentLeadEventsKind;
  occurred_at: Timestamp;
  convention_id: string | null;
  notification_id: string | null;
  notification_kind: NotificationKind | null;
}

interface ApiConsumers {
  id: string;
  name: string;
  description: string | null;
  created_at: Timestamp;
  expiration_date: Timestamp;
  contact_emails: string[];
  contact_first_name: string;
  contact_last_name: string;
  contact_job: string;
  contact_phone: string;
  rights: Generated<Json>;
}

interface ApiConsumersSubscriptions {
  id: string;
  created_at: Generated<Timestamp>;
  right_name: string;
  callback_url: string;
  callback_headers: Json;
  consumer_id: string;
  subscribed_event: string;
}

interface AuthenticatedUsers {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  created_at: Generated<Timestamp>;
  updated_at: Generated<Timestamp>;
  external_id: string;
}

interface OngoingOauths {
  state: string;
  nonce: string;
  provider: string;
  user_id: string | null;
  external_id: string | null;
  access_token: string | null;
  created_at: Generated<Timestamp>;
  updated_at: Generated<Timestamp>;
}
export interface Establishments {
  siret: string;
  name: string | null;
  legacy_address: string | null;
  number_employees: string | null;
  naf_code: string | null;
  is_open: Generated<boolean>;
  created_at: Timestamp;
  update_date: Timestamp | null;
  customized_name: string | null;
  is_commited: boolean | null;
  naf_nomenclature: string | null;
  source_provider: string;
  is_searchable: Generated<boolean>;
  website: Generated<string | null>;
  additional_information: Generated<string>;
  fit_for_disabled_workers: Generated<boolean | null>;
  max_contacts_per_week: number;
  last_insee_check_date: Timestamp | null;
  next_availability_date: Timestamp | null;
  searchable_by_students: boolean;
  searchable_by_job_seekers: boolean;
}

export interface EstablishmentsImmersionContacts {
  establishment_siret: string;
  contact_uuid: string;
}

export interface EstablishmentsLocations {
  id: string;
  establishment_siret: string;
  post_code: string;
  city: string;
  street_number_and_address: string;
  department_code: string;
  lat: number;
  lon: number;
  position: string;
}

export interface ImmersionOffers {
  rome_code: string;
  siret: string;
  created_at: Generated<Timestamp>;
  update_date: Generated<Timestamp>;
  score: Generated<number | null>;
  appellation_code: number;
}

export type ContactMode = "EMAIL" | "IN_PERSON" | "PHONE";

export interface ImmersionContacts {
  uuid: string;
  lastname: string;
  firstname: string;
  email: string;
  job: string;
  phone: string | null;
  contact_mode: ContactMode;
  copy_emails: Generated<Json>;
}

export type AgencyGroupKind = "france-travail";

export type AgencyGroupScope = "direction-régionale" | "direction-territoriale";

export interface AgencyGroups {
  id: Generated<number>;
  siret: string;
  name: string;
  email: string | null;
  cc_emails: Json | null;
  departments: Json;
  kind: AgencyGroupKind;
  scope: AgencyGroupScope;
  code_safir: string;
}

export interface AgencyGroupsAgencies {
  agency_group_id: number;
  agency_id: string;
}

export type EventStatus =
  | "failed-but-will-retry"
  | "failed-to-many-times"
  | "in-process"
  | "never-published"
  | "published"
  | "to-republish";

export interface Outbox {
  id: string;
  occurred_at: Timestamp;
  was_quarantined: Generated<boolean | null>;
  topic: string;
  payload: Json;
  status: EventStatus;
}

export interface Nps {
  id: Generated<number>;
  convention_id: string | null;
  role: string | null;
  score: number | null;
  would_have_done_without_if: boolean | null;
  comments: string | null;
  raw_result: Json;
  respondent_id: string;
  response_id: string;
  created_at: Generated<Timestamp>;
}
