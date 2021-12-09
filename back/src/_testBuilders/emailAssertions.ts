import { TemplatedEmail } from "../adapters/secondary/InMemoryEmailGateway";
import { getValidatedApplicationFinalConfirmationParams } from "../domain/immersionApplication/useCases/notifications/NotifyAllActorsOfFinalApplicationValidation";
import { FormEstablishmentDto } from "../shared/FormEstablishmentDto";
import { ImmersionApplicationDto } from "../shared/ImmersionApplicationDto";
import { frontRoutes } from "../shared/routes";
import { AgencyConfig } from "./../domain/immersionApplication/ports/AgencyRepository";
import { fakeGenerateMagicLinkUrlFn } from "./test.helpers";

export const expectEmailAdminNotificationMatchingImmersionApplication = (
  templatedEmail: TemplatedEmail,
  params: {
    recipients: string[];
    immersionApplication: ImmersionApplicationDto;
    magicLink: string;
    agencyConfig: AgencyConfig;
  },
) => {
  const { recipients, immersionApplication, magicLink, agencyConfig } = params;
  const { id, firstName, lastName, dateStart, dateEnd, businessName } =
    immersionApplication;

  expectTemplatedEmailToEqual(templatedEmail, {
    type: "NEW_APPLICATION_ADMIN_NOTIFICATION",
    recipients: recipients,
    params: {
      demandeId: id,
      firstName,
      lastName,
      dateStart,
      dateEnd,
      businessName,
      agencyName: agencyConfig.name,
      magicLink,
    },
  });
};

// Remove when enableEnterpriseSignatures is default
export const expectEmailBeneficiaryConfirmationMatchingImmersionApplication = (
  templatedEmail: TemplatedEmail,
  immersionApplication: ImmersionApplicationDto,
) => {
  const { email, id, firstName, lastName } = immersionApplication;

  expectTemplatedEmailToEqual(templatedEmail, {
    type: "NEW_APPLICATION_BENEFICIARY_CONFIRMATION",
    recipients: [email],
    params: {
      demandeId: id,
      firstName,
      lastName,
    },
  });
};

export const expectEmailBeneficiaryConfirmationSignatureRequestMatchingImmersionApplication =
  (
    templatedEmail: TemplatedEmail,
    immersionApplication: ImmersionApplicationDto,
  ) => {
    const { email, id, firstName, lastName, businessName } =
      immersionApplication;

    expectTemplatedEmailToEqual(templatedEmail, {
      type: "NEW_APPLICATION_BENEFICIARY_CONFIRMATION_REQUEST_SIGNATURE",
      recipients: [email],
      params: {
        beneficiaryFirstName: firstName,
        beneficiaryLastName: lastName,
        magicLink: fakeGenerateMagicLinkUrlFn(
          id,
          "beneficiary",
          frontRoutes.immersionApplicationsToSign,
        ),
        businessName,
      },
    });
  };

// Remove when enableEnterpriseSignatures is default
export const expectEmailMentorConfirmationMatchingImmersionApplication = (
  templatedEmail: TemplatedEmail,
  immersionApplication: ImmersionApplicationDto,
) => {
  const { id, mentor, mentorEmail, firstName, lastName } = immersionApplication;

  expectTemplatedEmailToEqual(templatedEmail, {
    type: "NEW_APPLICATION_MENTOR_CONFIRMATION",
    recipients: [mentorEmail],
    params: {
      demandeId: id,
      mentorName: mentor,
      beneficiaryFirstName: firstName,
      beneficiaryLastName: lastName,
    },
  });
};

export const expectEmailMentorConfirmationSignatureRequesMatchingImmersionApplication =
  (
    templatedEmail: TemplatedEmail,
    immersionApplication: ImmersionApplicationDto,
  ) => {
    const { id, mentor, mentorEmail, firstName, lastName, businessName } =
      immersionApplication;

    expectTemplatedEmailToEqual(templatedEmail, {
      type: "NEW_APPLICATION_MENTOR_CONFIRMATION_REQUEST_SIGNATURE",
      recipients: [mentorEmail],
      params: {
        mentorName: mentor,
        beneficiaryFirstName: firstName,
        beneficiaryLastName: lastName,
        magicLink: fakeGenerateMagicLinkUrlFn(
          id,
          "establishment",
          frontRoutes.immersionApplicationsToSign,
        ),
        businessName,
      },
    });
  };

