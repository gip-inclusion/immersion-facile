import type { AbsoluteUrl } from "../AbsoluteUrl";
import type { WithAcquisition } from "../acquisition.dto";
import type { LocationId } from "../address/address.dto";
import type { ApiConsumerName } from "../apiConsumer/ApiConsumer";
import type { Email } from "../email/email.dto";
import type { GroupName } from "../group/group.dto";
import type { NafDto } from "../naf/naf.dto";
import type { AppellationAndRomeDto } from "../romeAndAppellationDtos/romeAndAppellation.dto";
import type { SiretDto } from "../siret/siret";
import type { Flavor } from "../typeFlavors";
import { includesTypeGuard } from "../typeGuard";
import type { DateTimeIsoString } from "../utils/date";

export type ImmersionContactInEstablishmentId = Flavor<
  string,
  "ImmersionContactInEstablishmentId"
>;

const contactMethods = ["EMAIL", "PHONE", "IN_PERSON"] as const;
export type ContactMethod = (typeof contactMethods)[number];
export const isContactMethod = includesTypeGuard(contactMethods);

export type BusinessContactDto = {
  lastName: string;
  firstName: string;
  job: string;
  phone: string; // we have a very permissive regex /^\+?[0-9]+$/
  email: Email; // a valid email
  contactMethod: ContactMethod;
  copyEmails: Email[];
};

export type FormEstablishmentSourceInUrl =
  | "immersion-facile"
  | "cci"
  | "cma"
  | "lesentreprises-sengagent"
  | "unJeuneUneSolution";

export type FormEstablishmentSource =
  | FormEstablishmentSourceInUrl
  | ApiConsumerName;

export type EstablishmentSearchableBy = {
  students: boolean;
  jobSeekers: boolean;
};

export type FormEstablishmentAddress = {
  id: LocationId;
  rawAddress: string;
};

export type EstablishmentSearchableByValue = keyof EstablishmentSearchableBy;

export type FormEstablishmentDto = {
  additionalInformation?: string;
  appellations: AppellationAndRomeDto[]; // at least one
  businessAddresses: FormEstablishmentAddress[];
  businessContact: BusinessContactDto;
  businessName: string;
  businessNameCustomized?: string;
  fitForDisabledWorkers: boolean;
  isEngagedEnterprise?: boolean;
  maxContactsPerMonth: number;
  naf?: NafDto; // { code: string, nomenclature: string }
  nextAvailabilityDate?: DateTimeIsoString;
  siret: SiretDto; // 14 characters string
  source: FormEstablishmentSource;
  website?: AbsoluteUrl | "";
  searchableBy: EstablishmentSearchableBy;
} & WithAcquisition;

export type WithFormEstablishmentDto = {
  formEstablishment: FormEstablishmentDto;
};

export type CSVBoolean = "1" | "0" | "";
export type CSVOptionalString = string | "";

export type EstablishmentCSVRow = {
  siret: string;
  businessNameCustomized: CSVOptionalString;
  businessName: string;
  businessAddress: string;
  naf_code: string;
  appellations_code: string;
  isEngagedEnterprise: CSVBoolean;
  businessContact_job: string;
  businessContact_email: string;
  businessContact_phone: string;
  businessContact_lastName: string;
  businessContact_firstName: string;
  businessContact_contactMethod: ContactMethod;
  businessContact_copyEmails: string;
  isSearchable?: CSVBoolean;
  website: CSVOptionalString;
  additionalInformation: CSVOptionalString;
  fitForDisabledWorkers?: CSVBoolean;
  searchableByStudents: CSVBoolean;
  searchableByJobSeekers: CSVBoolean;
};

export type SiretAdditionFailure = { siret: SiretDto; errorMessage: string };

export type FormEstablishmentBatchDto = {
  groupName: GroupName;
  title: string;
  description: string;
  formEstablishments: FormEstablishmentDto[];
};

export type EstablishmentBatchReport = {
  numberOfEstablishmentsProcessed: number;
  numberOfSuccess: number;
  failures: SiretAdditionFailure[];
};
