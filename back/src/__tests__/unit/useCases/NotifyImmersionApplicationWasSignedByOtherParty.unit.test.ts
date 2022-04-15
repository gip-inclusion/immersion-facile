import { ImmersionApplicationDtoBuilder } from "../../../_testBuilders/ImmersionApplicationDtoBuilder";
import {
  expectTypeToMatchAndEqual,
  fakeGenerateMagicLinkUrlFn,
} from "../../../_testBuilders/test.helpers";
import { AllowListEmailFilter } from "../../../adapters/secondary/core/EmailFilterImplementations";
import { InMemoryEmailGateway } from "../../../adapters/secondary/InMemoryEmailGateway";
import { SignedByOtherPartyNotificationParams } from "../../../domain/immersionApplication/ports/EmailGateway";
import { NotifyImmersionApplicationWasSignedByOtherParty } from "../../../domain/immersionApplication/useCases/notifications/NotifyImmersionApplicationWasSignedByOtherParty";
import { ImmersionApplicationDto } from "../../../shared/ImmersionApplication/ImmersionApplication.dto";
import { frontRoutes } from "../../../shared/routes";
import { Role } from "../../../shared/tokens/MagicLinkPayload";

const beneficiaryEmail = "beneficiary@mail.com";
const mentorEmail = "mentor@mail.com";

const immersionApplicationBuilder = new ImmersionApplicationDtoBuilder()
  .withFirstName("Benoit")
  .withLastName("Martin")
  .withMentor("Tom Tuteur")
  .withEmail(beneficiaryEmail)
  .withMentorEmail(mentorEmail)
  .notSigned();

describe("NotifyImmersionApplicationWasSignedByOtherParty", () => {
  let emailGateway: InMemoryEmailGateway;
  let notifySignedByOtherParty: NotifyImmersionApplicationWasSignedByOtherParty;

  beforeEach(() => {
    const emailFilter = new AllowListEmailFilter([
      beneficiaryEmail,
      mentorEmail,
    ]);
    emailGateway = new InMemoryEmailGateway();

    notifySignedByOtherParty =
      new NotifyImmersionApplicationWasSignedByOtherParty(
        emailFilter,
        emailGateway,
        fakeGenerateMagicLinkUrlFn,
      );
  });

  it("should send an email to the establishment notifying that the beneficiary signed", async () => {
    const immersionApplicationSignedByBeneficiary = immersionApplicationBuilder
      .signedByBeneficiary()
      .build();

    await notifySignedByOtherParty.execute(
      immersionApplicationSignedByBeneficiary,
    );

    expectEmailSentToOtherParty(immersionApplicationSignedByBeneficiary, {
      recipientRole: "establishment",
      recipientEmail: mentorEmail,
      existingSignatureName: "Benoit MARTIN",
    });
  });

  it("should send an email to the beneficiary notifying that the establishment signed", async () => {
    const immersionApplicationSignedByEstablishment =
      immersionApplicationBuilder.signedByEnterprise().build();

    await notifySignedByOtherParty.execute(
      immersionApplicationSignedByEstablishment,
    );

    expectEmailSentToOtherParty(immersionApplicationSignedByEstablishment, {
      recipientRole: "beneficiary",
      recipientEmail: beneficiaryEmail,
      existingSignatureName: immersionApplicationSignedByEstablishment.mentor,
    });
  });

  const expectEmailSentToOtherParty = (
    application: ImmersionApplicationDto,
    {
      existingSignatureName,
      recipientEmail,
      recipientRole,
    }: {
      existingSignatureName: string;
      recipientEmail: string;
      recipientRole: Role;
    },
  ) => {
    const params: SignedByOtherPartyNotificationParams = {
      beneficiaryFirstName: application.firstName,
      beneficiaryLastName: application.lastName,
      existingSignatureName,
      immersionProfession: application.immersionAppellation.appellationLabel,
      magicLink: fakeGenerateMagicLinkUrlFn(
        application.id,
        recipientRole,
        frontRoutes.immersionApplicationsToSign,
        mentorEmail,
      ),
      mentor: application.mentor,
      businessName: application.businessName,
    };

    expectTypeToMatchAndEqual(emailGateway.getSentEmails(), [
      {
        type: "BENEFICIARY_OR_MENTOR_ALREADY_SIGNED_NOTIFICATION",
        recipients: [recipientEmail],
        params,
        cc: [],
      },
    ]);
  };
});
