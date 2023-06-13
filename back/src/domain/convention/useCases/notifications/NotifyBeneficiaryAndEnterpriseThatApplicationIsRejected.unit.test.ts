import { AgencyDto, AgencyDtoBuilder, ConventionDtoBuilder } from "shared";
import { EmailNotification } from "shared";
import { expectNotifyBeneficiaryAndEnterpriseThatApplicationIsRejected } from "../../../../_testBuilders/emailAssertions";
import {
  createInMemoryUow,
  InMemoryUnitOfWork,
} from "../../../../adapters/primary/config/uowConfig";
import { CustomTimeGateway } from "../../../../adapters/secondary/core/TimeGateway/CustomTimeGateway";
import { UuidV4Generator } from "../../../../adapters/secondary/core/UuidGeneratorImplementations";
import { InMemoryUowPerformer } from "../../../../adapters/secondary/InMemoryUowPerformer";
import { makeSaveNotificationAndRelatedEvent } from "../../../generic/notifications/entities/Notification";
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
  let agency: AgencyDto;
  let useCase: NotifyBeneficiaryAndEnterpriseThatApplicationIsRejected;
  let uow: InMemoryUnitOfWork;

  beforeEach(() => {
    agency = defaultAgency;
    uow = createInMemoryUow();
    uow.agencyRepository.setAgencies([agency]);

    const timeGateway = new CustomTimeGateway();
    const uuidGenerator = new UuidV4Generator();
    const saveNotificationAndRelatedEvent = makeSaveNotificationAndRelatedEvent(
      uuidGenerator,
      timeGateway,
    );

    useCase = new NotifyBeneficiaryAndEnterpriseThatApplicationIsRejected(
      new InMemoryUowPerformer(uow),
      saveNotificationAndRelatedEvent,
    );
  });

  it("Sends rejection email to beneficiary, establishment tutor, and counsellor", async () => {
    await useCase.execute(rejectedConvention);

    const templatedEmailsSent = uow.notificationRepository.notifications
      .filter((notif): notif is EmailNotification => notif.kind === "email")
      .map((notif) => notif.templatedContent);

    expect(templatedEmailsSent).toHaveLength(1);

    expectNotifyBeneficiaryAndEnterpriseThatApplicationIsRejected(
      templatedEmailsSent[0],
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
