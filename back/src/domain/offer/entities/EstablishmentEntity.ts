import {
  AddressDto,
  DateTimeIsoString,
  FormEstablishmentSource,
  GeoPositionDto,
  NafDto,
  NumberEmployeesRange,
  SiretDto,
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
  address: AddressDto;
  voluntaryToImmersion: boolean;
  sourceProvider: SourceProvider;
  position: GeoPositionDto;
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
};

export type EstablishmentAggregate = {
  establishment: EstablishmentEntity;
  offers: OfferEntity[];
  contact?: ContactEntity;
};

export type WithEstablishmentAggregate = {
  establishmentAggregate: EstablishmentAggregate;
};
