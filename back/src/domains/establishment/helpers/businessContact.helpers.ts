import { type BusinessContactDto, errors } from "shared";
import type { UnitOfWork } from "../../core/unit-of-work/ports/UnitOfWork";
import type {
  EstablishmentAdminRight,
  EstablishmentAggregate,
} from "../entities/EstablishmentAggregate";

export const businessContactFromEstablishmentAggregateAndUsers = async (
  uow: UnitOfWork,
  establishmentAggregate: EstablishmentAggregate,
): Promise<BusinessContactDto> => {
  const firstAdminRight = establishmentAggregate.userRights.find(
    (right): right is EstablishmentAdminRight =>
      right.role === "establishment-admin",
  );
  if (!firstAdminRight)
    throw errors.establishment.adminNotFound({
      siret: establishmentAggregate.establishment.siret,
    });
  const firstAdmin = await uow.userRepository.getById(firstAdminRight.userId);
  if (!firstAdmin)
    throw errors.establishment.adminNotFound({
      siret: establishmentAggregate.establishment.siret,
    });

  const contacts = await uow.userRepository.getByIds(
    establishmentAggregate.userRights
      .filter((right) => right.role === "establishment-contact")
      .map(({ userId }) => userId),
  );

  return {
    contactMethod: establishmentAggregate.establishment.contactMethod,
    firstName: firstAdmin.firstName,
    lastName: firstAdmin.lastName,
    email: firstAdmin.email,
    job: firstAdminRight.job,
    phone: firstAdminRight.phone,
    copyEmails: contacts.map(({ email }) => email),
  };
};
