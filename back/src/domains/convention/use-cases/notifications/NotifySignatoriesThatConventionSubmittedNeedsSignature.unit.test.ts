import {
  AgencyDto,
  ConventionDto,
  ConventionDtoBuilder,
  expectToEqual,
  frontRoutes,
} from "shared";
import { EmailNotification } from "shared";
import { AppConfig } from "../../../../adapters/primary/config/appConfig";
import {
  InMemoryNotificationRepository,
  expectEmailSignatoryConfirmationSignatureRequestMatchingConvention,
} from "../../../../adapters/secondary/InMemoryNotificationRepository";
import { AppConfigBuilder } from "../../../../utils/AppConfigBuilder";
import { fakeGenerateMagicLinkUrlFn } from "../../../../utils/jwtTestHelper";
import { InMemoryOutboxRepository } from "../../../core/events/adapters/InMemoryOutboxRepository";
import {
  WithNotificationIdAndKind,
  makeSaveNotificationAndRelatedEvent,
} from "../../../core/notifications/helpers/Notification";
import { DeterministShortLinkIdGeneratorGateway } from "../../../core/short-link/adapters/short-link-generator-gateway/DeterministShortLinkIdGeneratorGateway";
import { InMemoryShortLinkQuery } from "../../../core/short-link/adapters/short-link-query/InMemoryShortLinkQuery";
import { ShortLinkId } from "../../../core/short-link/ports/ShortLinkQuery";
import { CustomTimeGateway } from "../../../core/time-gateway/adapters/CustomTimeGateway";
import { InMemoryUowPerformer } from "../../../core/unit-of-work/adapters/InMemoryUowPerformer";
import { createInMemoryUow } from "../../../core/unit-of-work/adapters/createInMemoryUow";
import { UuidV4Generator } from "../../../core/uuid-generator/adapters/UuidGeneratorImplementations";
import { NotifySignatoriesThatConventionSubmittedNeedsSignature } from "./NotifySignatoriesThatConventionSubmittedNeedsSignature";

describe("NotifySignatoriesThatConventionSubmittedNeedsSignature", () => {
  let useCase: NotifySignatoriesThatConventionSubmittedNeedsSignature;
  let timeGateway: CustomTimeGateway;
  let validConvention: ConventionDto;
  let agency: AgencyDto;
  let shortLinkQuery: InMemoryShortLinkQuery;
  let config: AppConfig;
  let shortLinkGenerator: DeterministShortLinkIdGeneratorGateway;
  let notificationRepository: InMemoryNotificationRepository;
  let outboxRepository: InMemoryOutboxRepository;

  beforeEach(() => {
    config = new AppConfigBuilder({}).build();
    timeGateway = new CustomTimeGateway(new Date());
    const uow = createInMemoryUow();
    notificationRepository = uow.notificationRepository;
    outboxRepository = uow.outboxRepository;
    agency = uow.agencyRepository.agencies[0];
    shortLinkQuery = uow.shortLinkQuery;
    validConvention = new ConventionDtoBuilder()
      .withBeneficiaryRepresentative({
        firstName: "Tom",
        lastName: "Cruise",
        phone: "0665454271",
        role: "beneficiary-representative",
        email: "beneficiary@representative.fr",
      })
      .withAgencyId(agency.id)
      .build();
    shortLinkGenerator = new DeterministShortLinkIdGeneratorGateway();
    const uuidGenerator = new UuidV4Generator();
    const saveNotificationAndRelatedEvent = makeSaveNotificationAndRelatedEvent(
      uuidGenerator,
      timeGateway,
    );
    useCase = new NotifySignatoriesThatConventionSubmittedNeedsSignature(
      new InMemoryUowPerformer(uow),
      timeGateway,
      shortLinkGenerator,
      fakeGenerateMagicLinkUrlFn,
      config,
      saveNotificationAndRelatedEvent,
    );
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

    expectToEqual(shortLinkQuery.getShortLinks(), {
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

    const emailNotifications = notificationRepository.notifications.filter(
      (notification): notification is EmailNotification =>
        notification.kind === "email",
    );

    expect(outboxRepository.events.map(({ payload }) => payload)).toEqual(
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
