import {
  AgencyDto,
  AgencyDtoBuilder,
  ConventionDto,
  ConventionDtoBuilder,
  expectTypeToMatchAndEqual,
  frontRoutes,
  PeConnectIdentity,
} from "shared";
import {
  createInMemoryUow,
  InMemoryUnitOfWork,
} from "../../../../adapters/primary/config/uowConfig";
import { CustomTimeGateway } from "../../../../adapters/secondary/core/TimeGateway/CustomTimeGateway";
import { InMemoryEmailGateway } from "../../../../adapters/secondary/emailGateway/InMemoryEmailGateway";
import { InMemoryAgencyRepository } from "../../../../adapters/secondary/InMemoryAgencyRepository";
import { InMemoryUowPerformer } from "../../../../adapters/secondary/InMemoryUowPerformer";
import { fakeGenerateMagicLinkUrlFn } from "../../../../_testBuilders/fakeGenerateMagicLinkUrlFn";
import { NotifyToAgencyApplicationSubmitted } from "./NotifyToAgencyApplicationSubmitted";

describe("NotifyToAgencyApplicationSubmitted", () => {
  const councellorEmail = "councellor@email.fr";
  const councellorEmail2 = "councellor2@email.fr";
  const validatorEmail = "validator@mail.com";

  const agencyWithCounsellors = AgencyDtoBuilder.create(
    "agency-with-councellors",
  )
    .withCounsellorEmails([councellorEmail, councellorEmail2])
    .withName("test-agency-name")
    .build();

  const agencyWithOnlyValidator = AgencyDtoBuilder.create(
    "agency-with-only-validator",
  )
    .withValidatorEmails([validatorEmail])
    .withName("test-agency-name")
    .build();

  const agencyWithConsellorsAndValidator = AgencyDtoBuilder.create(
    "agency-with-councellors-and-validator",
  )
    .withCounsellorEmails([councellorEmail, councellorEmail2])
    .withValidatorEmails([validatorEmail])
    .withName("test-agency-name")
    .build();
  const agencyPeWithCouncellors = AgencyDtoBuilder.create(
    "agency-pe-with-councellors",
  )
    .withCounsellorEmails([councellorEmail, councellorEmail2])
    .withKind("pole-emploi")
    .withName("test-agency-name")
    .build();

  const expectedParams = (agency: AgencyDto, convention: ConventionDto) => ({
    agencyName: agency.name,
    businessName: convention.businessName,
    dateEnd: convention.dateEnd,
    dateStart: convention.dateStart,
    demandeId: convention.id,
    firstName: convention.signatories.beneficiary.firstName,
    lastName: convention.signatories.beneficiary.lastName,
  });

  let emailGateway: InMemoryEmailGateway;
  let agencyRepository: InMemoryAgencyRepository;
  let notifyToAgencyApplicationSubmitted: NotifyToAgencyApplicationSubmitted;
  let uow: InMemoryUnitOfWork;
  const timeGateway = new CustomTimeGateway();

  beforeEach(() => {
    emailGateway = new InMemoryEmailGateway();
    agencyRepository = new InMemoryAgencyRepository();
    agencyRepository.setAgencies([
      agencyWithCounsellors,
      agencyWithOnlyValidator,
      agencyWithConsellorsAndValidator,
      agencyPeWithCouncellors,
    ]);
    uow = createInMemoryUow();
    const uowPerformer = new InMemoryUowPerformer({
      ...uow,
      agencyRepository,
    });

    notifyToAgencyApplicationSubmitted = new NotifyToAgencyApplicationSubmitted(
      uowPerformer,
      emailGateway,
      fakeGenerateMagicLinkUrlFn,
      timeGateway,
    );
  });

  it("Sends notification email to agency counsellor when it is initially submitted", async () => {
    const validConvention = new ConventionDtoBuilder()
      .withAgencyId(agencyWithCounsellors.id)
      .build();

    await notifyToAgencyApplicationSubmitted.execute(validConvention);

    expectTypeToMatchAndEqual(emailGateway.getSentEmails(), [
      {
        type: "NEW_CONVENTION_AGENCY_NOTIFICATION",
        recipients: [councellorEmail],
        params: {
          internshipKind: validConvention.internshipKind,
          ...expectedParams(agencyWithCounsellors, validConvention),
          magicLink: fakeGenerateMagicLinkUrlFn({
            id: validConvention.id,
            role: "counsellor",
            targetRoute: frontRoutes.conventionToValidate,
            email: councellorEmail,
            now: timeGateway.now(),
          }),
          conventionStatusLink: fakeGenerateMagicLinkUrlFn({
            id: validConvention.id,
            role: "counsellor",
            targetRoute: frontRoutes.conventionStatusDashboard,
            email: councellorEmail,
            now: timeGateway.now(),
          }),
          agencyLogoUrl: agencyWithCounsellors.logoUrl,
        },
      },
      {
        type: "NEW_CONVENTION_AGENCY_NOTIFICATION",
        recipients: [councellorEmail2],
        params: {
          internshipKind: validConvention.internshipKind,
          ...expectedParams(agencyWithCounsellors, validConvention),
          magicLink: fakeGenerateMagicLinkUrlFn({
            id: validConvention.id,
            role: "counsellor",
            targetRoute: frontRoutes.conventionToValidate,
            email: councellorEmail2,
            now: timeGateway.now(),
          }),
          conventionStatusLink: fakeGenerateMagicLinkUrlFn({
            id: validConvention.id,
            role: "counsellor",
            targetRoute: frontRoutes.conventionStatusDashboard,
            email: councellorEmail2,
            now: timeGateway.now(),
          }),
          agencyLogoUrl: agencyWithCounsellors.logoUrl,
        },
      },
    ]);
  });

  it("Sends notification email to agency validator when it is initially submitted, and agency has no counsellor", async () => {
    const validConvention = new ConventionDtoBuilder()
      .withAgencyId(agencyWithOnlyValidator.id)
      .build();

    await notifyToAgencyApplicationSubmitted.execute(validConvention);

    expectTypeToMatchAndEqual(emailGateway.getSentEmails(), [
      {
        type: "NEW_CONVENTION_AGENCY_NOTIFICATION",
        recipients: [validatorEmail],
        params: {
          internshipKind: validConvention.internshipKind,
          ...expectedParams(agencyWithCounsellors, validConvention),
          magicLink: fakeGenerateMagicLinkUrlFn({
            id: validConvention.id,
            role: "validator",
            targetRoute: frontRoutes.conventionToValidate,
            email: validatorEmail,
            now: timeGateway.now(),
          }),
          conventionStatusLink: fakeGenerateMagicLinkUrlFn({
            id: validConvention.id,
            role: "validator",
            targetRoute: frontRoutes.conventionStatusDashboard,
            email: validatorEmail,
            now: timeGateway.now(),
          }),
          agencyLogoUrl: agencyWithCounsellors.logoUrl,
        },
      },
    ]);
  });

  it("Sends notification email only counsellors with agency that have validators and counsellors", async () => {
    const validConvention = new ConventionDtoBuilder()
      .withAgencyId(agencyWithConsellorsAndValidator.id)
      .build();

    await notifyToAgencyApplicationSubmitted.execute(validConvention);

    const sentEmails = emailGateway.getSentEmails();

    expectTypeToMatchAndEqual(sentEmails, [
      {
        type: "NEW_CONVENTION_AGENCY_NOTIFICATION",
        recipients: [councellorEmail],
        params: {
          internshipKind: validConvention.internshipKind,
          ...expectedParams(agencyWithConsellorsAndValidator, validConvention),
          magicLink: fakeGenerateMagicLinkUrlFn({
            id: validConvention.id,
            role: "counsellor",
            targetRoute: frontRoutes.conventionToValidate,
            email: councellorEmail,
            now: timeGateway.now(),
          }),
          conventionStatusLink: fakeGenerateMagicLinkUrlFn({
            id: validConvention.id,
            role: "counsellor",
            targetRoute: frontRoutes.conventionStatusDashboard,
            email: councellorEmail,
            now: timeGateway.now(),
          }),
          agencyLogoUrl: agencyWithConsellorsAndValidator.logoUrl,
        },
      },
      {
        type: "NEW_CONVENTION_AGENCY_NOTIFICATION",
        recipients: [councellorEmail2],
        params: {
          internshipKind: validConvention.internshipKind,
          ...expectedParams(agencyWithConsellorsAndValidator, validConvention),
          magicLink: fakeGenerateMagicLinkUrlFn({
            id: validConvention.id,
            role: "counsellor",
            targetRoute: frontRoutes.conventionToValidate,
            email: councellorEmail2,
            now: timeGateway.now(),
          }),
          conventionStatusLink: fakeGenerateMagicLinkUrlFn({
            id: validConvention.id,
            role: "counsellor",
            targetRoute: frontRoutes.conventionStatusDashboard,
            email: councellorEmail2,
            now: timeGateway.now(),
          }),
          agencyLogoUrl: agencyWithConsellorsAndValidator.logoUrl,
        },
      },
    ]);
  });
  it("Sends notification email to agency with warning when beneficiary is PeConnected and beneficiary has no PE advisor", async () => {
    const peIdentity: PeConnectIdentity = {
      provider: "peConnect",
      token: "123",
    };
    const validConvention = new ConventionDtoBuilder()
      .withAgencyId(agencyPeWithCouncellors.id)
      .withFederatedIdentity(peIdentity)
      .build();

    uow.conventionPoleEmploiAdvisorRepository.setConventionPoleEmploiUsersAdvisor(
      [
        {
          conventionId: validConvention.id,
          peExternalId: peIdentity.token,
          _entityName: "ConventionPoleEmploiAdvisor",
          advisor: undefined,
        },
      ],
    );

    await notifyToAgencyApplicationSubmitted.execute(validConvention);

    const sentEmails = emailGateway.getSentEmails();

    expectTypeToMatchAndEqual(sentEmails, [
      {
        type: "NEW_CONVENTION_AGENCY_NOTIFICATION",
        recipients: [councellorEmail],
        params: {
          internshipKind: validConvention.internshipKind,
          warning: `Attention: aucun conseiller référent Pôle emploi ne semble être associé à ce bénéficiaire.`,
          ...expectedParams(agencyWithConsellorsAndValidator, validConvention),
          magicLink: fakeGenerateMagicLinkUrlFn({
            id: validConvention.id,
            role: "counsellor",
            targetRoute: frontRoutes.conventionToValidate,
            email: councellorEmail,
            now: timeGateway.now(),
          }),
          conventionStatusLink: fakeGenerateMagicLinkUrlFn({
            id: validConvention.id,
            role: "counsellor",
            targetRoute: frontRoutes.conventionStatusDashboard,
            email: councellorEmail,
            now: timeGateway.now(),
          }),
          agencyLogoUrl: agencyWithConsellorsAndValidator.logoUrl,
        },
      },
      {
        type: "NEW_CONVENTION_AGENCY_NOTIFICATION",
        recipients: [councellorEmail2],
        params: {
          internshipKind: validConvention.internshipKind,
          ...expectedParams(agencyWithConsellorsAndValidator, validConvention),
          magicLink: fakeGenerateMagicLinkUrlFn({
            id: validConvention.id,
            role: "counsellor",
            targetRoute: frontRoutes.conventionToValidate,
            email: councellorEmail2,
            now: timeGateway.now(),
          }),
          conventionStatusLink: fakeGenerateMagicLinkUrlFn({
            id: validConvention.id,
            role: "counsellor",
            targetRoute: frontRoutes.conventionStatusDashboard,
            email: councellorEmail2,
            now: timeGateway.now(),
          }),
          agencyLogoUrl: agencyWithConsellorsAndValidator.logoUrl,
          warning: `Attention: aucun conseiller référent Pôle emploi ne semble être associé à ce bénéficiaire.`,
        },
      },
    ]);
  });
});
