import { ApiConsumerName } from "../apiConsumer/ApiConsumer";
import { NafDto } from "../naf";
import { AppellationDto } from "../romeAndAppellationDtos/romeAndAppellation.dto";
import { SiretDto } from "../siret/siret";
import { Flavor } from "../typeFlavors";

// prettier-ignore
export type ImmersionContactInEstablishmentId = Flavor<string, "ImmersionContactInEstablishmentId">;

export type ContactMethod = "EMAIL" | "PHONE" | "IN_PERSON";
export type BusinessContactDto = {
  lastName: string;
  firstName: string;
  job: string;
  phone: string; // we have a very permissive regex /^\+?[0-9]+$/
  email: string; // a valid email
  contactMethod: ContactMethod;
  copyEmails: string[];
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

export type FormEstablishmentDto = {
  source: FormEstablishmentSource;
  siret: SiretDto; // 14 characters string
  businessName: string;
  businessNameCustomized?: string;
  businessAddress: string;
  isEngagedEnterprise?: boolean;
  fitForDisabledWorkers?: boolean;
  naf?: NafDto; // { code: string, nomenclature: string }
  appellations: AppellationDto[]; // at least one
  businessContact: BusinessContactDto;
  website?: string;
  additionalInformation?: string;
  maxContactsPerWeek: number;
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
};

export type EstablishmentGroupName = Flavor<string, "EstablishmentGroupName">;
export type EstablishmentGroupSlug = Flavor<string, "EstablishmentGroupSlug">;
export type WithEstablishmentGroupSlug = {
  groupSlug: EstablishmentGroupSlug;
};

export type FormEstablishmentBatchDto = {
  groupName: EstablishmentGroupName;
  formEstablishments: FormEstablishmentDto[];
};

export type SiretAdditionFailure = { siret: SiretDto; errorMessage: string };

export type EstablishmentBatchReport = {
  numberOfEstablishmentsProcessed: number;
  numberOfSuccess: number;
  failures: SiretAdditionFailure[];
};
