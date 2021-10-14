import { TemplatedEmail } from "../adapters/secondary/InMemoryEmailGateway";
import { AgencyConfig } from "../domain/immersionApplication/ports/AgencyRepository";
import { getValidatedApplicationFinalConfirmationParams } from "../domain/immersionApplication/useCases/notifications/NotifyAllActorsOfFinalApplicationValidation";
import { agencyCodes } from "../shared/agencies";
import { ImmersionApplicationDto } from "../shared/ImmersionApplicationDto";

export const expectEmailAdminNotificationMatchingImmersionApplication = (
  templatedEmail: TemplatedEmail,
  params: {
    recipients: string[];
    immersionApplication: ImmersionApplicationDto;
  },
) => {
  const { recipients, immersionApplication } = params;
  const {
    id,
    firstName,
    lastName,
    dateStart,
    dateEnd,
    businessName,
    agencyCode,
  } = immersionApplication;

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
      agencyName: agencyCodes[agencyCode],
    },
  });
};

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
  signature: string,
) => {
  expectTemplatedEmailToEqual(templatedEmail, {
    type: "REJECTED_APPLICATION_NOTIFICATION",
    recipients,
    params: {
      beneficiaryFirstName: dto.firstName,
      beneficiaryLastName: dto.lastName,
      businessName: dto.businessName,
      rejectionReason: dto.rejectionJustification || "",
      signature,
      agency: agencyCodes[dto.agencyCode],
      immersionProfession: dto.immersionProfession,
    },
  });
};

const expectTemplatedEmailToEqual = (
  email: TemplatedEmail,
  expected: TemplatedEmail,
) => {
  expect(email).toEqual(expected);
};
