import { Phone, UserId } from "shared";
import { EstablishmentEntity } from "./EstablishmentEntity";
import { OfferEntity } from "./OfferEntity";

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
