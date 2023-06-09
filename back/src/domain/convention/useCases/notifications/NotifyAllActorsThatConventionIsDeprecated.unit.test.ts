import {
  AgencyDto,
  AgencyDtoBuilder,
  BeneficiaryCurrentEmployer,
  BeneficiaryRepresentative,
  ConventionDtoBuilder,
} from "shared";
import { EmailNotification } from "shared/src/notifications/notifications.dto";
import { expectNotifyBeneficiaryAndEnterpriseThatConventionIsDeprecated } from "../../../../_testBuilders/emailAssertions";
import {
  createInMemoryUow,
  InMemoryUnitOfWork,
} from "../../../../adapters/primary/config/uowConfig";
import { CustomTimeGateway } from "../../../../adapters/secondary/core/TimeGateway/CustomTimeGateway";
import { UuidV4Generator } from "../../../../adapters/secondary/core/UuidGeneratorImplementations";
import { InMemoryUowPerformer } from "../../../../adapters/secondary/InMemoryUowPerformer";
import { makeSaveNotificationAndRelatedEvent } from "../../../generic/notifications/entities/Notification";
import { NotifyAllActorsThatConventionIsDeprecated } from "./NotifyAllActorsThatConventionIsDeprecated";

const beneficiaryRepresentative: BeneficiaryRepresentative = {
  role: "beneficiary-representative",
  email: "legal@representative.com",
  firstName: "The",
  lastName: "Representative",
  phone: "1234567",
};

const beneficiaryCurrentEmployer: BeneficiaryCurrentEmployer = {
  firstName: "ali",
  lastName: "baba",
  businessName: "business",
  businessSiret: "01234567890123",
  email: "beneficiary-current-employer@gmail.com",
  job: "job",
  phone: "0011223344",
  role: "beneficiary-current-employer",
  signedAt: new Date().toISOString(),
  businessAddress: "Rue des Bouchers 67065 Strasbourg",
};

const deprecatedConvention = new ConventionDtoBuilder()
  .withStatus("DEPRECATED")
  .withStatusJustification("test-deprecation-justification")
  .withBeneficiaryRepresentative(beneficiaryRepresentative)
  .withBeneficiaryCurrentEmployer(beneficiaryCurrentEmployer)
  .build();

const counsellorEmails = ["counsellor1@email.fr", "counsellor2@email.fr"];

const validatorEmails = ["validator@gmail.com"];

const defaultAgency = AgencyDtoBuilder.create(deprecatedConvention.agencyId)
  .withName("test-agency-name")
  .withCounsellorEmails(counsellorEmails)
  .withValidatorEmails(validatorEmails)
  .build();

describe("NotifyAllActorsThatApplicationIsDeprecated", () => {
  let useCase: NotifyAllActorsThatConventionIsDeprecated;
  let agency: AgencyDto;
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
    useCase = new NotifyAllActorsThatConventionIsDeprecated(
      new InMemoryUowPerformer(uow),
      saveNotificationAndRelatedEvent,
    );
  });

  it("Sends a conevention deprecated notification to all actors", async () => {
    await useCase.execute(deprecatedConvention);

    const templatedEmailsSent = uow.notificationRepository.notifications
      .filter((notif): notif is EmailNotification => notif.kind === "email")
      .map((notif) => notif.templatedContent);

    expect(templatedEmailsSent).toHaveLength(1);

    expectNotifyBeneficiaryAndEnterpriseThatConventionIsDeprecated(
      templatedEmailsSent[0],
      [
        deprecatedConvention.signatories.beneficiary.email,
        deprecatedConvention.signatories.establishmentRepresentative.email,
        ...counsellorEmails,
        ...validatorEmails,
        deprecatedConvention.signatories.beneficiaryCurrentEmployer!.email,
        deprecatedConvention.signatories.beneficiaryRepresentative!.email,
      ],
      deprecatedConvention,
    );
  });
});
