import {
  AddressDto,
  FormEstablishmentSource,
  GeoPositionDto,
  NafDto,
  SiretDto,
} from "shared";
import { ContactEntity } from "./ContactEntity";
import { ImmersionOfferEntityV2 } from "./ImmersionOfferEntity";

export type DataSource = "api_labonneboite" | "form";
type ApiSource = "api_labonneboite";
export type SourceProvider = FormEstablishmentSource | ApiSource;

// prettier-ignore
export type NumberEmployeesRange = ""| "0"| "1-2"| "3-5"| "6-9"| "10-19"| "20-49"| "50-99"| "100-199"| "200-249"| "250-499"| "500-999"| "1000-1999"| "2000-4999"| "5000-9999"| "+10000";

export type EstablishmentEntity = {
  siret: SiretDto;
  name: string;
  customizedName?: string;
  address: AddressDto;
  voluntaryToImmersion: boolean;
  dataSource: DataSource;
  sourceProvider: SourceProvider;
  position: GeoPositionDto;
  nafDto: NafDto;
  numberEmployeesRange: NumberEmployeesRange;
  updatedAt?: Date;
  isActive: boolean;
  isSearchable: boolean;
  isCommited?: boolean;
  fitForDisabledWorkers?: boolean;
  website?: string;
  additionalInformation?: string;
  maxContactsPerWeek: number;
};

export type AnnotatedEstablishmentEntityV2 = EstablishmentEntity & {
  nafLabel: string;
};

export type EstablishmentAggregate = {
  establishment: EstablishmentEntity;
  immersionOffers: ImmersionOfferEntityV2[];
  contact?: ContactEntity;
};
