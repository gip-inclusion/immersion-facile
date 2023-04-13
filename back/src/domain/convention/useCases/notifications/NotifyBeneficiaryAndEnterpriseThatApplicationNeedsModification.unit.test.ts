import {
  AgencyDtoBuilder,
  ConventionDtoBuilder,
  CreateConventionMagicLinkPayloadProperties,
  expectPromiseToFailWith,
  expectToEqual,
  frontRoutes,
  Role,
} from "shared";

import { fakeGenerateMagicLinkUrlFn } from "../../../../_testBuilders/jwtTestHelper";
import {
  createInMemoryUow,
  InMemoryUnitOfWork,
} from "../../../../adapters/primary/config/uowConfig";
import { CustomTimeGateway } from "../../../../adapters/secondary/core/TimeGateway/CustomTimeGateway";
import { InMemoryEmailGateway } from "../../../../adapters/secondary/emailGateway/InMemoryEmailGateway";
import { InMemoryUowPerformer } from "../../../../adapters/secondary/InMemoryUowPerformer";
import { TimeGateway } from "../../../core/ports/TimeGateway";

import { NotifyBeneficiaryAndEnterpriseThatApplicationNeedsModification } from "./NotifyBeneficiaryAndEnterpriseThatApplicationNeedsModification";

describe("NotifyBeneficiaryAndEnterpriseThatApplicationNeedsModification", () => {
  let usecase: NotifyBeneficiaryAndEnterpriseThatApplicationNeedsModification;
  let uow: InMemoryUnitOfWork;
  let emailGateway: InMemoryEmailGateway;
  let timeGateway: TimeGateway;
  const convention = new ConventionDtoBuilder().build();
  const agency = new AgencyDtoBuilder().withId(convention.agencyId).build();

  beforeEach(() => {
    uow = createInMemoryUow();
    uow.conventionRepository.setConventions({ [convention.id]: convention });
    uow.agencyRepository.setAgencies([agency]);
    emailGateway = new InMemoryEmailGateway();
    timeGateway = new CustomTimeGateway();
    usecase =
      new NotifyBeneficiaryAndEnterpriseThatApplicationNeedsModification(
        new InMemoryUowPerformer(uow),
        emailGateway,
        fakeGenerateMagicLinkUrlFn,
        timeGateway,
      );
  });

  describe("Right paths", () => {
    it.each<[Role, string]>([
      ["beneficiary", convention.signatories.beneficiary.email],
      [
        "establishment",
        convention.signatories.establishmentRepresentative.email,
      ],
      [
        "establishment-representative",
        convention.signatories.establishmentRepresentative.email,
      ],
    ])(
      "Notify %s that application needs modification.",
      async (role, expectedRecipient) => {
        const justification = "Change required.";
        const magicLinkCommonFields: CreateConventionMagicLinkPayloadProperties =
          {
            id: convention.id,
            role,
            email: expectedRecipient,
            now: timeGateway.now(),
          };

        await usecase.execute({
          convention,
          justification,
          roles: [role],
        });

        expectToEqual(emailGateway.getSentEmails(), [
          {
            type: "CONVENTION_MODIFICATION_REQUEST_NOTIFICATION",
            recipients: [expectedRecipient],
            params: {
              internshipKind: convention.internshipKind,
              agency: agency.name,
              beneficiaryFirstName:
                convention.signatories.beneficiary.firstName,
              beneficiaryLastName: convention.signatories.beneficiary.lastName,
              businessName: convention.businessName,
              conventionStatusLink: fakeGenerateMagicLinkUrlFn({
                ...magicLinkCommonFields,
                targetRoute: frontRoutes.conventionStatusDashboard,
              }),
              immersionAppellation: convention.immersionAppellation,
              justification,
              magicLink: fakeGenerateMagicLinkUrlFn({
                ...magicLinkCommonFields,
                targetRoute: frontRoutes.conventionImmersionRoute,
              }),
              signature: agency.signature,
              agencyLogoUrl: agency.logoUrl,
            },
          },
        ]);
      },
    );
  });

  describe("Wrong paths", () => {
    it.each<Role>([
      "backOffice",
      "beneficiary-current-employer",
      "beneficiary-representative",
      "counsellor",
      "establishment-tutor",
      "legal-representative",
      "validator",
    ])(
      "Notify %s that application needs modification is not supported.",
      async (role) => {
        const justification = "Change required.";
        await expectPromiseToFailWith(
          usecase.execute({
            convention,
            justification,
            roles: [role],
          }),
          `Unsupported role for beneficiary/enterprise modification request notification: ${role}`,
        );
      },
    );
  });
});
