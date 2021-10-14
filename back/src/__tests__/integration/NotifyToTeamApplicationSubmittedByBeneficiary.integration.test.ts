import { InMemoryAgencyRepository } from "../../adapters/secondary/InMemoryAgencyRepository";
import { SendinblueEmailGateway } from "../../adapters/secondary/SendinblueEmailGateway";
import { NotifyToTeamApplicationSubmittedByBeneficiary } from "../../domain/immersionApplication/useCases/notifications/NotifyToTeamApplicationSubmittedByBeneficiary";
import { AgencyCode } from "../../shared/agencies";
import { ImmersionApplicationDtoBuilder } from "../../_testBuilders/ImmersionApplicationDtoBuilder";

const validDemandeImmersion = new ImmersionApplicationDtoBuilder()
  .withEmail("jean-francois.macresy@beta.gouv.fr")
  .withMentorEmail("jean-francois.macresy+mentor@beta.gouv.fr")
  .build();

const counsellorEmail = "jean-francois.macresy@beta.gouv.fr";

describe("NotifyToTeamApplicationSubmittedByBeneficiary", () => {
  let emailGw: SendinblueEmailGateway;
  let allowList: Set<string>;
  let unrestrictedEmailSendingAgencies: Set<AgencyCode>;
  let counsellorEmails: Record<AgencyCode, string[]>;
  let notifyToTeamApplicationSubmittedByBeneficiary: NotifyToTeamApplicationSubmittedByBeneficiary;
  let agencyRepo: InMemoryAgencyRepository;

  beforeEach(() => {
    if (!process.env.SENDINBLUE_API_KEY) {
      throw new Error(
        "Test requires a valid SENDINBLUE_API_KEY environment variable.",
      );
    }
    emailGw = SendinblueEmailGateway.create(process.env.SENDINBLUE_API_KEY);
    allowList = new Set();
    unrestrictedEmailSendingAgencies = new Set();
    counsellorEmails = {} as Record<AgencyCode, string[]>;
    notifyToTeamApplicationSubmittedByBeneficiary =
      new NotifyToTeamApplicationSubmittedByBeneficiary(emailGw, agencyRepo);
  });

  test.skip("Sends no emails when allowList and unrestrictedEmailSendingAgencies is empty", async () => {
    counsellorEmails[validDemandeImmersion.agencyCode] = [counsellorEmail];
    unrestrictedEmailSendingAgencies.add(validDemandeImmersion.agencyCode);

    validDemandeImmersion.mentorEmail = "jeanfrancois.macresy@gmail.com";
    validDemandeImmersion.email = "jeanfrancois.macresy+beneficiary@gmail.com";

    allowList.add(validDemandeImmersion.mentorEmail);
    allowList.add(validDemandeImmersion.email);
    allowList.add(counsellorEmail);

    await notifyToTeamApplicationSubmittedByBeneficiary.execute(
      validDemandeImmersion,
    );
  });
});
