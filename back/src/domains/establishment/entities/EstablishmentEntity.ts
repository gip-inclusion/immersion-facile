import {
  ContactMethod,
  DateTimeIsoString,
  EstablishmentSearchableBy,
  FormEstablishmentSource,
  Location,
  NafDto,
  NumberEmployeesRange,
  Phone,
  SiretDto,
  UserId,
  WithAcquisition,
} from "shared";
import { OfferEntity } from "./OfferEntity";

type ApiSource = "api_labonneboite";
type SourceProvider = FormEstablishmentSource | ApiSource;

export type EstablishmentEntity = {
  additionalInformation?: string;
  createdAt: Date;
  customizedName?: string;
  fitForDisabledWorkers: boolean;
  isCommited?: boolean;
  isOpen: boolean;
  isSearchable: boolean;
  lastInseeCheckDate?: Date;
  locations: Location[];
  maxContactsPerMonth: number;
  nafDto: NafDto;
  name: string;
  nextAvailabilityDate?: DateTimeIsoString;
  numberEmployeesRange: NumberEmployeesRange;
  searchableBy: EstablishmentSearchableBy;
  siret: SiretDto;
  sourceProvider: SourceProvider;
  updatedAt: Date;
  voluntaryToImmersion: boolean;
  website?: string;
  score: number;
  contactMethod: ContactMethod;
} & WithAcquisition;

export type EstablishmentAggregate = {
  establishment: EstablishmentEntity;
  offers: OfferEntity[];
  userRights: EstablishmentUserRight[];
};

export type WithEstablishmentAggregate = {
  establishmentAggregate: EstablishmentAggregate;
};

type EstablishmentRole = "establishment-admin" | "establishment-contact";
type GenericEstablishmentUserRight<Role extends EstablishmentRole> = {
  userId: UserId;
  role: Role;
};

type WithJobAndPhone = {
  job: string;
  phone: Phone;
};

export type EstablishmentAdminRight =
  GenericEstablishmentUserRight<"establishment-admin"> & WithJobAndPhone;

export type EstablishmentContactRight =
  GenericEstablishmentUserRight<"establishment-contact"> &
    Partial<WithJobAndPhone>;

export type EstablishmentUserRight =
  | EstablishmentAdminRight
  | EstablishmentContactRight;
