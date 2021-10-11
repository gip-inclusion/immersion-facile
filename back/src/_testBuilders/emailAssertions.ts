import { TemplatedEmail } from "../adapters/secondary/InMemoryEmailGateway";
import { AgencyConfig } from "../domain/immersionApplication/ports/AgencyConfigRepository";
import { getValidatedApplicationFinalConfirmationParams } from "../domain/immersionApplication/useCases/notifications/NotifyAllActorsOfFinalApplicationValidation";
import { ImmersionApplicationDto } from "../shared/ImmersionApplicationDto";

export const expectEmailAdminNotificationMatchingImmersionApplication = (
  email: TemplatedEmail,
  params: {
    recipients: string[];
    immersionApplication: ImmersionApplicationDto;
  },
) => {
  const { recipients, immersionApplication } = params;
  const { id, firstName, lastName, dateStart, dateEnd, businessName } =
    immersionApplication;

  expect(email).toEqual({
    type: "NEW_APPLICATION_ADMIN_NOTIFICATION",
    recipients: recipients,
    params: {
      demandeId: id,
      firstName,
      lastName,
      dateStart,
      dateEnd,
      businessName,
    },
  });
};

export const expectEmailBeneficiaryConfirmationMatchingImmersionApplication = (
  templatedEmail: TemplatedEmail,
  immersionApplication: ImmersionApplicationDto,
) => {
  const { email, id, firstName, lastName } = immersionApplication;

  expect(templatedEmail).toEqual({
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

  expect(templatedEmail).toEqual({
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
    expect(templatedEmail).toEqual({
      type: "VALIDATED_APPLICATION_FINAL_CONFIRMATION",
      recipients,
      params: getValidatedApplicationFinalConfirmationParams(
        agencyConfig,
        immersionApplication,
      ),
    });
  };
