import { AgencyDto, AgencyDtoBuilder, ConventionDtoBuilder } from "shared";
import { expectNotifyBeneficiaryAndEnterpriseThatApplicationIsRejected } from "../../../../_testBuilders/emailAssertions";
import { createInMemoryUow } from "../../../../adapters/primary/config/uowConfig";
import { InMemoryUowPerformer } from "../../../../adapters/secondary/InMemoryUowPerformer";
import { InMemoryNotificationGateway } from "../../../../adapters/secondary/notificationGateway/InMemoryNotificationGateway";
import { NotifyBeneficiaryAndEnterpriseThatApplicationIsRejected } from "./NotifyBeneficiaryAndEnterpriseThatApplicationIsRejected";

const rejectedConvention = new ConventionDtoBuilder()
  .withStatus("REJECTED")
  .withStatusJustification("test-rejection-justification")
  .build();
const counsellorEmails = ["counsellor1@email.fr", "counsellor2@email.fr"];
const signature = "test-signature";

const defaultAgency = AgencyDtoBuilder.create(rejectedConvention.agencyId)
  .withName("test-agency-name")
  .withCounsellorEmails(counsellorEmails)
  .withSignature(signature)
  .build();

describe("NotifyBeneficiaryAndEnterpriseThatApplicationIsRejected", () => {
  let notificationGateway: InMemoryNotificationGateway;
  let agency: AgencyDto;

  beforeEach(() => {
    agency = defaultAgency;
    notificationGateway = new InMemoryNotificationGateway();
  });

  const createUseCase = () => {
    const uow = createInMemoryUow();
    uow.agencyRepository.setAgencies([agency]);
    return new NotifyBeneficiaryAndEnterpriseThatApplicationIsRejected(
      new InMemoryUowPerformer(uow),
      notificationGateway,
    );
  };

  it("Sends rejection email to beneficiary, establishment tutor, and counsellor", async () => {
    await createUseCase().execute(rejectedConvention);

    const sentEmails = notificationGateway.getSentEmails();
    expect(sentEmails).toHaveLength(1);

    expectNotifyBeneficiaryAndEnterpriseThatApplicationIsRejected(
      sentEmails[0],
      [
        rejectedConvention.signatories.beneficiary.email,
        rejectedConvention.signatories.establishmentRepresentative.email,
        ...counsellorEmails,
      ],
      rejectedConvention,
      agency,
    );
  });
});
