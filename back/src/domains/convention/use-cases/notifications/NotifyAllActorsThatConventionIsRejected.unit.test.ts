import {
  AgencyDtoBuilder,
  BeneficiaryCurrentEmployer,
  BeneficiaryRepresentative,
  ConventionDtoBuilder,
  EmailNotification,
  InclusionConnectedUserBuilder,
} from "shared";
import { toAgencyWithRights } from "../../../../utils/agency";
import { expectNotifyConventionRejected } from "../../../core/notifications/adapters/InMemoryNotificationRepository";
import { makeSaveNotificationAndRelatedEvent } from "../../../core/notifications/helpers/Notification";
import { CustomTimeGateway } from "../../../core/time-gateway/adapters/CustomTimeGateway";
import { InMemoryUowPerformer } from "../../../core/unit-of-work/adapters/InMemoryUowPerformer";
import {
  InMemoryUnitOfWork,
  createInMemoryUow,
} from "../../../core/unit-of-work/adapters/createInMemoryUow";
import { UuidV4Generator } from "../../../core/uuid-generator/adapters/UuidGeneratorImplementations";
import { NotifyAllActorsThatConventionIsRejected } from "./NotifyAllActorsThatConventionIsRejected";

describe("NotifyBeneficiaryAndEnterpriseThatApplicationIsRejected", () => {
  const beneficiaryRepresentative: BeneficiaryRepresentative = {
    role: "beneficiary-representative",
    email: "legal@representative.com",
    firstName: "The",
    lastName: "Representative",
    phone: "+33112233445",
  };

  const beneficiaryCurrentEmployer: BeneficiaryCurrentEmployer = {
    firstName: "ali",
    lastName: "baba",
    businessName: "business",
    businessSiret: "01234567890123",
    email: "beneficiary-current-employer@gmail.com",
    job: "job",
    phone: "+33112233445",
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

  const counsellor1 = new InclusionConnectedUserBuilder()
    .withId("counsellor1")
    .withEmail("counsellor1@email.fr")
    .buildUser();
  const counsellor2 = new InclusionConnectedUserBuilder()
    .withId("counsellor2")
    .withEmail("counsellor2@email.fr")
    .buildUser();
  const validator = new InclusionConnectedUserBuilder()
    .withId("validator1")
    .withEmail("validator1@email.fr")
    .buildUser();
  const signature = "test-signature";

  let useCase: NotifyAllActorsThatConventionIsRejected;
  let uow: InMemoryUnitOfWork;

  beforeEach(() => {
    uow = createInMemoryUow();
    useCase = new NotifyAllActorsThatConventionIsRejected(
      new InMemoryUowPerformer(uow),
      makeSaveNotificationAndRelatedEvent(
        new UuidV4Generator(),
        new CustomTimeGateway(),
      ),
    );

    uow.userRepository.users = [counsellor1, counsellor2, validator];
  });

  it("Sends rejection email to  beneficiary, establishment tutor, and counsellors, validor, beneficiary Representative and beneficiary current employer", async () => {
    const agency = toAgencyWithRights(
      AgencyDtoBuilder.create(rejectedConvention.agencyId)
        .withName("test-agency-name")
        .withCounsellorEmails([])
        .withValidatorEmails([])
        .withSignature(signature)
        .build(),
      {
        [counsellor1.id]: { isNotifiedByEmail: false, roles: ["counsellor"] },
        [counsellor2.id]: { isNotifiedByEmail: false, roles: ["counsellor"] },
        [validator.id]: { isNotifiedByEmail: false, roles: ["validator"] },
      },
    );

    uow.agencyRepository.setAgencies([agency]);

    await useCase.execute({ convention: rejectedConvention });

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
        // biome-ignore lint/style/noNonNullAssertion:
        beneficiaryRepresentative!.email,
        // biome-ignore lint/style/noNonNullAssertion:
        beneficiaryCurrentEmployer!.email,
        counsellor1.email,
        counsellor2.email,
        validator.email,
      ],
      rejectedConvention,
      agency,
    );
  });

  it("doesn't send duplicated rejection emails if validator email is also in counsellor emails and establishment tutor email is the same as establishment representative", async () => {
    const agencyWithSameEmailAdressForCounsellorAndValidator =
      toAgencyWithRights(
        AgencyDtoBuilder.create(rejectedConventionWithDuplicatedEmails.agencyId)
          .withName("duplicated-email-test-agency-name")
          .withCounsellorEmails([])
          .withValidatorEmails([])
          .withSignature(signature)
          .build(),
        {
          [counsellor1.id]: {
            isNotifiedByEmail: false,
            roles: ["counsellor", "validator"],
          },
          [counsellor2.id]: {
            isNotifiedByEmail: false,
            roles: ["counsellor", "validator"],
          },
          [validator.id]: { isNotifiedByEmail: false, roles: ["validator"] },
        },
      );

    uow.agencyRepository.setAgencies([
      agencyWithSameEmailAdressForCounsellorAndValidator,
    ]);

    await useCase.execute({
      convention: rejectedConventionWithDuplicatedEmails,
    });

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
        // biome-ignore lint/style/noNonNullAssertion:
        beneficiaryRepresentative!.email,
        // biome-ignore lint/style/noNonNullAssertion:
        beneficiaryCurrentEmployer!.email,
        counsellor1.email,
        counsellor2.email,
        validator.email,
      ],
      rejectedConventionWithDuplicatedEmails,
      agencyWithSameEmailAdressForCounsellorAndValidator,
    );
  });
});
