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
  isSearchable: boolean;
};

export type FormEstablishmentBatchDto = {
  groupName: string;
  formEstablishments: FormEstablishmentDto[];
};
