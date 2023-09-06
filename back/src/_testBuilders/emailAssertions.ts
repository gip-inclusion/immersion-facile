import { parseISO } from "date-fns";
import {
  AgencyDto,
  concatValidatorNames,
  ConventionDto,
  displayEmergencyContactInfos,
  expectToEqual,
  Signatory,
  TemplatedEmail,
} from "shared";
import { AppConfig } from "../adapters/primary/config/appConfig";
import { ShortLinkId } from "../domain/core/ports/ShortLinkQuery";
import { makeShortLinkUrl } from "../domain/core/ShortLink";

export const expectEmailSignatoryConfirmationSignatureRequestMatchingConvention =
  ({
    templatedEmail,
    convention,
    signatory,
    recipient,
    agency,
    conventionStatusLinkId,
    conventionToSignLinkId,
    config,
  }: {
    config: AppConfig;
    templatedEmail: TemplatedEmail;
    convention: ConventionDto;
    signatory: Signatory;
    recipient: string;
    now: Date;
    agency: AgencyDto;
    conventionToSignLinkId: ShortLinkId;
    conventionStatusLinkId: ShortLinkId;
  }) => {
    const { businessName } = convention;
    const {
      beneficiary,
      establishmentRepresentative,
      beneficiaryRepresentative,
      beneficiaryCurrentEmployer,
    } = convention.signatories;

    expectToEqual(templatedEmail, {
      kind: "NEW_CONVENTION_CONFIRMATION_REQUEST_SIGNATURE",
      recipients: [recipient],
      params: {
        conventionId: convention.id,
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
        conventionSignShortlink: makeShortLinkUrl(
          config,
          conventionToSignLinkId,
        ),
        conventionStatusLink: makeShortLinkUrl(config, conventionStatusLinkId),
        businessName,
        agencyLogoUrl: agency.logoUrl,
      },
    });
  };

export const expectEmailFinalValidationConfirmationMatchingConvention = (
  recipients: string[],
  templatedEmails: TemplatedEmail,
  agency: AgencyDto,
  convention: ConventionDto,
  config: AppConfig,
  conventionToSignLinkId: ShortLinkId,
) =>
  expectToEqual(templatedEmails, {
    kind: "VALIDATED_CONVENTION_FINAL_CONFIRMATION",
    recipients,
    params: {
      conventionId: convention.id,
      internshipKind: convention.internshipKind,
      beneficiaryFirstName: convention.signatories.beneficiary.firstName,
      beneficiaryLastName: convention.signatories.beneficiary.lastName,
      beneficiaryBirthdate: convention.signatories.beneficiary.birthdate,
      dateStart: parseISO(convention.dateStart).toLocaleDateString("fr"),
      dateEnd: parseISO(convention.dateEnd).toLocaleDateString("fr"),
      establishmentTutorName: `${convention.establishmentTutor.firstName} ${convention.establishmentTutor.lastName}`,
      businessName: convention.businessName,
      immersionAppellationLabel:
        convention.immersionAppellation.appellationLabel,
      emergencyContactInfos: displayEmergencyContactInfos({
        beneficiaryRepresentative:
          convention.signatories.beneficiaryRepresentative,
        beneficiary: convention.signatories.beneficiary,
      }),
      agencyLogoUrl: agency.logoUrl,
      magicLink: makeShortLinkUrl(config, conventionToSignLinkId),
      validatorName: convention.validators?.agencyValidator
        ? concatValidatorNames(convention.validators?.agencyValidator)
        : "",
      agencyAssessmentDocumentLink: agency.questionnaireUrl,
    },
  });

export const expectNotifyConventionRejected = (
  templatedEmail: TemplatedEmail,
  recipients: string[],
  convention: ConventionDto,
  agency: AgencyDto,
) => {
  expectToEqual(templatedEmail, {
    kind: "REJECTED_CONVENTION_NOTIFICATION",
    recipients,
    params: {
      agencyName: agency.name,
      conventionId: convention.id,
      internshipKind: convention.internshipKind,
      beneficiaryFirstName: convention.signatories.beneficiary.firstName,
      beneficiaryLastName: convention.signatories.beneficiary.lastName,
      businessName: convention.businessName,
      rejectionReason: convention.statusJustification || "",
      signature: agency.signature,
      immersionProfession: convention.immersionAppellation.appellationLabel,
      agencyLogoUrl: agency.logoUrl,
    },
  });
};

export const expectNotifyConventionCancelled = (
  templatedEmail: TemplatedEmail,
  recipients: string[],
  convention: ConventionDto,
  agency: AgencyDto,
) => {
  expectToEqual(templatedEmail, {
    kind: "CANCELLED_CONVENTION_NOTIFICATION",
    recipients,
    params: {
      agencyName: agency.name,
      conventionId: convention.id,
      internshipKind: convention.internshipKind,
      beneficiaryFirstName: convention.signatories.beneficiary.firstName,
      beneficiaryLastName: convention.signatories.beneficiary.lastName,
      businessName: convention.businessName,
      signature: agency.signature,
      immersionProfession: convention.immersionAppellation.appellationLabel,
      agencyLogoUrl: agency.logoUrl,
      dateStart: convention.dateStart,
      dateEnd: convention.dateEnd,
    },
  });
};

export const expectNotifyConventionIsDeprecated = (
  templatedEmail: TemplatedEmail,
  recipients: string[],
  convention: ConventionDto,
) => {
  expectToEqual(templatedEmail, {
    kind: "DEPRECATED_CONVENTION_NOTIFICATION",
    recipients,
    params: {
      conventionId: convention.id,
      internshipKind: convention.internshipKind,
      beneficiaryFirstName: convention.signatories.beneficiary.firstName,
      beneficiaryLastName: convention.signatories.beneficiary.lastName,
      businessName: convention.businessName,
      deprecationReason: convention.statusJustification || "",
      immersionProfession: convention.immersionAppellation.appellationLabel,
      dateEnd: convention.dateEnd,
      dateStart: convention.dateStart,
    },
  });
};
