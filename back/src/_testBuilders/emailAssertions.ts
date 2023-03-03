import {
  addressDtoToString,
  AgencyDto,
  ContactEstablishmentByMailDto,
  ContactEstablishmentByPhoneDto,
  ContactEstablishmentInPersonDto,
  ConventionDto,
  FormEstablishmentDto,
  frontRoutes,
  Signatory,
  TemplatedEmail,
  expectTypeToMatchAndEqual,
  CreateConventionMagicLinkPayloadProperties,
} from "shared";
import { GenerateConventionMagicLink } from "../adapters/primary/config/createGenerateConventionMagicLink";
import { getValidatedConventionFinalConfirmationParams } from "../domain/convention/useCases/notifications/NotifyAllActorsOfFinalConventionValidation";
import { TimeGateway } from "../domain/core/ports/TimeGateway";
import { ContactEntity } from "../domain/immersionOffer/entities/ContactEntity";
import { EstablishmentEntity } from "../domain/immersionOffer/entities/EstablishmentEntity";
import { AnnotatedImmersionOfferEntityV2 } from "../domain/immersionOffer/entities/ImmersionOfferEntity";
import { fakeGenerateMagicLinkUrlFn } from "./fakeGenerateMagicLinkUrlFn";

export const expectEmaiSignatoryConfirmationSignatureRequestMatchingConvention =
  ({
    templatedEmail,
    convention,
    signatory,
    recipient,
    now,
    agency,
  }: {
    templatedEmail: TemplatedEmail;
    convention: ConventionDto;
    signatory: Signatory;
    recipient: string;
    now: Date;
    agency: AgencyDto;
  }) => {
    const { id, businessName } = convention;
    const {
      beneficiary,
      establishmentRepresentative,
      beneficiaryRepresentative,
      beneficiaryCurrentEmployer,
    } = convention.signatories;

    const generateMagicLinkCommonFields: CreateConventionMagicLinkPayloadProperties =
      {
        id,
        role: signatory.role,
        email: signatory.email,
        now,
      };

    expectTypeToMatchAndEqual(templatedEmail, {
      type: "NEW_CONVENTION_CONFIRMATION_REQUEST_SIGNATURE",
      recipients: [recipient],
      params: {
        internshipKind: convention.internshipKind,
        signatoryName: `${signatory.firstName} ${signatory.lastName}`,
        beneficiaryName: `${beneficiary.firstName} ${beneficiary.lastName}`,
        establishmentTutorName: `${convention.establishmentTutor.firstName} ${convention.establishmentTutor.lastName}`,
        establishmentRepresentativeName: `${establishmentRepresentative.firstName} ${establishmentRepresentative.lastName}`,
        beneficiaryRepresentativeName:
          beneficiaryRepresentative &&
          `${beneficiaryRepresentative.firstName} ${beneficiaryRepresentative.lastName}`,
        beneficiaryCurrentEmployerName:
          beneficiaryCurrentEmployer &&
          `${beneficiaryCurrentEmployer.firstName} ${beneficiaryCurrentEmployer.lastName}`,
        magicLink: fakeGenerateMagicLinkUrlFn({
          ...generateMagicLinkCommonFields,
          targetRoute: frontRoutes.conventionToSign,
        }),
        conventionStatusLink: fakeGenerateMagicLinkUrlFn({
          ...generateMagicLinkCommonFields,
          targetRoute: frontRoutes.conventionStatusDashboard,
        }),
        businessName,
        agencyLogoUrl: agency.logoUrl,
      },
    });
  };

export const expectEmailFinalValidationConfirmationMatchingConvention = (
  recipients: string[],
  templatedEmails: TemplatedEmail[],
  agency: AgencyDto,
  convention: ConventionDto,
  generateMagicLinkFn: GenerateConventionMagicLink,
  timeGateway: TimeGateway,
) =>
  expectTypeToMatchAndEqual(templatedEmails, [
    {
      type: "VALIDATED_CONVENTION_FINAL_CONFIRMATION",
      recipients,
      params: getValidatedConventionFinalConfirmationParams(
        agency,
        convention,
        generateMagicLinkFn,
        timeGateway,
      ),
    },
  ]);

export const expectedEmailEstablishmentCreatedReviewMatchingEstablisment = (
  templatedEmail: TemplatedEmail,
  establishmentDto: FormEstablishmentDto,
) =>
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

type ExpectedEmailConventionReviewMatchingConventionProps = {
  templatedEmail: TemplatedEmail;
  recipient: string;
  convention: ConventionDto;
  magicLink: string;
  conventionStatusLink: string;
  possibleRoleAction: string;
  agency: AgencyDto;
};

export const expectedEmailConventionReviewMatchingConvention = ({
  templatedEmail,
  recipient,
  convention,
  magicLink,
  conventionStatusLink,
  possibleRoleAction,
  agency,
}: ExpectedEmailConventionReviewMatchingConventionProps) =>
  expectTypeToMatchAndEqual(templatedEmail, {
    type: "NEW_CONVENTION_REVIEW_FOR_ELIGIBILITY_OR_VALIDATION",
    recipients: [recipient],
    params: {
      internshipKind: convention.internshipKind,
      beneficiaryFirstName: convention.signatories.beneficiary.firstName,
      beneficiaryLastName: convention.signatories.beneficiary.lastName,
      businessName: convention.businessName,
      magicLink,
      possibleRoleAction,
      conventionStatusLink,
      agencyLogoUrl: agency.logoUrl,
    },
  });

export const expectNotifyBeneficiaryAndEnterpriseThatApplicationIsRejected = (
  templatedEmail: TemplatedEmail,
  recipients: string[],
  convention: ConventionDto,
  agency: AgencyDto,
) => {
  expectTypeToMatchAndEqual(templatedEmail, {
    type: "REJECTED_CONVENTION_NOTIFICATION",
    recipients,
    params: {
      internshipKind: convention.internshipKind,
      beneficiaryFirstName: convention.signatories.beneficiary.firstName,
      beneficiaryLastName: convention.signatories.beneficiary.lastName,
      businessName: convention.businessName,
      rejectionReason: convention.rejectionJustification || "",
      signature: agency.signature,
      agency: agency.name,
      immersionProfession: convention.immersionAppellation.appellationLabel,
      agencyLogoUrl: agency.logoUrl,
    },
  });
};

export const expectContactByEmailRequest = (
  templatedEmail: TemplatedEmail,
  recipients: string[],
  annotatedImmersionOffer: AnnotatedImmersionOfferEntityV2,
  establishment: EstablishmentEntity,
  contact: ContactEntity,
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
  establishment: EstablishmentEntity,
  contact: ContactEntity,
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
  establishment: EstablishmentEntity,
  contact: ContactEntity,
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
