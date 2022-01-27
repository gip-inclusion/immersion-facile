import { ContactMethod } from "../../../shared/FormEstablishmentDto";
import { LatLonDto } from "../../../shared/SearchImmersionDto";
import { ContactEntityV2 } from "./ContactEntity";
import { ImmersionOfferEntityV2 } from "./ImmersionOfferEntity";

export type DataSource = "api_labonneboite" | "form" | "api_sirene";

// prettier-ignore
export type TefenCode = -1 | 0 | 1 | 2 | 3 | 11 | 12 | 21 | 22 | 31 | 32 | 41 | 42 | 51 | 52 | 53;

export const employeeRangeByTefenCode: Record<TefenCode, string> = {
  [-1]: "",
  [0]: "0",
  [1]: "1-2",
  [2]: "3-5",
  [3]: "6-9",
  [11]: "10-19",
  [12]: "20-49",
  [21]: "50-99",
  [22]: "100-199",
  [31]: "200-249",
  [32]: "250-499",
  [41]: "500-999",
  [42]: "1000-1999",
  [51]: "2000-4999",
  [52]: "5000-9999",
  [53]: "+10000",
};

export type EstablishmentEntityV2 = {
  siret: string;
  name: string;
  address: string;
  voluntaryToImmersion: boolean;
  dataSource: DataSource;
  contactMethod?: ContactMethod;
  position: LatLonDto;
  naf: string;
  numberEmployeesRange: TefenCode;
  updatedAt?: Date;
  isActive: boolean;
};

export type AnnotatedEstablishmentEntityV2 = EstablishmentEntityV2 & {
  nafLabel: string;
};

export type EstablishmentAggregate = {
  establishment: EstablishmentEntityV2;
  immersionOffers: ImmersionOfferEntityV2[];
  contacts: ContactEntityV2[];
};
