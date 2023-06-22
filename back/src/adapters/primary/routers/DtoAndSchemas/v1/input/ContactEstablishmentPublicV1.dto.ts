import {
  ContactEstablishmentRequestDto,
  ContactMethod,
  RomeCode,
  SiretDto,
} from "shared";
import { UnitOfWork } from "../../../../../../domain/core/ports/UnitOfWork";
import { NotFoundError } from "../../../../helpers/httpErrors";

type ContactInformationPublicV1<T extends ContactMethod> = {
  offer: { romeLabel: string; romeCode: RomeCode };
  siret: SiretDto;
  potentialBeneficiaryFirstName: string;
  potentialBeneficiaryLastName: string;
  potentialBeneficiaryEmail: string;
  contactMode: T;
};

export type ContactEstablishmentByMailPublicV1Dto =
  ContactInformationPublicV1<"EMAIL"> & {
    message: string;
  };

export type ContactEstablishmentInPersonPublicV1Dto =
  ContactInformationPublicV1<"IN_PERSON">;

export type ContactEstablishmentByPhonePublicV1Dto =
  ContactInformationPublicV1<"PHONE">;

export type ContactEstablishmentPublicV1Dto =
  | ContactEstablishmentByPhonePublicV1Dto
  | ContactEstablishmentInPersonPublicV1Dto
  | ContactEstablishmentByMailPublicV1Dto;

export const contactEstablishmentPublicV1ToDomain = async (
  uow: UnitOfWork,
  contactRequest: ContactEstablishmentPublicV1Dto,
): Promise<ContactEstablishmentRequestDto> => {
  const establishmentAggregate =
    await uow.establishmentAggregateRepository.getEstablishmentAggregateBySiret(
      contactRequest.siret,
    );
  if (!establishmentAggregate)
    throw new NotFoundError(
      `establishment with siret ${contactRequest.siret} not found`,
    );

  const firstOfferMatchingRome = establishmentAggregate.immersionOffers.find(
    (offer) => offer.romeCode === contactRequest.offer.romeCode,
  );

  if (!firstOfferMatchingRome)
    throw new NotFoundError(
      `Offer with rome code ${contactRequest.offer.romeCode} not found for establishment with siret ${contactRequest.siret}`,
    );

  if (contactRequest.contactMode === "EMAIL")
    return {
      ...contactRequest,
      potentialBeneficiaryPhone: "Numéro de téléphone non communiqué",
      immersionObjective: null,
      appellationCode:
        firstOfferMatchingRome.appellationCode,
    };

  return {
    ...contactRequest,
    appellationCode:
      firstOfferMatchingRome.appellationCode,
  };
};
