import { ColumnType, Generated } from "kysely";
import { AbsoluteUrl, ConventionId } from "shared";

export interface Database {
  actors: Actors;
  agencies: Agencies;
  agency_groups__agencies: AgencyGroupsAgencies;
  agency_groups: AgencyGroups;
  api_consumers_subscriptions: ApiConsumersSubscriptions;
  api_consumers: ApiConsumers;
  convention_external_ids: ConventionExternalIds;
  conventions: Conventions;
  delegation_contacts: DelegationContacts;
  discussions: Discussions;
  establishment_lead_events: EstablishmentLeadEvents;
  establishments_contacts: EstablishmentsContacts;
  establishments_locations: EstablishmentsLocations;
  establishments_deleted: EstablishmentsDeleted;
  establishments: Establishments;
  exchanges: Exchanges;
  feature_flags: FeatureFlags;
  form_establishments: PgFormEstablishments;
  groups__sirets: GroupsSirets;
  groups: Groups;
  immersion_offers: ImmersionOffers;
  immersion_assessments: ImmersionAssessments;
  notifications_email_attachments: NotificationsEmailAttachments;
  notifications_email_recipients: NotificationsEmailRecipients;
  notifications_email: NotificationsEmail;
  notifications_sms: NotificationsSms;
  nps: Nps;
  outbox: Outbox;
  outbox_failures: OutboxFailures;
  outbox_publications: OutboxPublications;
  partners_pe_connect: PartnersPeConnect;
  public_appellations_data: PublicAppellationsData;
  public_romes_data: PublicRomesData;
  saved_errors: SavedErrors;
  searches_made__appellation_code: SearchesMadeAppellationCode;
  searches_made: SearchesMade;
  users__agencies: UsersAgencies;
  users_admins: UsersAdmins;
  users_ongoing_oauths: OngoingOauths;
  users: Users;
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

type WithAcquisition = {
  acquisition_campaign: string | null;
  acquisition_keyword: string | null;
};

type ImmersionObjectives =
  | "Confirmer un projet professionnel"
  | "Découvrir un métier ou un secteur d'activité"
  | "Initier une démarche de recrutement";

type InternshipKind = "immersion" | "mini-stage-cci";

type NumberEmployeesRange =
  | ""
  | "0"
  | "1-2"
  | "3-5"
  | "6-9"
  | "10-19"
  | "20-49"
  | "50-99"
  | "100-199"
  | "200-249"
  | "250-499"
  | "500-999"
  | "1000-1999"
  | "2000-4999"
  | "5000-9999"
  | "+10000";

interface Discussions extends WithAcquisition {
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
  convention_id: ConventionId | null;
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
  attachments: Generated<Json>;
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

interface Agencies extends WithAcquisition {
  id: string;
  name: string;
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
  subscriber_error_feedback: Json;
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

interface Conventions extends WithAcquisition {
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
  establishment_number_employees: NumberEmployeesRange | null;
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

interface PgFormEstablishments extends WithAcquisition {
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

interface Users {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  created_at: Generated<string>;
  updated_at: Generated<Timestamp>;
  external_id: string | null;
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
interface Establishments extends WithAcquisition {
  additional_information: Generated<string | null>;
  created_at: Timestamp;
  customized_name: string | null;
  fit_for_disabled_workers: Generated<boolean | null>;
  is_commited: boolean | null;
  is_open: Generated<boolean>;
  is_searchable: Generated<boolean>;
  last_insee_check_date: Timestamp | null;
  legacy_address: string | null;
  max_contacts_per_week: number;
  naf_code: string | null;
  naf_nomenclature: string | null;
  name: string | null;
  next_availability_date: Timestamp | null;
  number_employees: string | null;
  searchable_by_job_seekers: boolean;
  searchable_by_students: boolean;
  siret: string;
  source_provider: string;
  update_date: Timestamp | null;
  website: Generated<string | null>;
}

interface PublicAppellationsData {
  ogr_appellation: Generated<number>;
  code_rome: string;
  libelle_appellation_long: string;
  libelle_appellation_court: string;
  libelle_appellation_long_tsvector: string | null;
  libelle_appellation_long_without_special_char: string;
}
interface PublicRomesData {
  code_rome: string;
  libelle_rome: string;
  libelle_rome_tsvector: string | null;
}

interface EstablishmentsLocations {
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

interface ImmersionOffers {
  rome_code: string;
  siret: string;
  created_at: Generated<Timestamp>;
  update_date: Generated<Timestamp>;
  score: Generated<number | null>;
  appellation_code: number;
}

type ContactMode = "EMAIL" | "IN_PERSON" | "PHONE";

interface EstablishmentsContacts {
  uuid: string;
  lastname: string;
  firstname: string;
  email: string;
  job: string;
  phone: string | null;
  contact_mode: ContactMode;
  copy_emails: Generated<Json>;
  siret: string;
}

type AgencyGroupKind = "france-travail";

type AgencyGroupScope = "direction-régionale" | "direction-territoriale";

interface AgencyGroups {
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

interface AgencyGroupsAgencies {
  agency_group_id: number;
  agency_id: string;
}

type EventStatus =
  | "failed-but-will-retry"
  | "failed-to-many-times"
  | "in-process"
  | "never-published"
  | "published"
  | "to-republish";

interface Outbox {
  id: string;
  occurred_at: Timestamp;
  was_quarantined: Generated<boolean | null>;
  topic: string;
  payload: Json;
  status: EventStatus;
}

interface Nps {
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

interface SearchesMadeAppellationCode {
  search_made_id: string;
  appellation_code: Generated<string | null>;
}

type SortedBy = "date" | "distance" | "score";
interface SearchesMade extends WithAcquisition {
  id: string;
  rome: string | null;
  needstobesearched: boolean | null;
  update_date: Generated<Timestamp | null>;
  voluntary_to_immersion: boolean | null;
  api_consumer_name: string | null;
  sorted_by: Generated<SortedBy | null>;
  address: string | null;
  number_of_results: number | null;
  lat: number | null;
  lon: number | null;
  distance: number | null;
  gps: string | null;
}

interface UsersAgencies {
  user_id: string;
  agency_id: string;
  roles: Json;
  is_notified_by_email: boolean;
}

interface DelegationContacts {
  province: string;
  created_at: Generated<Timestamp | null>;
  updated_at: Generated<Timestamp | null>;
  email: string;
}

interface UsersAdmins {
  user_id: string;
}

interface NotificationsEmail {
  id: string;
  email_kind: string;
  created_at: Timestamp;
  convention_id: string | null;
  establishment_siret: string | null;
  agency_id: string | null;
  params: Json | null;
  reply_to_name: string | null;
  reply_to_email: string | null;
  sender_email: string | null;
  sender_name: string | null;
}

interface NotificationsEmailAttachments {
  id: Generated<number>;
  notifications_email_id: string;
  attachment: Json;
}

type RecipientType = "cc" | "to";
interface NotificationsEmailRecipients {
  notifications_email_id: string;
  email: string;
  recipient_type: RecipientType;
}

interface NotificationsSms {
  id: string;
  sms_kind: string;
  created_at: Timestamp;
  recipient_phone: string;
  convention_id: string | null;
  establishment_siret: string | null;
  agency_id: string | null;
  params: Json | null;
}

interface OutboxFailures {
  id: Generated<number>;
  publication_id: number;
  subscription_id: string;
  error_message: string | null;
}

interface OutboxPublications {
  id: Generated<number>;
  event_id: string;
  published_at: Timestamp;
}

interface FeatureFlags {
  flag_name: string;
  is_active: boolean;
  kind: Generated<string>;
  value: Json | null;
}

interface EstablishmentsDeleted {
  siret: string | null;
  created_at: Timestamp;
  deleted_at: Timestamp;
}
interface ImmersionAssessments {
  convention_id: string;
  status: string;
  establishment_feedback: string;
  created_at: Generated<Timestamp | null>;
  updated_at: Generated<Timestamp | null>;
}
