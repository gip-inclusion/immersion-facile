import {
  DateTimeIsoString,
  EstablishmentSearchableBy,
  FormEstablishmentSource,
  Location,
  NafDto,
  NumberEmployeesRange,
  SiretDto,
  WithMatomo,
} from "shared";
import { ContactEntity } from "./ContactEntity";
import { OfferEntity } from "./OfferEntity";

type ApiSource = "api_labonneboite";
type SourceProvider = FormEstablishmentSource | ApiSource;

export type EstablishmentEntity = {
  nextAvailabilityDate?: DateTimeIsoString;
  siret: SiretDto;
  name: string;
  customizedName?: string;
  locations: Location[];
  voluntaryToImmersion: boolean;
  sourceProvider: SourceProvider;
  nafDto: NafDto;
  numberEmployeesRange: NumberEmployeesRange;
  createdAt: Date;
  updatedAt?: Date;
  lastInseeCheckDate?: Date;
  isOpen: boolean;
  isSearchable: boolean;
  isCommited?: boolean;
  fitForDisabledWorkers?: boolean;
  website?: string;
  additionalInformation?: string;
  maxContactsPerWeek: number;
  searchableBy: EstablishmentSearchableBy;
} & WithMatomo;

export type EstablishmentAggregate = {
  establishment: EstablishmentEntity;
  offers: OfferEntity[];
  contact?: ContactEntity;
};

export type WithEstablishmentAggregate = {
  establishmentAggregate: EstablishmentAggregate;
};
