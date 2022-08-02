import { TemplatedEmail } from "shared/src/email/email";
import { AgencyDto } from "shared/src/agency/agency.dto";
import {
  ContactEstablishmentByMailDto,
  ContactEstablishmentByPhoneDto,
  ContactEstablishmentInPersonDto,
} from "shared/src/contactEstablishment";
import { ConventionDto } from "shared/src/convention/convention.dto";
import { FormEstablishmentDto } from "shared/src/formEstablishment/FormEstablishment.dto";
import { frontRoutes } from "shared/src/routes";
import { addressDtoToString } from "shared/src/utils/address";
import { getValidatedApplicationFinalConfirmationParams } from "../domain/convention/useCases/notifications/NotifyAllActorsOfFinalApplicationValidation";
import { ContactEntityV2 } from "../domain/immersionOffer/entities/ContactEntity";
import { EstablishmentEntityV2 } from "../domain/immersionOffer/entities/EstablishmentEntity";
import { AnnotatedImmersionOfferEntityV2 } from "../domain/immersionOffer/entities/ImmersionOfferEntity";
import {
  expectTypeToMatchAndEqual,
  fakeGenerateMagicLinkUrlFn,
} from "./test.helpers";

export const expectEmailBeneficiaryConfirmationSignatureRequestMatchingConvention =
  (templatedEmail: TemplatedEmail, convention: ConventionDto) => {
    const { email, id, firstName, lastName, businessName } = convention;

    expectTypeToMatchAndEqual(templatedEmail, {
      type: "NEW_CONVENTION_BENEFICIARY_CONFIRMATION_REQUEST_SIGNATURE",
      recipients: [email],
      params: {
        beneficiaryFirstName: firstName,
        beneficiaryLastName: lastName,
        magicLink: fakeGenerateMagicLinkUrlFn({
          id,
          role: "beneficiary",
          targetRoute: frontRoutes.conventionToSign,
          email,
        }),
        businessName,
      },
    });
  };

export const expectEmailFinalValidationConfirmationMatchingConvention = (
  recipients: string[],
  templatedEmail: TemplatedEmail,
  agency: AgencyDto | undefined,
  convention: ConventionDto,
) => {
  if (!agency) {
    fail("missing agency config");
  }
  expectTypeToMatchAndEqual(templatedEmail, {
    type: "VALIDATED_CONVENTION_FINAL_CONFIRMATION",
    recipients,
    params: getValidatedApplicationFinalConfirmationParams(agency, convention),
  });
};

export const expectedEmailEstablishmentCreatedReviewMatchingEstablisment = (
  templatedEmail: TemplatedEmail,
  establishmentDto: FormEstablishmentDto,
) => {
  expectTypeToMatchAndEqual(templatedEmail, {
    type: "NEW_ESTABLISHMENT_CREATED_CONTACT_CONFIRMATION",
    recipients: [establishmentDto.businessContact.email],
    params: {
      businessName: establishmentDto.businessName,
      contactFirstName: establishmentDto.businessContact.firstName,
      contactLastName: establishmentDto.businessContact.lastName,
    },
    cc: establishmentDto.businessContact.copyEmails,
  });
};

export const expectedEmailConventionReviewMatchingConvention = (
  templatedEmail: TemplatedEmail,
  recipient: string,
  agency: AgencyDto | undefined,
  convention: ConventionDto,
  magicLink: string,
  possibleRoleAction: string,
) => {
  if (!agency) {
    fail("missing agency config");
  }
  expectTypeToMatchAndEqual(templatedEmail, {
    type: "NEW_CONVENTION_REVIEW_FOR_ELIGIBILITY_OR_VALIDATION",
    recipients: [recipient],
    params: {
      beneficiaryFirstName: convention.firstName,
      beneficiaryLastName: convention.lastName,
      businessName: convention.businessName,
      magicLink,
      possibleRoleAction,
    },
  });
};

export const expectNotifyBeneficiaryAndEnterpriseThatApplicationIsRejected = (
  templatedEmail: TemplatedEmail,
  recipients: string[],
  dto: ConventionDto,
  agency: AgencyDto,
) => {
  expectTypeToMatchAndEqual(templatedEmail, {
    type: "REJECTED_CONVENTION_NOTIFICATION",
    recipients,
    params: {
      beneficiaryFirstName: dto.firstName,
      beneficiaryLastName: dto.lastName,
      businessName: dto.businessName,
      rejectionReason: dto.rejectionJustification || "",
      signature: agency.signature,
      agency: agency.name,
      immersionProfession: dto.immersionAppellation.appellationLabel,
    },
  });
};

export const expectContactByEmailRequest = (
  templatedEmail: TemplatedEmail,
  recipients: string[],
  annotatedImmersionOffer: AnnotatedImmersionOfferEntityV2,
  establishment: EstablishmentEntityV2,
  contact: ContactEntityV2,
  payload: ContactEstablishmentByMailDto,
  copy: string[],
) => {
  expectTypeToMatchAndEqual(templatedEmail, {
    type: "CONTACT_BY_EMAIL_REQUEST",
    recipients,
    params: {
      businessName: establishment.name,
      contactFirstName: contact.firstName,
      contactLastName: contact.lastName,
      jobLabel: annotatedImmersionOffer.romeLabel,
      potentialBeneficiaryFirstName: payload.potentialBeneficiaryFirstName,
      potentialBeneficiaryLastName: payload.potentialBeneficiaryLastName,
      potentialBeneficiaryEmail: payload.potentialBeneficiaryEmail,
      message: payload.message,
    },
    cc: copy,
  });
};

export const expectContactByPhoneInstructions = (
  templatedEmail: TemplatedEmail,
  recipients: string[],
  establishment: EstablishmentEntityV2,
  contact: ContactEntityV2,
  payload: ContactEstablishmentByPhoneDto,
) => {
  expectTypeToMatchAndEqual(templatedEmail, {
    type: "CONTACT_BY_PHONE_INSTRUCTIONS",
    recipients,
    params: {
      businessName: establishment.name,
      contactFirstName: contact.firstName,
      contactLastName: contact.lastName,
      contactPhone: contact.phone,
      potentialBeneficiaryFirstName: payload.potentialBeneficiaryFirstName,
      potentialBeneficiaryLastName: payload.potentialBeneficiaryLastName,
    },
  });
};

export const expectContactInPersonInstructions = (
  templatedEmail: TemplatedEmail,
  recipients: string[],
  establishment: EstablishmentEntityV2,
  contact: ContactEntityV2,
  payload: ContactEstablishmentInPersonDto,
) => {
  expectTypeToMatchAndEqual(templatedEmail, {
    type: "CONTACT_IN_PERSON_INSTRUCTIONS",
    recipients,
    params: {
      businessName: establishment.name,
      contactFirstName: contact.firstName,
      contactLastName: contact.lastName,
      businessAddress: addressDtoToString(establishment.address),
      potentialBeneficiaryFirstName: payload.potentialBeneficiaryFirstName,
      potentialBeneficiaryLastName: payload.potentialBeneficiaryLastName,
    },
  });
};
