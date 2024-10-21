import {
  AgencyDto,
  AgencyDtoBuilder,
  ConventionDto,
  ConventionDtoBuilder,
  EmailNotification,
  InclusionConnectedUserBuilder,
  ShortLinkId,
  expectToEqual,
  frontRoutes,
} from "shared";
import { AppConfig } from "../../../../config/bootstrap/appConfig";
import { AppConfigBuilder } from "../../../../utils/AppConfigBuilder";
import { toAgencyWithRights } from "../../../../utils/agency";
import { fakeGenerateMagicLinkUrlFn } from "../../../../utils/jwtTestHelper";
import { expectEmailSignatoryConfirmationSignatureRequestMatchingConvention } from "../../../core/notifications/adapters/InMemoryNotificationRepository";
import {
  WithNotificationIdAndKind,
  makeSaveNotificationAndRelatedEvent,
} from "../../../core/notifications/helpers/Notification";
import { DeterministShortLinkIdGeneratorGateway } from "../../../core/short-link/adapters/short-link-generator-gateway/DeterministShortLinkIdGeneratorGateway";
import { CustomTimeGateway } from "../../../core/time-gateway/adapters/CustomTimeGateway";
import { InMemoryUowPerformer } from "../../../core/unit-of-work/adapters/InMemoryUowPerformer";
import {
  InMemoryUnitOfWork,
  createInMemoryUow,
} from "../../../core/unit-of-work/adapters/createInMemoryUow";
import { UuidV4Generator } from "../../../core/uuid-generator/adapters/UuidGeneratorImplementations";
import { NotifySignatoriesThatConventionSubmittedNeedsSignature } from "./NotifySignatoriesThatConventionSubmittedNeedsSignature";

