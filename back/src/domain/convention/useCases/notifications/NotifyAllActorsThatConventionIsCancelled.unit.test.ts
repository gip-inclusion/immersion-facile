import {
  AgencyDto,
  AgencyDtoBuilder,
  BeneficiaryCurrentEmployer,
  BeneficiaryRepresentative,
  ConventionDtoBuilder,
} from "shared";
import { EmailNotification } from "shared";
import { expectNotifyConventionCancelled } from "../../../../_testBuilders/emailAssertions";
import {
  createInMemoryUow,
  InMemoryUnitOfWork,
} from "../../../../adapters/primary/config/uowConfig";
import { CustomTimeGateway } from "../../../../adapters/secondary/core/TimeGateway/CustomTimeGateway";
import { UuidV4Generator } from "../../../../adapters/secondary/core/UuidGeneratorImplementations";
import { InMemoryUowPerformer } from "../../../../adapters/secondary/InMemoryUowPerformer";
import { makeSaveNotificationAndRelatedEvent } from "../../../generic/notifications/entities/Notification";
import { NotifyAllActorsThatConventionIsCancelled } from "./NotifyAllActorsThatConventionIsCancelled";

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

const cancelledConvention = new ConventionDtoBuilder()
  .withStatus("CANCELLED")
  .withBeneficiaryRepresentative(beneficiaryRepresentative)
  .withBeneficiaryCurrentEmployer(beneficiaryCurrentEmployer)
  .build();

const cancelledConventionWithDuplicatedEmails = new ConventionDtoBuilder()
  .withStatus("CANCELLED")
  .withAgencyId("fakeAgencyId")
  .withBeneficiaryRepresentative(beneficiaryRepresentative)
  .withBeneficiaryCurrentEmployer(beneficiaryCurrentEmployer)
  .withEstablishmentRepresentativeEmail(
    "establishment-representative@gmail.com",
  )
  .withEstablishmentTutorEmail("establishment-representative@gmail.com")
  .build();

const counsellorEmails = ["counsellor1@email.fr", "counsellor2@email.fr"];
const signature = "test-signature";

const defaultAgency = AgencyDtoBuilder.create(cancelledConvention.agencyId)
  .withName("test-agency-name")
  .withCounsellorEmails(counsellorEmails)
  .withSignature(signature)
  .build();

const agencyWithSameEmailAdressForCounsellorAndValidator =
  AgencyDtoBuilder.create(cancelledConventionWithDuplicatedEmails.agencyId)
    .withName("duplicated-email-test-agency-name")
    .withCounsellorEmails(counsellorEmails)
    .withValidatorEmails(counsellorEmails)
    .withSignature(signature)
    .build();

describe("NotifyBeneficiaryAndEnterpriseThatApplicationIsCancelled", () => {
  let agency: AgencyDto;
  let useCase: NotifyAllActorsThatConventionIsCancelled;
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

    useCase = new NotifyAllActorsThatConventionIsCancelled(
      new InMemoryUowPerformer(uow),
      saveNotificationAndRelatedEvent,
    );
  });

  it("Sends cancelation email to beneficiary, establishment tutor, and counsellors, validor, beneficiary Representativ and beneficiary current employer", async () => {
    await useCase.execute(cancelledConvention);
    const {
      beneficiaryCurrentEmployer,
      beneficiary,
      establishmentRepresentative,
      beneficiaryRepresentative,
    } = cancelledConvention.signatories;

    const templatedEmailsSent = uow.notificationRepository.notifications
      .filter((notif): notif is EmailNotification => notif.kind === "email")
      .map((notif) => notif.templatedContent);

    expect(templatedEmailsSent).toHaveLength(1);

    expectNotifyConventionCancelled(
      templatedEmailsSent[0],
      [
        beneficiary.email,
        establishmentRepresentative.email,
        beneficiaryRepresentative!.email,
        beneficiaryCurrentEmployer!.email,
        ...counsellorEmails,
        ...agency.validatorEmails,
      ],
      cancelledConvention,
      agency,
    );
  });
  it("doesn't send duplicated emails if validator email is also in counsellor emails and establishment tutor email is the same as establishment representative", async () => {
    uow.agencyRepository.setAgencies([
      agencyWithSameEmailAdressForCounsellorAndValidator,
    ]);

    await useCase.execute(cancelledConventionWithDuplicatedEmails);

    const {
      beneficiaryCurrentEmployer,
      beneficiary,
      establishmentRepresentative,
      beneficiaryRepresentative,
    } = cancelledConventionWithDuplicatedEmails.signatories;

    const templatedEmailsSent = uow.notificationRepository.notifications
      .filter((notif): notif is EmailNotification => notif.kind === "email")
      .map((notif) => notif.templatedContent);

    expect(templatedEmailsSent).toHaveLength(1);

    expectNotifyConventionCancelled(
      templatedEmailsSent[0],
      [
        beneficiary.email,
        establishmentRepresentative.email,
        beneficiaryRepresentative!.email,
        beneficiaryCurrentEmployer!.email,
        ...agencyWithSameEmailAdressForCounsellorAndValidator.validatorEmails,
      ],
      cancelledConventionWithDuplicatedEmails,
      agencyWithSameEmailAdressForCounsellorAndValidator,
    );
  });
});
