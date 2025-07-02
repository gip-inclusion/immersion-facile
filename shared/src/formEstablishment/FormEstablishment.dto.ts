import type { AbsoluteUrl } from "../AbsoluteUrl";
import type { WithAcquisition } from "../acquisition.dto";
import type { LocationId } from "../address/address.dto";
import type { ApiConsumerName } from "../apiConsumer/ApiConsumer";
import type { Email } from "../email/email.dto";
import type { GroupName } from "../group/group.dto";
import type { NafDto } from "../naf/naf.dto";
import type { PhoneNumber } from "../phone/phone.dto";
import type { EstablishmentRole } from "../role/role.dto";
import type { AppellationAndRomeDto } from "../romeAndAppellationDtos/romeAndAppellation.dto";
import type { SiretDto } from "../siret/siret";
import type { Flavor } from "../typeFlavors";
import { includesTypeGuard } from "../typeGuard";
import type { DateTimeIsoString } from "../utils/date";

export type ImmersionContactInEstablishmentId = Flavor<
  string,
  "ImmersionContactInEstablishmentId"
>;

const contactModes = ["EMAIL", "PHONE", "IN_PERSON"] as const;
export type ContactMode = (typeof contactModes)[number];
export const isContactMode = includesTypeGuard(contactModes);

type GenericFormEstablishmentUserRight<Role extends EstablishmentRole> = {
  email: Email;
  role: Role;
  shouldReceiveDiscussionNotifications: boolean;
};

export type WithJobAndPhone = {
  job: string;
  phone: PhoneNumber;
};

export type AdminFormEstablishmentUserRight =
  GenericFormEstablishmentUserRight<"establishment-admin"> & WithJobAndPhone;

export type ContactFormEstablishmentUserRight =
  GenericFormEstablishmentUserRight<"establishment-contact"> &
    Partial<WithJobAndPhone>;

export type FormEstablishmentUserRight =
  | AdminFormEstablishmentUserRight
  | ContactFormEstablishmentUserRight;

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
  userRights: FormEstablishmentUserRight[];
  businessName: string;
  businessNameCustomized?: string;
  contactMode: ContactMode;
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
  contactMode: ContactMode;
  isEngagedEnterprise: CSVBoolean;
  isSearchable?: CSVBoolean;
  website: CSVOptionalString;
  additionalInformation: CSVOptionalString;
  fitForDisabledWorkers?: CSVBoolean;
  searchableByStudents: CSVBoolean;
  searchableByJobSeekers: CSVBoolean;
  right1_email: Email;
  right1_phone: PhoneNumber;
  right1_job: string;
  right2_role?: EstablishmentRole;
  right2_email?: Email;
  right2_phone?: PhoneNumber;
  right2_job?: string;
  right3_role?: EstablishmentRole;
  right3_email?: Email;
  right3_phone?: PhoneNumber;
  right3_job?: string;
  right4_role?: EstablishmentRole;
  right4_email?: Email;
  right4_phone?: PhoneNumber;
  right4_job?: string;
  right5_role?: EstablishmentRole;
  right5_email?: Email;
  right5_phone?: PhoneNumber;
  right5_job?: string;
  right6_role?: EstablishmentRole;
  right6_email?: Email;
  right6_phone?: PhoneNumber;
  right6_job?: string;
  right7_role?: EstablishmentRole;
  right7_email?: Email;
  right7_phone?: PhoneNumber;
  right7_job?: string;
  right8_role?: EstablishmentRole;
  right8_email?: Email;
  right8_phone?: PhoneNumber;
  right8_job?: string;
  right9_role?: EstablishmentRole;
  right9_email?: Email;
  right9_phone?: PhoneNumber;
  right9_job?: string;
  right10_role?: EstablishmentRole;
  right10_email?: Email;
  right10_phone?: PhoneNumber;
  right10_job?: string;
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
