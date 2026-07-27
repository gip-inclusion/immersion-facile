import type { EstablishmentAggregate } from "../entities/EstablishmentAggregate";

export const isEstablishmentReachableByPhoneAfter15Days = (
  establishmentAggregate: EstablishmentAggregate,
): boolean => {
  return (
    establishmentAggregate.establishment.contactMode === "EMAIL" &&
    establishmentAggregate.userRights.some(
      (right) => right.isMainContactByPhone,
    )
  );
};
