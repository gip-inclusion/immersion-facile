import { parseISO } from "date-fns";
import {
  AgencyDto,
  ConventionDto,
  displayEmergencyContactInfos,
  EmailParamsByEmailType,
  expectToEqual,
  Signatory,
  TemplatedEmail,
} from "shared";
import { AppConfig } from "../adapters/primary/config/appConfig";
import { ShortLinkId } from "../domain/core/ports/ShortLinkQuery";
import { makeShortLinkUrl } from "../domain/core/ShortLink";

// TODO: we should use hardcoded values instead of relying on the getValidatedConventionFinalConfirmationParams
export const getValidatedConventionFinalConfirmationParams = (
  agency: AgencyDto,
  convention: ConventionDto,
  config: AppConfig,
  conventionDocumentShortlinkId: ShortLinkId,
): EmailParamsByEmailType["VALIDATED_CONVENTION_FINAL_CONFIRMATION"] => {
  const { beneficiary, beneficiaryRepresentative } = convention.signatories;
  return {
    internshipKind: convention.internshipKind,

    beneficiaryFirstName: beneficiary.firstName,
    beneficiaryLastName: beneficiary.lastName,
    beneficiaryBirthdate: beneficiary.birthdate,

    dateStart: parseISO(convention.dateStart).toLocaleDateString("fr"),
    dateEnd: parseISO(convention.dateEnd).toLocaleDateString("fr"),
    establishmentTutorName: `${convention.establishmentTutor.firstName} ${convention.establishmentTutor.lastName}`,
    businessName: convention.businessName,
    immersionAppellationLabel: convention.immersionAppellation.appellationLabel,

    emergencyContactInfos: displayEmergencyContactInfos({
      beneficiaryRepresentative,
      beneficiary,
    }),
    agencyLogoUrl: agency.logoUrl,
    magicLink: makeShortLinkUrl(config, conventionDocumentShortlinkId),
  };
};

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
        magicLink: makeShortLinkUrl(config, conventionToSignLinkId),
        conventionStatusLink: makeShortLinkUrl(config, conventionStatusLinkId),
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
  config: AppConfig,
  conventionToSignLinkId: ShortLinkId,
) =>
  expectToEqual(templatedEmails, [
    {
      type: "VALIDATED_CONVENTION_FINAL_CONFIRMATION",
      recipients,
      params: getValidatedConventionFinalConfirmationParams(
        agency,
        convention,
        config,
        conventionToSignLinkId,
      ),
    },
  ]);

export const expectNotifyBeneficiaryAndEnterpriseThatApplicationIsRejected = (
  templatedEmail: TemplatedEmail,
  recipients: string[],
  convention: ConventionDto,
  agency: AgencyDto,
) => {
  expectToEqual(templatedEmail, {
    type: "REJECTED_CONVENTION_NOTIFICATION",
    recipients,
    params: {
      internshipKind: convention.internshipKind,
      beneficiaryFirstName: convention.signatories.beneficiary.firstName,
      beneficiaryLastName: convention.signatories.beneficiary.lastName,
      businessName: convention.businessName,
      rejectionReason: convention.statusJustification || "",
      signature: agency.signature,
      agency: agency.name,
      immersionProfession: convention.immersionAppellation.appellationLabel,
      agencyLogoUrl: agency.logoUrl,
    },
  });
};

export const expectNotifyBeneficiaryAndEnterpriseThatConventionIsDeprecated = (
  templatedEmail: TemplatedEmail,
  recipients: string[],
  convention: ConventionDto,
) => {
  expectToEqual(templatedEmail, {
    type: "DEPRECATED_CONVENTION_NOTIFICATION",
    recipients,
    params: {
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
