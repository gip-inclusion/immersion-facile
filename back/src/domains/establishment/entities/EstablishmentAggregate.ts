import type { EstablishmentRole, UserId, WithJobAndPhone } from "shared";
import type { EstablishmentEntity } from "./EstablishmentEntity";
import type { OfferEntity } from "./OfferEntity";

export type EstablishmentAggregate = {
  establishment: EstablishmentEntity;
  offers: OfferEntity[];
  userRights: EstablishmentUserRight[];
};

export type WithEstablishmentAggregate = {
  establishmentAggregate: EstablishmentAggregate;
};

type GenericEstablishmentUserRight<Role extends EstablishmentRole> = {
  userId: UserId;
  role: Role;
  shouldReceiveDiscussionNotifications: boolean;
};

export type EstablishmentAdminRight =
  GenericEstablishmentUserRight<"establishment-admin"> &
    Required<WithJobAndPhone>;

export type EstablishmentContactRight =
  GenericEstablishmentUserRight<"establishment-contact"> &
    Partial<WithJobAndPhone>;

export type EstablishmentUserRight =
  | EstablishmentAdminRight
  | EstablishmentContactRight;
