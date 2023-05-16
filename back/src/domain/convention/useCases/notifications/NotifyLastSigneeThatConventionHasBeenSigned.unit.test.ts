import {
  AgencyDto,
  ConventionDto,
  ConventionDtoBuilder,
  expectPromiseToFailWithError,
  expectToEqual,
  frontRoutes,
} from "shared";
import { fakeGenerateMagicLinkUrlFn } from "../../../../_testBuilders/jwtTestHelper";
import {
  createInMemoryUow,
  InMemoryUnitOfWork,
} from "../../../../adapters/primary/config/uowConfig";
import { CustomTimeGateway } from "../../../../adapters/secondary/core/TimeGateway/CustomTimeGateway";
import { InMemoryUowPerformer } from "../../../../adapters/secondary/InMemoryUowPerformer";
import { InMemoryNotificationGateway } from "../../../../adapters/secondary/notificationGateway/InMemoryNotificationGateway";
import {
  missingConventionMessage,
  noSignatoryMessage,
  NotifyLastSigneeThatConventionHasBeenSigned,
} from "./NotifyLastSigneeThatConventionHasBeenSigned";

describe("NotifyLastSigneeThatConventionHasBeenSigned", () => {
  let conventionSignedByNoOne: ConventionDto;
  let notificationGateway: InMemoryNotificationGateway;
  let usecase: NotifyLastSigneeThatConventionHasBeenSigned;
  let uow: InMemoryUnitOfWork;
  let timeGateway: CustomTimeGateway;
  let agency: AgencyDto;

  beforeEach(() => {
    uow = createInMemoryUow();
    agency = uow.agencyRepository.agencies[0];
    conventionSignedByNoOne = new ConventionDtoBuilder()
      .withAgencyId(agency.id)
      .signedByBeneficiary(undefined)
      .signedByEstablishmentRepresentative(undefined)
      .build();
    notificationGateway = new InMemoryNotificationGateway();

    timeGateway = new CustomTimeGateway();
    usecase = new NotifyLastSigneeThatConventionHasBeenSigned(
      new InMemoryUowPerformer(uow),
      notificationGateway,
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

    uow.conventionRepository._conventions = {
      [signedConvention.id]: signedConvention,
    };

    await usecase.execute(signedConvention);
    const conventionStatusLink = fakeGenerateMagicLinkUrlFn({
      targetRoute: frontRoutes.conventionStatusDashboard,
      id: signedConvention.id,
      role: "beneficiary",
      email: signedConvention.signatories.beneficiary.email,
      now,
    });

    expectToEqual(notificationGateway.getSentEmails(), [
      {
        params: {
          internshipKind: signedConvention.internshipKind,
          conventionId: signedConvention.id,
          signedAt: signedConvention.signatories.beneficiary.signedAt!,
          conventionStatusLink,
          agencyLogoUrl: agency.logoUrl,
        },
        recipients: [signedConvention.signatories.beneficiary.email],
        type: "SIGNEE_HAS_SIGNED_CONVENTION",
      },
    ]);
  });

  it("Last signed by establishment representative, beneficiary already signed", async () => {
    const signedConvention = new ConventionDtoBuilder(conventionSignedByNoOne)
      .signedByBeneficiary(new Date().toISOString())
      .signedByEstablishmentRepresentative(new Date().toISOString())
      .build();
    const now = new Date();
    timeGateway.setNextDate(now);
    uow.conventionRepository._conventions = {
      [signedConvention.id]: signedConvention,
    };

    await usecase.execute(signedConvention);

    expectToEqual(notificationGateway.getSentEmails(), [
      {
        params: {
          internshipKind: signedConvention.internshipKind,
          signedAt:
            signedConvention.signatories.establishmentRepresentative.signedAt!,
          conventionId: signedConvention.id,
          conventionStatusLink: fakeGenerateMagicLinkUrlFn({
            targetRoute: frontRoutes.conventionStatusDashboard,
            id: signedConvention.id,
            role: "establishment-representative",
            email:
              signedConvention.signatories.establishmentRepresentative.email,
            now,
          }),
          agencyLogoUrl: agency.logoUrl,
        },
        recipients: [
          signedConvention.signatories.establishmentRepresentative.email,
        ],
        type: "SIGNEE_HAS_SIGNED_CONVENTION",
      },
    ]);
  });

  it("No one has signed the convention.", async () => {
    uow.conventionRepository._conventions = {
      [conventionSignedByNoOne.id]: conventionSignedByNoOne,
    };

    await expectPromiseToFailWithError(
      usecase.execute(conventionSignedByNoOne),
      new Error(noSignatoryMessage(conventionSignedByNoOne)),
    );

    expectToEqual(notificationGateway.getSentEmails(), []);
  });

  it("No convention on repository.", async () => {
    uow.conventionRepository._conventions = {};

    await expectPromiseToFailWithError(
      usecase.execute(conventionSignedByNoOne),
      new Error(missingConventionMessage(conventionSignedByNoOne.id)),
    );

    expectToEqual(notificationGateway.getSentEmails(), []);
  });
});
