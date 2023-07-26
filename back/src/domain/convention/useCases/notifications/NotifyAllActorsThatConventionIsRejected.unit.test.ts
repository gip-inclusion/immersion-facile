import {
  AgencyDto,
  AgencyDtoBuilder,
  BeneficiaryCurrentEmployer,
  BeneficiaryRepresentative,
  ConventionDtoBuilder,
} from "shared";
import { EmailNotification } from "shared";
import { expectNotifyConventionRejected } from "../../../../_testBuilders/emailAssertions";
import {
  createInMemoryUow,
  InMemoryUnitOfWork,
} from "../../../../adapters/primary/config/uowConfig";
import { CustomTimeGateway } from "../../../../adapters/secondary/core/TimeGateway/CustomTimeGateway";
import { UuidV4Generator } from "../../../../adapters/secondary/core/UuidGeneratorImplementations";
import { InMemoryUowPerformer } from "../../../../adapters/secondary/InMemoryUowPerformer";
import { makeSaveNotificationAndRelatedEvent } from "../../../generic/notifications/entities/Notification";
import { NotifyAllActorsThatConventionIsRejected } from "./NotifyAllActorsThatConventionIsRejected";
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
const rejectedConvention = new ConventionDtoBuilder()
  .withStatus("REJECTED")
  .withBeneficiaryRepresentative(beneficiaryRepresentative)
  .withBeneficiaryCurrentEmployer(beneficiaryCurrentEmployer)
  .withStatusJustification("test-rejection-justification")
  .build();

const rejectedConventionWithDuplicatedEmails = new ConventionDtoBuilder()
  .withStatus("REJECTED")
  .withAgencyId("fakeAgencyId")
  .withBeneficiaryRepresentative(beneficiaryRepresentative)
  .withBeneficiaryCurrentEmployer(beneficiaryCurrentEmployer)
  .withStatusJustification("test-rejection-justification")
  .withEstablishmentRepresentativeEmail(
    "establishment-representative@gmail.com",
  )
  .withEstablishmentTutorEmail("establishment-representative@gmail.com")
  .build();

const counsellorEmails = ["counsellor1@email.fr", "counsellor2@email.fr"];
const signature = "test-signature";

const defaultAgency = AgencyDtoBuilder.create(rejectedConvention.agencyId)
  .withName("test-agency-name")
  .withCounsellorEmails(counsellorEmails)
  .withSignature(signature)
  .build();

const agencyWithSameEmailAdressForCounsellorAndValidator =
  AgencyDtoBuilder.create(rejectedConventionWithDuplicatedEmails.agencyId)
    .withName("duplicated-email-test-agency-name")
    .withCounsellorEmails(counsellorEmails)
    .withValidatorEmails(counsellorEmails)
    .withSignature(signature)
    .build();

describe("NotifyBeneficiaryAndEnterpriseThatApplicationIsRejected", () => {
  let agency: AgencyDto;
  let useCase: NotifyAllActorsThatConventionIsRejected;
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

    useCase = new NotifyAllActorsThatConventionIsRejected(
      new InMemoryUowPerformer(uow),
      saveNotificationAndRelatedEvent,
    );
  });

  it("Sends rejection email to  beneficiary, establishment tutor, and counsellors, validor, beneficiary Representativ and beneficiary current employer", async () => {
    await useCase.execute(rejectedConvention);

    const templatedEmailsSent = uow.notificationRepository.notifications
      .filter((notif): notif is EmailNotification => notif.kind === "email")
      .map((notif) => notif.templatedContent);
    const {
      beneficiary,
      establishmentRepresentative,
      beneficiaryCurrentEmployer,
      beneficiaryRepresentative,
    } = rejectedConvention.signatories;
    expect(templatedEmailsSent).toHaveLength(1);

    expectNotifyConventionRejected(
      templatedEmailsSent[0],
      [
        beneficiary.email,
        establishmentRepresentative.email,
        beneficiaryRepresentative!.email,
        beneficiaryCurrentEmployer!.email,
        ...counsellorEmails,
        ...agency.validatorEmails,
      ],
      rejectedConvention,
      agency,
    );
  });

  it("doesn't send duplicated rejection emails if validator email is also in counsellor emails and establishment tutor email is the same as establishment representative", async () => {
    uow.agencyRepository.setAgencies([
      agencyWithSameEmailAdressForCounsellorAndValidator,
    ]);

    await useCase.execute(rejectedConventionWithDuplicatedEmails);

    const {
      beneficiaryCurrentEmployer,
      beneficiary,
      establishmentRepresentative,
      beneficiaryRepresentative,
    } = rejectedConventionWithDuplicatedEmails.signatories;

    const templatedEmailsSent = uow.notificationRepository.notifications
      .filter((notif): notif is EmailNotification => notif.kind === "email")
      .map((notif) => notif.templatedContent);

    expect(templatedEmailsSent).toHaveLength(1);

    expectNotifyConventionRejected(
      templatedEmailsSent[0],
      [
        beneficiary.email,
        establishmentRepresentative.email,
        beneficiaryRepresentative!.email,
        beneficiaryCurrentEmployer!.email,
        ...agencyWithSameEmailAdressForCounsellorAndValidator.validatorEmails,
      ],
      rejectedConventionWithDuplicatedEmails,
      agencyWithSameEmailAdressForCounsellorAndValidator,
    );
  });
});
