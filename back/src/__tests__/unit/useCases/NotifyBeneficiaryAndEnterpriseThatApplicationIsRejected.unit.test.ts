import { AgencyDto, AgencyDtoBuilder, ConventionDtoBuilder } from "shared";
import { expectNotifyBeneficiaryAndEnterpriseThatApplicationIsRejected } from "../../../_testBuilders/emailAssertions";
import { createInMemoryUow } from "../../../adapters/primary/config/uowConfig";
import { InMemoryEmailGateway } from "../../../adapters/secondary/emailGateway/InMemoryEmailGateway";
import { InMemoryUowPerformer } from "../../../adapters/secondary/InMemoryUowPerformer";
import { NotifyBeneficiaryAndEnterpriseThatApplicationIsRejected } from "../../../domain/convention/useCases/notifications/NotifyBeneficiaryAndEnterpriseThatApplicationIsRejected";

const rejectedConvention = new ConventionDtoBuilder()
  .withStatus("REJECTED")
  .withRejectionJustification("test-rejection-justification")
  .build();
const counsellorEmails = ["counsellor1@email.fr", "counsellor2@email.fr"];
const signature = "test-signature";

const defaultAgency = AgencyDtoBuilder.create(rejectedConvention.agencyId)
  .withName("test-agency-name")
  .withCounsellorEmails(counsellorEmails)
  .withSignature(signature)
  .build();

describe("NotifyBeneficiaryAndEnterpriseThatApplicationIsRejected", () => {
  let emailGw: InMemoryEmailGateway;
  let agency: AgencyDto;

  beforeEach(() => {
    agency = defaultAgency;
    emailGw = new InMemoryEmailGateway();
  });

  const createUseCase = () => {
    const uow = createInMemoryUow();
    uow.agencyRepository.setAgencies([agency]);
    return new NotifyBeneficiaryAndEnterpriseThatApplicationIsRejected(
      new InMemoryUowPerformer(uow),
      emailGw,
    );
  };

  it("Sends rejection email to beneficiary, establishment tutor, and counsellor", async () => {
    await createUseCase().execute(rejectedConvention);

    const sentEmails = emailGw.getSentEmails();
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
