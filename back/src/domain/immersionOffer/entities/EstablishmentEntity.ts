import { LatLonDto } from "shared/src/latLon";
import { NafDto } from "shared/src/naf";
import { ContactEntityV2 } from "./ContactEntity";
import { ImmersionOfferEntityV2 } from "./ImmersionOfferEntity";
import { FormEstablishmentSource } from "shared/src/formEstablishment/FormEstablishment.dto";
import { SiretDto } from "shared/src/siret";

export type DataSource = "api_labonneboite" | "form";
type ApiSource = "api_labonneboite";
export type SourceProvider = FormEstablishmentSource | ApiSource;

// prettier-ignore
export type NumberEmployeesRange = ""| "0"| "1-2"| "3-5"| "6-9"| "10-19"| "20-49"| "50-99"| "100-199"| "200-249"| "250-499"| "500-999"| "1000-1999"| "2000-4999"| "5000-9999"| "+10000";

export type EstablishmentEntityV2 = {
  siret: SiretDto;
  name: string;
  customizedName?: string;
  address: string;
  voluntaryToImmersion: boolean;
  dataSource: DataSource;
  sourceProvider: SourceProvider;
  position: LatLonDto;
  nafDto: NafDto;
  numberEmployeesRange: NumberEmployeesRange;
  updatedAt?: Date;
  isActive: boolean;
  isSearchable: boolean;
  isCommited?: boolean;
};

export type AnnotatedEstablishmentEntityV2 = EstablishmentEntityV2 & {
  nafLabel: string;
};

export type EstablishmentAggregate = {
  establishment: EstablishmentEntityV2;
  immersionOffers: ImmersionOfferEntityV2[];
  contact?: ContactEntityV2;
};