describe("NotifySignatoriesThatConventionSubmittedNeedsSignature", () => {
  const config: AppConfig = new AppConfigBuilder({}).build();
  const agency: AgencyDto = new AgencyDtoBuilder().build();
  const counsellor = new InclusionConnectedUserBuilder()
    .withId("counsellor")
    .withEmail("counsellor@mail.com")
    .buildUser();
  const validator = new InclusionConnectedUserBuilder()
    .withId("validator")
    .withEmail("validator@mail.com")
    .buildUser();
  const validConvention: ConventionDto = new ConventionDtoBuilder()
    .withBeneficiaryRepresentative({
      firstName: "Tom",
      lastName: "Cruise",
      phone: "0665454271",
      role: "beneficiary-representative",
      email: "beneficiary@representative.fr",
    })
    .withAgencyId(agency.id)
    .build();

  let uow: InMemoryUnitOfWork;
  let useCase: NotifySignatoriesThatConventionSubmittedNeedsSignature;
  let timeGateway: CustomTimeGateway;
  let shortLinkGenerator: DeterministShortLinkIdGeneratorGateway;

  beforeEach(() => {
    uow = createInMemoryUow();
    timeGateway = new CustomTimeGateway();
    shortLinkGenerator = new DeterministShortLinkIdGeneratorGateway();
    useCase = new NotifySignatoriesThatConventionSubmittedNeedsSignature(
      new InMemoryUowPerformer(uow),
      timeGateway,
      shortLinkGenerator,
      fakeGenerateMagicLinkUrlFn,
      config,
      makeSaveNotificationAndRelatedEvent(new UuidV4Generator(), timeGateway),
    );
    uow.userRepository.users = [counsellor, validator];
    uow.agencyRepository.agencies = [
      toAgencyWithRights(agency, {
        [counsellor.id]: { isNotifiedByEmail: false, roles: ["counsellor"] },
        [validator.id]: { isNotifiedByEmail: false, roles: ["validator"] },
      }),
    ];
  });

  it("Sends confirmation email to all signatories", async () => {
    const deterministicShortLinks: ShortLinkId[] = [
      "shortLink1",
      "shortLink2",
      "shortLink3",
      "shortLink4",
      "shortLink5",
      "shortLink6",
    ];
    shortLinkGenerator.addMoreShortLinkIds(deterministicShortLinks);

    await useCase.execute({ convention: validConvention });

    expectToEqual(uow.shortLinkQuery.getShortLinks(), {
      [deterministicShortLinks[0]]: fakeGenerateMagicLinkUrlFn({
        id: validConvention.id,
        role: validConvention.signatories.beneficiary.role,
        email: validConvention.signatories.beneficiary.email,
        now: timeGateway.now(),
        targetRoute: frontRoutes.conventionToSign,
      }),
      [deterministicShortLinks[1]]: fakeGenerateMagicLinkUrlFn({
        id: validConvention.id,
        role: validConvention.signatories.beneficiary.role,
        email: validConvention.signatories.beneficiary.email,
        now: timeGateway.now(),
        targetRoute: frontRoutes.conventionStatusDashboard,
      }),
      [deterministicShortLinks[2]]: fakeGenerateMagicLinkUrlFn({
        id: validConvention.id,
        // biome-ignore lint/style/noNonNullAssertion:
        role: validConvention.signatories.establishmentRepresentative!.role,
        // biome-ignore lint/style/noNonNullAssertion:
        email: validConvention.signatories.establishmentRepresentative!.email,
        now: timeGateway.now(),
        targetRoute: frontRoutes.conventionToSign,
      }),
      [deterministicShortLinks[3]]: fakeGenerateMagicLinkUrlFn({
        id: validConvention.id,
        // biome-ignore lint/style/noNonNullAssertion:
        role: validConvention.signatories.establishmentRepresentative!.role,
        // biome-ignore lint/style/noNonNullAssertion:
        email: validConvention.signatories.establishmentRepresentative!.email,
        now: timeGateway.now(),
        targetRoute: frontRoutes.conventionStatusDashboard,
      }),
      [deterministicShortLinks[4]]: fakeGenerateMagicLinkUrlFn({
        id: validConvention.id,
        // biome-ignore lint/style/noNonNullAssertion:
        role: validConvention.signatories.beneficiaryRepresentative!.role,
        // biome-ignore lint/style/noNonNullAssertion:
        email: validConvention.signatories.beneficiaryRepresentative!.email,
        now: timeGateway.now(),
        targetRoute: frontRoutes.conventionToSign,
      }),
      [deterministicShortLinks[5]]: fakeGenerateMagicLinkUrlFn({
        id: validConvention.id,
        // biome-ignore lint/style/noNonNullAssertion:
        role: validConvention.signatories.beneficiaryRepresentative!.role,
        // biome-ignore lint/style/noNonNullAssertion:
        email: validConvention.signatories.beneficiaryRepresentative!.email,
        now: timeGateway.now(),
        targetRoute: frontRoutes.conventionStatusDashboard,
      }),
    });

    const emailNotifications = uow.notificationRepository.notifications.filter(
      (notification): notification is EmailNotification =>
        notification.kind === "email",
    );

    expect(uow.outboxRepository.events.map(({ payload }) => payload)).toEqual(
      emailNotifications.map(
        ({ id }): WithNotificationIdAndKind => ({ id, kind: "email" }),
      ),
    );
    expect(emailNotifications).toHaveLength(3);

    expectEmailSignatoryConfirmationSignatureRequestMatchingConvention({
      templatedEmail: emailNotifications[0].templatedContent,
      convention: validConvention,
      signatory: validConvention.signatories.beneficiary,
      recipient: validConvention.signatories.beneficiary.email,
      now: timeGateway.now(),
      agency,
      config,
      conventionToSignLinkId: deterministicShortLinks[0],
      conventionStatusLinkId: deterministicShortLinks[1],
    });
    expectEmailSignatoryConfirmationSignatureRequestMatchingConvention({
      templatedEmail: emailNotifications[1].templatedContent,
      convention: validConvention,
      signatory: validConvention.signatories.establishmentRepresentative,
      recipient: validConvention.signatories.establishmentRepresentative.email,
      now: timeGateway.now(),
      agency,
      config,
      conventionToSignLinkId: deterministicShortLinks[2],
      conventionStatusLinkId: deterministicShortLinks[3],
    });
    expectEmailSignatoryConfirmationSignatureRequestMatchingConvention({
      templatedEmail: emailNotifications[2].templatedContent,
      convention: validConvention,
      // biome-ignore lint/style/noNonNullAssertion: <explanation>
      signatory: validConvention.signatories.beneficiaryRepresentative!,
      // biome-ignore lint/style/noNonNullAssertion: <explanation>
      recipient: validConvention.signatories.beneficiaryRepresentative!.email,
      now: timeGateway.now(),
      agency,
      config,
      conventionToSignLinkId: deterministicShortLinks[4],
      conventionStatusLinkId: deterministicShortLinks[5],
    });
  });
});
