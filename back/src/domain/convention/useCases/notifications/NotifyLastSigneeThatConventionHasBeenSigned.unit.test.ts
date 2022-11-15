import {
  ConventionDto,
  ConventionDtoBuilder,
  expectPromiseToFailWithError,
  expectToEqual,
} from "shared";
import {
  createInMemoryUow,
  InMemoryUnitOfWork,
} from "../../../../adapters/primary/config/uowConfig";
import { InMemoryEmailGateway } from "../../../../adapters/secondary/emailGateway/InMemoryEmailGateway";
import {
  missingConventionMessage,
  noSignatoryMessage,
  NotifyLastSigneeThatConventionHasBeenSigned,
} from "./NotifyLastSigneeThatConventionHasBeenSigned";
import { InMemoryUowPerformer } from "../../../../adapters/secondary/InMemoryUowPerformer";

describe("NotifyLastSigneeThatConventionHasBeenSigned", () => {
  let conventionSignedByNoOne: ConventionDto;
  let emailGw: InMemoryEmailGateway;
  let usecase: NotifyLastSigneeThatConventionHasBeenSigned;
  let uow: InMemoryUnitOfWork;

  beforeEach(() => {
    conventionSignedByNoOne = new ConventionDtoBuilder()
      .signedByBeneficiary(undefined)
      .signedByEstablishmentRepresentative(undefined)
      .build();
    emailGw = new InMemoryEmailGateway();
    uow = createInMemoryUow();
    usecase = new NotifyLastSigneeThatConventionHasBeenSigned(
      new InMemoryUowPerformer(uow),
      emailGw,
    );
  });

  it("Last signed by beneficiary, no more signees", async () => {
    const signedConvention = new ConventionDtoBuilder(conventionSignedByNoOne)
      .signedByBeneficiary(new Date().toISOString())
      .build();

    uow.conventionRepository._conventions = {
      [signedConvention.id]: signedConvention,
    };

    await usecase.execute(signedConvention);

    expectToEqual(emailGw.getSentEmails(), [
      {
        params: {
          demandeId: signedConvention.id,
          signAt: signedConvention.signatories.beneficiary.signedAt!,
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
    uow.conventionRepository._conventions = {
      [signedConvention.id]: signedConvention,
    };

    await usecase.execute(signedConvention);

    expectToEqual(emailGw.getSentEmails(), [
      {
        params: {
          signAt:
            signedConvention.signatories.establishmentRepresentative.signedAt!,
          demandeId: signedConvention.id,
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

    expectToEqual(emailGw.getSentEmails(), []);
  });

  it("No convention on repository.", async () => {
    uow.conventionRepository._conventions = {};

    await expectPromiseToFailWithError(
      usecase.execute(conventionSignedByNoOne),
      new Error(missingConventionMessage(conventionSignedByNoOne)),
    );

    expectToEqual(emailGw.getSentEmails(), []);
  });
});
