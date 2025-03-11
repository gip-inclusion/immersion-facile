import {
  type AgencyWithUsersRights,
  type ConventionDto,
  ConventionDtoBuilder,
  errors,
  expectPromiseToFailWithError,
  frontRoutes,
} from "shared";
import { fakeGenerateMagicLinkUrlFn } from "../../../../utils/jwtTestHelper";
import {
  type ExpectSavedNotificationsAndEvents,
  makeExpectSavedNotificationsAndEvents,
} from "../../../../utils/makeExpectSavedNotificationAndEvent.helpers";
import { makeSaveNotificationAndRelatedEvent } from "../../../core/notifications/helpers/Notification";
import { CustomTimeGateway } from "../../../core/time-gateway/adapters/CustomTimeGateway";
import { InMemoryUowPerformer } from "../../../core/unit-of-work/adapters/InMemoryUowPerformer";
import {
  type InMemoryUnitOfWork,
  createInMemoryUow,
} from "../../../core/unit-of-work/adapters/createInMemoryUow";
import { UuidV4Generator } from "../../../core/uuid-generator/adapters/UuidGeneratorImplementations";
import { NotifyLastSigneeThatConventionHasBeenSigned } from "./NotifyLastSigneeThatConventionHasBeenSigned";

describe("NotifyLastSigneeThatConventionHasBeenSigned", () => {
  let conventionSignedByNoOne: ConventionDto;
  let notifyLastSignee: NotifyLastSigneeThatConventionHasBeenSigned;
  let uow: InMemoryUnitOfWork;
  let timeGateway: CustomTimeGateway;
  let agency: AgencyWithUsersRights;
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

    const magicLink = fakeGenerateMagicLinkUrlFn({
      targetRoute: frontRoutes.manageConvention,
      id: signedConvention.id,
      role: "beneficiary",
      email: signedConvention.signatories.beneficiary.email,
      now,
      lifetime: "long",
    });

    expectSavedNotificationsAndEvents({
      emails: [
        {
          params: {
            internshipKind: signedConvention.internshipKind,
            conventionId: signedConvention.id,
            // biome-ignore lint/style/noNonNullAssertion: <explanation>
            signedAt: signedConvention.signatories.beneficiary.signedAt!,
            magicLink,
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
            magicLink: fakeGenerateMagicLinkUrlFn({
              targetRoute: frontRoutes.manageConvention,
              id: signedConvention.id,
              role: "establishment-representative",
              email:
                signedConvention.signatories.establishmentRepresentative.email,
              now,
              lifetime: "long",
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
      errors.convention.noSignatoryHasSigned({
        conventionId: conventionSignedByNoOne.id,
      }),
    );

    expectSavedNotificationsAndEvents({ emails: [] });
  });

  it("No convention on repository.", async () => {
    uow.conventionRepository.setConventions([]);

    await expectPromiseToFailWithError(
      notifyLastSignee.execute({ convention: conventionSignedByNoOne }),
      errors.convention.notFound({
        conventionId: conventionSignedByNoOne.id,
      }),
    );

    expectSavedNotificationsAndEvents({ emails: [] });
  });
});
