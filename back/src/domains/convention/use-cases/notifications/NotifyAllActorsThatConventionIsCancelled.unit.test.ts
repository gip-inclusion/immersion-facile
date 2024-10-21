import {
  AgencyDtoBuilder,
  BeneficiaryCurrentEmployer,
  BeneficiaryRepresentative,
  ConventionDtoBuilder,
  EmailNotification,
  InclusionConnectedUserBuilder,
} from "shared";
import { toAgencyWithRights } from "../../../../utils/agency";
import { expectNotifyConventionCancelled } from "../../../core/notifications/adapters/InMemoryNotificationRepository";
import { makeSaveNotificationAndRelatedEvent } from "../../../core/notifications/helpers/Notification";
import { CustomTimeGateway } from "../../../core/time-gateway/adapters/CustomTimeGateway";
import { InMemoryUowPerformer } from "../../../core/unit-of-work/adapters/InMemoryUowPerformer";
import {
  InMemoryUnitOfWork,
  createInMemoryUow,
} from "../../../core/unit-of-work/adapters/createInMemoryUow";
import { UuidV4Generator } from "../../../core/uuid-generator/adapters/UuidGeneratorImplementations";
import { NotifyAllActorsThatConventionIsCancelled } from "./NotifyAllActorsThatConventionIsCancelled";

describe("NotifyBeneficiaryAndEnterpriseThatApplicationIsCancelled", () => {
  const beneficiaryRepresentative: BeneficiaryRepresentative = {
    role: "beneficiary-representative",
    email: "legal@representative.com",
    firstName: "The",
    lastName: "Representative",
    phone: "+33112233446",
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

  const counsellor1 = new InclusionConnectedUserBuilder()
    .withId("counsellor1")
    .withEmail("counsellor1@email.fr")
    .build();
  const counsellor2 = new InclusionConnectedUserBuilder()
    .withId("counsellor2")
    .withEmail("counsellor2@email.fr")
    .build();
  const validator = new InclusionConnectedUserBuilder()
    .withId("validator")
    .withEmail("validator@email.fr")
    .build();

  const signature = "test-signature";

  const defaultAgency = AgencyDtoBuilder.create(cancelledConvention.agencyId)
    .withName("test-agency-name")
    .withSignature(signature)
    .build();

  const agencyWithSameEmailAdressForCounsellorAndValidator =
    AgencyDtoBuilder.create(cancelledConventionWithDuplicatedEmails.agencyId)
      .withName("duplicated-email-test-agency-name")
      .withSignature(signature)
      .build();

  let useCase: NotifyAllActorsThatConventionIsCancelled;
  let uow: InMemoryUnitOfWork;

  beforeEach(() => {
    uow = createInMemoryUow();
    useCase = new NotifyAllActorsThatConventionIsCancelled(
      new InMemoryUowPerformer(uow),
      makeSaveNotificationAndRelatedEvent(
        new UuidV4Generator(),
        new CustomTimeGateway(),
      ),
    );
    uow.userRepository.users = [counsellor1, counsellor2, validator];
  });

  it("Sends cancelation email to beneficiary, establishment tutor, and counsellors, validor, beneficiary Representativ and beneficiary current employer", async () => {
    uow.agencyRepository.setAgencies([
      toAgencyWithRights(defaultAgency, {
        [counsellor1.id]: { isNotifiedByEmail: false, roles: ["counsellor"] },
        [counsellor2.id]: { isNotifiedByEmail: false, roles: ["counsellor"] },
        [validator.id]: { isNotifiedByEmail: false, roles: ["validator"] },
      }),
    ]);

    await useCase.execute({ convention: cancelledConvention });
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
        // biome-ignore lint/style/noNonNullAssertion:
        beneficiaryRepresentative!.email,
        // biome-ignore lint/style/noNonNullAssertion:
        beneficiaryCurrentEmployer!.email,
        counsellor1.email,
        counsellor2.email,
        validator.email,
      ],
      cancelledConvention,
      defaultAgency,
    );
  });

  it("doesn't send duplicated emails if validator email is also in counsellor emails and establishment tutor email is the same as establishment representative", async () => {
    uow.agencyRepository.setAgencies([
      toAgencyWithRights(agencyWithSameEmailAdressForCounsellorAndValidator, {
        [counsellor1.id]: {
          isNotifiedByEmail: false,
          roles: ["counsellor", "validator"],
        },
        [counsellor2.id]: {
          isNotifiedByEmail: false,
          roles: ["counsellor", "validator"],
        },
      }),
    ]);

    await useCase.execute({
      convention: cancelledConventionWithDuplicatedEmails,
    });

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
        // biome-ignore lint/style/noNonNullAssertion:
        beneficiaryRepresentative!.email,
        // biome-ignore lint/style/noNonNullAssertion:
        beneficiaryCurrentEmployer!.email,
        counsellor1.email,
        counsellor2.email,
      ],
      cancelledConventionWithDuplicatedEmails,
      agencyWithSameEmailAdressForCounsellorAndValidator,
    );
  });
});
