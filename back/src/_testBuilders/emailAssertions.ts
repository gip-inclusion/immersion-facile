import { TemplatedEmail } from "shared/email";
import { AgencyDto } from "shared/src/agency/agency.dto";
import { getValidatedApplicationFinalConfirmationParams } from "../domain/convention/useCases/notifications/NotifyAllActorsOfFinalApplicationValidation";
import { EstablishmentEntityV2 } from "../domain/immersionOffer/entities/EstablishmentEntity";
import {
  ContactEstablishmentByMailDto,
  ContactEstablishmentInPersonDto,
} from "shared/src/contactEstablishment";
import { frontRoutes } from "shared/src/routes";
import { AnnotatedImmersionOfferEntityV2 } from "../domain/immersionOffer/entities/ImmersionOfferEntity";
import { ContactEstablishmentByPhoneDto } from "shared/src/contactEstablishment";
import { fakeGenerateMagicLinkUrlFn } from "./test.helpers";
import { ContactEntityV2 } from "../domain/immersionOffer/entities/ContactEntity";
import { ConventionDto } from "shared/src/convention/convention.dto";
import { FormEstablishmentDto } from "shared/src/formEstablishment/FormEstablishment.dto";

export const expectEmailAdminNotificationMatchingConvention = (
  templatedEmail: TemplatedEmail,
  params: {
    recipient: string;
    convention: ConventionDto;
    magicLink: string;
    agency: AgencyDto;
  },
) => {
  const { recipient, convention, magicLink, agency } = params;
  const { id, firstName, lastName, dateStart, dateEnd, businessName } =
    convention;

  expectTemplatedEmailToEqual(templatedEmail, {
    type: "NEW_CONVENTION_ADMIN_NOTIFICATION",
    recipients: [recipient],
    params: {
      demandeId: id,
      firstName,
      lastName,
      dateStart,
      dateEnd,
      businessName,
      agencyName: agency.name,
      magicLink,
    },
    cc: [],
  });
};

export const expectEmailBeneficiaryConfirmationSignatureRequestMatchingConvention =
  (templatedEmail: TemplatedEmail, convention: ConventionDto) => {
    const { email, id, firstName, lastName, businessName } = convention;

    expectTemplatedEmailToEqual(templatedEmail, {
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
      cc: [],
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
  expectTemplatedEmailToEqual(templatedEmail, {
    type: "VALIDATED_CONVENTION_FINAL_CONFIRMATION",
    recipients,
    params: getValidatedApplicationFinalConfirmationParams(agency, convention),
    cc: [],
  });
};

export const expectedEmailEstablishmentCreatedReviewMatchingEstablisment = (
  templatedEmail: TemplatedEmail,
  establishmentDto: FormEstablishmentDto,
) => {
  expectTemplatedEmailToEqual(templatedEmail, {
    type: "NEW_ESTABLISHMENT_CREATED_CONTACT_CONFIRMATION",
    recipients: [establishmentDto.businessContact.email],
    params: { establishmentDto },
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
  expectTemplatedEmailToEqual(templatedEmail, {
    type: "NEW_CONVENTION_REVIEW_FOR_ELIGIBILITY_OR_VALIDATION",
    recipients: [recipient],
    params: {
      beneficiaryFirstName: convention.firstName,
      beneficiaryLastName: convention.lastName,
      businessName: convention.businessName,
      magicLink,
      possibleRoleAction,
    },
    cc: [],
  });
};

export const expectNotifyBeneficiaryAndEnterpriseThatApplicationIsRejected = (
  templatedEmail: TemplatedEmail,
  recipients: string[],
  dto: ConventionDto,
  agency: AgencyDto,
) => {
  expectTemplatedEmailToEqual(templatedEmail, {
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
    cc: [],
  });
};

export const expectNotifyBeneficiaryAndEnterpriseThatApplicationModificationIsRequested =
  (
    templatedEmail: TemplatedEmail,
    recipients: string[],
    dto: ConventionDto,
    agency: AgencyDto,
    reason: string,
  ) => {
    expectTemplatedEmailToEqual(templatedEmail, {
      type: "CONVENTION_MODIFICATION_REQUEST_NOTIFICATION",
      recipients,
      params: {
        beneficiaryFirstName: dto.firstName,
        beneficiaryLastName: dto.lastName,
        businessName: dto.businessName,
        reason,
        signature: agency.signature,
        agency: agency.name,
        immersionProfession: dto.immersionAppellation,
      },
      cc: [],
    });
  };

export const expectEmailMatchingLinkRenewalEmail = (
  templatedEmail: TemplatedEmail,
  recipient: string,
  magicLink: string,
) => {
  expectTemplatedEmailToEqual(templatedEmail, {
    type: "MAGIC_LINK_RENEWAL",
    recipients: [recipient],
    params: {
      magicLink,
    },
    cc: [],
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
  expectTemplatedEmailToEqual(templatedEmail, {
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
  expectTemplatedEmailToEqual(templatedEmail, {
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
    cc: [],
  });
};

export const expectContactInPersonInstructions = (
  templatedEmail: TemplatedEmail,
  recipients: string[],
  establishment: EstablishmentEntityV2,
  contact: ContactEntityV2,
  payload: ContactEstablishmentInPersonDto,
) => {
  expectTemplatedEmailToEqual(templatedEmail, {
    type: "CONTACT_IN_PERSON_INSTRUCTIONS",
    recipients,
    params: {
      businessName: establishment.name,
      contactFirstName: contact.firstName,
      contactLastName: contact.lastName,
      businessAddress: establishment.address,
      potentialBeneficiaryFirstName: payload.potentialBeneficiaryFirstName,
      potentialBeneficiaryLastName: payload.potentialBeneficiaryLastName,
    },
    cc: [],
  });
};

const expectTemplatedEmailToEqual = (
  email: TemplatedEmail,
  expected: TemplatedEmail,
) => {
  expect(email).toEqual(expected);
};
