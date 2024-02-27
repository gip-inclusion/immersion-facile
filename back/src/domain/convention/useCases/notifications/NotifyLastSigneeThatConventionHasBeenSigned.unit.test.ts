import {
  AgencyDto,
  ConventionDto,
  ConventionDtoBuilder,
  expectPromiseToFailWithError,
  frontRoutes,
} from "shared";
import {
  InMemoryUnitOfWork,
  createInMemoryUow,
} from "../../../../adapters/primary/config/uowConfig";
import { InMemoryUowPerformer } from "../../../../adapters/secondary/InMemoryUowPerformer";
import { fakeGenerateMagicLinkUrlFn } from "../../../../utils/jwtTestHelper";
import {
  ExpectSavedNotificationsAndEvents,
  makeExpectSavedNotificationsAndEvents,
} from "../../../../utils/makeExpectSavedNotificationsAndEvents";
import { makeSaveNotificationAndRelatedEvent } from "../../../core/notifications/helpers/Notification";
import { CustomTimeGateway } from "../../../core/time-gateway/adapters/CustomTimeGateway";
import { UuidV4Generator } from "../../../core/uuid-generator/adapters/UuidGeneratorImplementations";
import {
  NotifyLastSigneeThatConventionHasBeenSigned,
  missingConventionMessage,
  noSignatoryMessage,
} from "./NotifyLastSigneeThatConventionHasBeenSigned";

describe("NotifyLastSigneeThatConventionHasBeenSigned", () => {
  let conventionSignedByNoOne: ConventionDto;
  let notifyLastSignee: NotifyLastSigneeThatConventionHasBeenSigned;
  let uow: InMemoryUnitOfWork;
  let timeGateway: CustomTimeGateway;
  let agency: AgencyDto;
  let expectSavedNotificationsAndEvents: ExpectSavedNotificationsAndEvents;

  beforeEach(() => {
    uow = createInMemoryUow();
    agency = uow.agencyRepository.agencies[0];
    conventionSignedByNoOne = new ConventionDtoBuilder()
      .withAgencyId(agency.id)
      .signedByBeneficiary(undefined)
      .signedByEstablishmentRepresentative(undefined)
      .build();

    expectSavedNotificationsAndEvents = makeExpectSavedNotificationsAndEvents(
      uow.notificationRepository,
      uow.outboxRepository,
    );

    timeGateway = new CustomTimeGateway();

    const uuidGenerator = new UuidV4Generator();
    const saveNotificationAndRelatedEvent = makeSaveNotificationAndRelatedEvent(
      uuidGenerator,
      timeGateway,
    );

    notifyLastSignee = new NotifyLastSigneeThatConventionHasBeenSigned(
      new InMemoryUowPerformer(uow),
      saveNotificationAndRelatedEvent,
      fakeGenerateMagicLinkUrlFn,
      timeGateway,
    );
  });

  it("Last signed by beneficiary, no more signees", async () => {
    const signedConvention = new ConventionDtoBuilder(conventionSignedByNoOne)
      .signedByBeneficiary(new Date().toISOString())
      .build();
    const now = new Date();
    timeGateway.setNextDate(now);

    uow.conventionRepository.setConventions([signedConvention]);

    await notifyLastSignee.execute({ convention: signedConvention });
    const conventionStatusLink = fakeGenerateMagicLinkUrlFn({
      targetRoute: frontRoutes.conventionStatusDashboard,
      id: signedConvention.id,
      role: "beneficiary",
      email: signedConvention.signatories.beneficiary.email,
      now,
    });

    expectSavedNotificationsAndEvents({
      emails: [
        {
          params: {
            internshipKind: signedConvention.internshipKind,
            conventionId: signedConvention.id,
            // biome-ignore lint/style/noNonNullAssertion: <explanation>
            signedAt: signedConvention.signatories.beneficiary.signedAt!,
            conventionStatusLink,
            agencyLogoUrl: agency.logoUrl ?? undefined,
            agencyName: agency.name,
          },
          recipients: [signedConvention.signatories.beneficiary.email],
          kind: "SIGNEE_HAS_SIGNED_CONVENTION",
        },
      ],
    });
  });

  it("Last signed by establishment representative, beneficiary already signed", async () => {
    const signedConvention = new ConventionDtoBuilder(conventionSignedByNoOne)
      .signedByBeneficiary(new Date().toISOString())
      .signedByEstablishmentRepresentative(new Date().toISOString())
      .build();
    const now = new Date();
    timeGateway.setNextDate(now);
    uow.conventionRepository.setConventions([signedConvention]);

    await notifyLastSignee.execute({ convention: signedConvention });

    expectSavedNotificationsAndEvents({
      emails: [
        {
          params: {
            internshipKind: signedConvention.internshipKind,
            signedAt:
              // biome-ignore lint/style/noNonNullAssertion: <explanation>
              signedConvention.signatories.establishmentRepresentative
                .signedAt!,
            conventionId: signedConvention.id,
            conventionStatusLink: fakeGenerateMagicLinkUrlFn({
              targetRoute: frontRoutes.conventionStatusDashboard,
              id: signedConvention.id,
              role: "establishment-representative",
              email:
                signedConvention.signatories.establishmentRepresentative.email,
              now,
            }),
            agencyLogoUrl: agency.logoUrl ?? undefined,
            agencyName: agency.name,
          },
          recipients: [
            signedConvention.signatories.establishmentRepresentative.email,
          ],
          kind: "SIGNEE_HAS_SIGNED_CONVENTION",
        },
      ],
    });
  });

  it("No one has signed the convention.", async () => {
    uow.conventionRepository.setConventions([conventionSignedByNoOne]);

    await expectPromiseToFailWithError(
      notifyLastSignee.execute({ convention: conventionSignedByNoOne }),
      new Error(noSignatoryMessage(conventionSignedByNoOne)),
    );

    expectSavedNotificationsAndEvents({ emails: [] });
  });

  it("No convention on repository.", async () => {
    uow.conventionRepository.setConventions([]);

    await expectPromiseToFailWithError(
      notifyLastSignee.execute({ convention: conventionSignedByNoOne }),
      new Error(missingConventionMessage(conventionSignedByNoOne.id)),
    );

    expectSavedNotificationsAndEvents({ emails: [] });
  });
});
