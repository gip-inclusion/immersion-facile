import { ContactMethod } from "../../../shared/FormEstablishmentDto";
import { Position } from "../ports/GetPosition";
import {
  ContactEntityV2,
  ImmersionOfferEntityV2,
} from "./ImmersionOfferEntity";

export type DataSource =
  | "api_labonneboite"
  | "api_laplateformedelinclusion"
  | "form"
  | "api_sirene";

// prettier-ignore
export type TefenCode = -1 | 0 | 1 | 2 | 3 | 11 | 12 | 21 | 22 | 31 | 32 | 41 | 42 | 51 | 52 | 53;

export type EstablishmentAggregate = {
  establishment: EstablishmentEntityV2;
  immersionOffers: ImmersionOfferEntityV2[];
  contacts: ContactEntityV2[];
};

export type EstablishmentEntityV2 = {
  siret: string;
  name: string;
  address: string;
  voluntaryToImmersion: boolean;
  dataSource: DataSource;
  contactMethod?: ContactMethod;
  position: Position;
  naf: string;
  numberEmployeesRange: TefenCode;
};
