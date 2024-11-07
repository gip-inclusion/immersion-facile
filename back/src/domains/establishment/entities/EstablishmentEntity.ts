import {
  DateTimeIsoString,
  EstablishmentSearchableBy,
  FormEstablishmentSource,
  Location,
  NafDto,
  NumberEmployeesRange,
  SiretDto,
  WithAcquisition,
} from "shared";
import { ContactEntity } from "./ContactEntity";
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
} & WithAcquisition;

export type EstablishmentAggregate = {
  establishment: EstablishmentEntity;
  offers: OfferEntity[];
  contact: ContactEntity;
};

export type WithEstablishmentAggregate = {
  establishmentAggregate: EstablishmentAggregate;
};