export const expectEmailFinalValidationConfirmationMatchingImmersionApplication =
  (
    recipients: string[],
    templatedEmail: TemplatedEmail,
    agencyConfig: AgencyConfig | undefined,
    immersionApplication: ImmersionApplicationDto,
  ) => {
    if (!agencyConfig) {
      fail("missing agency config");
    }
    expectTemplatedEmailToEqual(templatedEmail, {
      type: "VALIDATED_APPLICATION_FINAL_CONFIRMATION",
      recipients,
      params: getValidatedApplicationFinalConfirmationParams(
        agencyConfig,
        immersionApplication,
      ),
    });
  };

export const expectedEmailEstablisentCreatedReviewMatchingEstablisment = (
  templatedEmail: TemplatedEmail,
  establishmentDto: FormEstablishmentDto,
) => {
  expectTemplatedEmailToEqual(templatedEmail, {
    type: "NEW_ESTABLISHMENT_CREATED_CONTACT_CONFIRMATION",
    recipients: [establishmentDto.businessContacts[0].email],
    params: { establishmentDto },
  });
};

export const expectedEmailImmersionApplicationReviewMatchingImmersionApplication =
  (
    templatedEmail: TemplatedEmail,
    recipients: string[],
    agencyConfig: AgencyConfig | undefined,
    immersionApplication: ImmersionApplicationDto,
    magicLink: string,
    possibleRoleAction: string,
  ) => {
    if (!agencyConfig) {
      fail("missing agency config");
    }
    expectTemplatedEmailToEqual(templatedEmail, {
      type: "NEW_APPLICATION_REVIEW_FOR_ELIGIBILITY_OR_VALIDATION",
      recipients,
      params: {
        beneficiaryFirstName: immersionApplication.firstName,
        beneficiaryLastName: immersionApplication.lastName,
        businessName: immersionApplication.businessName,
        magicLink,
        possibleRoleAction,
      },
    });
  };

export const expectNotifyBeneficiaryAndEnterpriseThatApplicationIsRejected = (
  templatedEmail: TemplatedEmail,
  recipients: string[],
  dto: ImmersionApplicationDto,
  agencyConfig: AgencyConfig,
) => {
  expectTemplatedEmailToEqual(templatedEmail, {
    type: "REJECTED_APPLICATION_NOTIFICATION",
    recipients,
    params: {
      beneficiaryFirstName: dto.firstName,
      beneficiaryLastName: dto.lastName,
      businessName: dto.businessName,
      rejectionReason: dto.rejectionJustification || "",
      signature: agencyConfig.signature,
      agency: agencyConfig.name,
      immersionProfession: dto.immersionProfession,
    },
  });
};

export const expectNotifyBeneficiaryAndEnterpriseThatApplicationModificationIsRequested =
  (
    templatedEmail: TemplatedEmail,
    recipients: string[],
    dto: ImmersionApplicationDto,
    agencyConfig: AgencyConfig,
    reason: string,
  ) => {
    expectTemplatedEmailToEqual(templatedEmail, {
      type: "MODIFICATION_REQUEST_APPLICATION_NOTIFICATION",
      recipients,
      params: {
        beneficiaryFirstName: dto.firstName,
        beneficiaryLastName: dto.lastName,
        businessName: dto.businessName,
        reason,
        signature: agencyConfig.signature,
        agency: agencyConfig.name,
        immersionProfession: dto.immersionProfession,
      },
    });
  };

export const expectEmailMatchingLinkRenewalEmail = (
  templatedEmail: TemplatedEmail,
  recipients: string[],
  magicLink: string,
) => {
  expectTemplatedEmailToEqual(templatedEmail, {
    type: "MAGIC_LINK_RENEWAL",
    recipients,
    params: {
      magicLink,
    },
  });
};

const expectTemplatedEmailToEqual = (
  email: TemplatedEmail,
  expected: TemplatedEmail,
) => {
  expect(email).toEqual(expected);
};
