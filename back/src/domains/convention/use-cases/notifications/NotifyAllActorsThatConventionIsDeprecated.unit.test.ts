import {
  AgencyDtoBuilder,
  BeneficiaryCurrentEmployer,
  BeneficiaryRepresentative,
  ConventionDtoBuilder,
  EmailNotification,
  InclusionConnectedUserBuilder,
} from "shared";
import { toAgencyWithRights } from "../../../../utils/agency";
import { expectNotifyConventionIsDeprecated } from "../../../core/notifications/adapters/InMemoryNotificationRepository";
import { makeSaveNotificationAndRelatedEvent } from "../../../core/notifications/helpers/Notification";
import { CustomTimeGateway } from "../../../core/time-gateway/adapters/CustomTimeGateway";
import { InMemoryUowPerformer } from "../../../core/unit-of-work/adapters/InMemoryUowPerformer";
import {
  InMemoryUnitOfWork,
  createInMemoryUow,
} from "../../../core/unit-of-work/adapters/createInMemoryUow";
import { UuidV4Generator } from "../../../core/uuid-generator/adapters/UuidGeneratorImplementations";
import { NotifyAllActorsThatConventionIsDeprecated } from "./NotifyAllActorsThatConventionIsDeprecated";

describe("NotifyAllActorsThatApplicationIsDeprecated", () => {
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

  const deprecatedConvention = new ConventionDtoBuilder()
    .withStatus("DEPRECATED")
    .withStatusJustification("test-deprecation-justification")
    .withBeneficiaryRepresentative(beneficiaryRepresentative)
    .withBeneficiaryCurrentEmployer(beneficiaryCurrentEmployer)
    .build();

  const deprecatedConventionWithDuplicatedEmails = new ConventionDtoBuilder()
    .withStatus("DEPRECATED")
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
    .buildUser();
  const counsellor2 = new InclusionConnectedUserBuilder()
    .withId("counsellor2")
    .withEmail("counsellor2@email.fr")
    .buildUser();
  const validator = new InclusionConnectedUserBuilder()
    .withId("validator")
    .withEmail("validator@email.fr")
    .buildUser();

  const defaultAgency = AgencyDtoBuilder.create(deprecatedConvention.agencyId)
    .withName("test-agency-name")
    .build();

  const agencyWithSameEmailAdressForCounsellorAndValidator =
    AgencyDtoBuilder.create(deprecatedConventionWithDuplicatedEmails.agencyId)
      .withName("duplicated-email-test-agency-name")
      .build();

  let useCase: NotifyAllActorsThatConventionIsDeprecated;
  let uow: InMemoryUnitOfWork;

  beforeEach(() => {
    uow = createInMemoryUow();
    useCase = new NotifyAllActorsThatConventionIsDeprecated(
      new InMemoryUowPerformer(uow),
      makeSaveNotificationAndRelatedEvent(
        new UuidV4Generator(),
        new CustomTimeGateway(),
      ),
    );
    uow.agencyRepository.setAgencies([
      toAgencyWithRights(defaultAgency, {
        [counsellor1.id]: { isNotifiedByEmail: false, roles: ["counsellor"] },
        [counsellor2.id]: { isNotifiedByEmail: false, roles: ["counsellor"] },
        [validator.id]: { isNotifiedByEmail: false, roles: ["validator"] },
      }),
    ]);
    uow.userRepository.users = [counsellor1, counsellor2, validator];
  });

  it("Sends a conevention deprecated notification to all actors", async () => {
    await useCase.execute({ convention: deprecatedConvention });
    const {
      beneficiaryCurrentEmployer,
      beneficiary,
      establishmentRepresentative,
      beneficiaryRepresentative,
    } = deprecatedConvention.signatories;

    const templatedEmailsSent = uow.notificationRepository.notifications
      .filter((notif): notif is EmailNotification => notif.kind === "email")
      .map((notif) => notif.templatedContent);

    expect(templatedEmailsSent).toHaveLength(1);

    expectNotifyConventionIsDeprecated(
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
      deprecatedConvention,
    );
  });

  it("doesn't send duplicated rejection emails if validator email is also in counsellor emails and establishment tutor email is the same as establishment representative", async () => {
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
      convention: deprecatedConventionWithDuplicatedEmails,
    });

    const {
      beneficiaryCurrentEmployer,
      beneficiary,
      establishmentRepresentative,
      beneficiaryRepresentative,
    } = deprecatedConventionWithDuplicatedEmails.signatories;

    const templatedEmailsSent = uow.notificationRepository.notifications
      .filter((notif): notif is EmailNotification => notif.kind === "email")
      .map((notif) => notif.templatedContent);

    expect(templatedEmailsSent).toHaveLength(1);

    expectNotifyConventionIsDeprecated(
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
      deprecatedConventionWithDuplicatedEmails,
    );
  });
});
