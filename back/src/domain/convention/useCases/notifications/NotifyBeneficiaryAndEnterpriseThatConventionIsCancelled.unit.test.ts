import { AgencyDto, AgencyDtoBuilder, ConventionDtoBuilder } from "shared";
import { EmailNotification } from "shared";
import { expectNotifyBeneficiaryAndEnterpriseThatConventionIsCancelled } from "../../../../_testBuilders/emailAssertions";
import {
  createInMemoryUow,
  InMemoryUnitOfWork,
} from "../../../../adapters/primary/config/uowConfig";
import { CustomTimeGateway } from "../../../../adapters/secondary/core/TimeGateway/CustomTimeGateway";
import { UuidV4Generator } from "../../../../adapters/secondary/core/UuidGeneratorImplementations";
import { InMemoryUowPerformer } from "../../../../adapters/secondary/InMemoryUowPerformer";
import { makeSaveNotificationAndRelatedEvent } from "../../../generic/notifications/entities/Notification";
import { NotifyBeneficiaryAndEnterpriseThatConventionIsCancelled } from "./NotifyBeneficiaryAndEnterpriseThatConventionIsCancelled";

const cancelledConvention = new ConventionDtoBuilder()
  .withStatus("CANCELLED")
  .build();
const counsellorEmails = ["counsellor1@email.fr", "counsellor2@email.fr"];
const signature = "test-signature";

const defaultAgency = AgencyDtoBuilder.create(cancelledConvention.agencyId)
  .withName("test-agency-name")
  .withCounsellorEmails(counsellorEmails)
  .withSignature(signature)
  .build();

describe("NotifyBeneficiaryAndEnterpriseThatApplicationIsCancelled", () => {
  let agency: AgencyDto;
  let useCase: NotifyBeneficiaryAndEnterpriseThatConventionIsCancelled;
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

    useCase = new NotifyBeneficiaryAndEnterpriseThatConventionIsCancelled(
      new InMemoryUowPerformer(uow),
      saveNotificationAndRelatedEvent,
    );
  });

  it("Sends rejection email to beneficiary, establishment tutor, and counsellor", async () => {
    await useCase.execute(cancelledConvention);

    const templatedEmailsSent = uow.notificationRepository.notifications
      .filter((notif): notif is EmailNotification => notif.kind === "email")
      .map((notif) => notif.templatedContent);

    expect(templatedEmailsSent).toHaveLength(1);

    expectNotifyBeneficiaryAndEnterpriseThatConventionIsCancelled(
      templatedEmailsSent[0],
      [
        cancelledConvention.signatories.beneficiary.email,
        cancelledConvention.signatories.establishmentRepresentative.email,
        ...counsellorEmails,
      ],
      cancelledConvention,
      agency,
    );
  });
});
