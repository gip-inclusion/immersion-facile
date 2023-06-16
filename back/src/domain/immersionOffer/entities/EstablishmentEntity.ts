import {
  AddressDto,
  FormEstablishmentSource,
  GeoPositionDto,
  NafDto,
  NumberEmployeesRange,
  SiretDto,
} from "shared";
import { ContactEntity } from "./ContactEntity";
import { ImmersionOfferEntityV2 } from "./ImmersionOfferEntity";

type ApiSource = "api_labonneboite";
export type SourceProvider = FormEstablishmentSource | ApiSource;

export type EstablishmentEntity = {
  siret: SiretDto;
  name: string;
  customizedName?: string;
  address: AddressDto;
  voluntaryToImmersion: boolean;
  sourceProvider: SourceProvider;
  position: GeoPositionDto;
  nafDto: NafDto;
  numberEmployeesRange: NumberEmployeesRange;
  updatedAt?: Date;
  lastInseeCheckDate?: Date;
  isActive: boolean;
  isSearchable: boolean;
  isCommited?: boolean;
  fitForDisabledWorkers?: boolean;
  website?: string;
  additionalInformation?: string;
  maxContactsPerWeek: number;
};

export type EstablishmentAggregate = {
  establishment: EstablishmentEntity;
  immersionOffers: ImmersionOfferEntityV2[];
  contact?: ContactEntity;
};
