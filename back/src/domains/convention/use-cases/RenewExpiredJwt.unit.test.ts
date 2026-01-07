import {
  AgencyDtoBuilder,
  type BeneficiaryCurrentEmployer,
  type BeneficiaryRepresentative,
  type ConventionDto,
  ConventionDtoBuilder,
  type ConventionId,
  type ConventionRole,
  errors,
  expectPromiseToFailWithError,
  expectToEqual,
  frontRoutes,
  type RenewExpiredJwtRequestDto,
} from "shared";
import type { AppConfig } from "../../../config/bootstrap/appConfig";
import { AppConfigBuilder } from "../../../utils/AppConfigBuilder";
import { toAgencyWithRights } from "../../../utils/agency";
import { createConventionMagicLinkPayload } from "../../../utils/jwt";
import { fakeGenerateMagicLinkUrlFn } from "../../../utils/jwtTestHelper";
import type { WithTriggeredBy } from "../../core/events/events";
import { makeCreateNewEvent } from "../../core/events/ports/EventBus";
import { makeGenerateJwtES256 } from "../../core/jwt";
import { DeterministShortLinkIdGeneratorGateway } from "../../core/short-link/adapters/short-link-generator-gateway/DeterministShortLinkIdGeneratorGateway";
import { CustomTimeGateway } from "../../core/time-gateway/adapters/CustomTimeGateway";
import {
  createInMemoryUow,
  type InMemoryUnitOfWork,
} from "../../core/unit-of-work/adapters/createInMemoryUow";
import { InMemoryUowPerformer } from "../../core/unit-of-work/adapters/InMemoryUowPerformer";
import { TestUuidGenerator } from "../../core/uuid-generator/adapters/UuidGeneratorImplementations";
import type { RenewMagicLinkPayload } from "./notifications/DeliverRenewedMagicLink";
import { RenewExpiredJwt } from "./RenewExpiredJwt";

describe("RenewConventionMagicLink use case", () => {
  const currentEmployer: BeneficiaryCurrentEmployer = {
    email: "currentEmployer@mail.com",
    businessName: "",
    businessSiret: "",
    firstName: "",
    lastName: "",
    job: "",
    role: "beneficiary-current-employer",
    phone: "",
    businessAddress: "Rue des Bouchers 67065 Strasbourg",
  };
  const beneficiaryRepresentative: BeneficiaryRepresentative = {
    email: "beneficiaryRepresentative@mail.com",
    firstName: "",
    lastName: "",
    phone: "",
    role: "beneficiary-representative",
  };
  const validConvention: ConventionDto = new ConventionDtoBuilder()
    .withBeneficiaryCurrentEmployer(currentEmployer)
    .withBeneficiaryRepresentative(beneficiaryRepresentative)
    .build();

  const defaultAgency = AgencyDtoBuilder.create(
    validConvention.agencyId,
  ).build();
  const email = "some email";
  const config: AppConfig = new AppConfigBuilder()
    .withTestPresetPreviousKeys()
    .build();
  const generateConventionJwt = makeGenerateJwtES256<"convention">(
    config.jwtPrivateKey,
    undefined,
  );
  const timeGateway = new CustomTimeGateway(new Date());

  let uow: InMemoryUnitOfWork;
  let useCase: RenewExpiredJwt;
  let shortLinkIdGeneratorGateway: DeterministShortLinkIdGeneratorGateway;

  beforeEach(() => {
    uow = createInMemoryUow();
    uow.agencyRepository.agencies = [toAgencyWithRights(defaultAgency)];
    uow.conventionRepository.setConventions([validConvention]);
    shortLinkIdGeneratorGateway = new DeterministShortLinkIdGeneratorGateway();
    useCase = new RenewExpiredJwt(
      new InMemoryUowPerformer(uow),
      makeCreateNewEvent({
        timeGateway,
        uuidGenerator: new TestUuidGenerator(),
      }),
      fakeGenerateMagicLinkUrlFn,
      config,
      timeGateway,
      shortLinkIdGeneratorGateway,
    );
  });

  describe("Right paths", () => {
    it.each<[ConventionRole, string]>([
      ["beneficiary", validConvention.signatories.beneficiary.email],
      [
        "beneficiary-current-employer",
        // biome-ignore lint/style/noNonNullAssertion: provided
        validConvention.signatories.beneficiaryCurrentEmployer!.email,
      ],
      [
        "beneficiary-representative",
        // biome-ignore lint/style/noNonNullAssertion: provided
        validConvention.signatories.beneficiaryRepresentative!.email,
      ],
      [
        "establishment-representative",
        validConvention.signatories.establishmentRepresentative.email,
      ],
      ["establishment-tutor", validConvention.establishmentTutor.email],
      ...defaultAgency.counsellorEmails.map(
        (counsellorEmail): [ConventionRole, string] => [
          "counsellor",
          counsellorEmail,
        ],
      ),
      ...defaultAgency.validatorEmails.map(
        (validatorEmail): [ConventionRole, string] => [
          "validator",
          validatorEmail,
        ],
      ),
    ])("Posts an event to deliver a correct JWT for correct responses for role %s", async (expectedRole, expectedEmails) => {
      const expiredPayload = createConventionMagicLinkPayload({
        id: validConvention.id,
        role: expectedRole,
        email: expectedEmails,
        now: timeGateway.now(),
      });

      const request: RenewExpiredJwtRequestDto = {
        originalUrl: "http://immersionfacile.fr/verifier-et-signer",

        expiredJwt: generateConventionJwt(expiredPayload),
      };

      const shortLinks = ["shortLink1", "shortLink2"];
      shortLinkIdGeneratorGateway.addMoreShortLinkIds(shortLinks);

      await useCase.execute(request);

      expect(uow.outboxRepository.events).toHaveLength(1);

      const renewalEvent = uow.outboxRepository.events[0];
      expect(renewalEvent.topic).toBe("MagicLinkRenewalRequested");

      const dispatchedPayload = renewalEvent.payload as RenewMagicLinkPayload &
        WithTriggeredBy;
      expect(dispatchedPayload.emails).toEqual([expectedEmails]);
      expectToEqual(dispatchedPayload.triggeredBy, {
        kind: "convention-magic-link",
        role: expectedRole,
      });

      expectToEqual(
        [dispatchedPayload.magicLink, dispatchedPayload.conventionStatusLink],
        [
          `${config.immersionFacileBaseUrl}/api/to/${shortLinks[0]}`,
          `${config.immersionFacileBaseUrl}/api/to/${shortLinks[1]}`,
        ],
      );

      expectToEqual(
        uow.shortLinkQuery.getShortLinks()[shortLinks[0]],
        fakeGenerateMagicLinkUrlFn({
          id: validConvention.id,
          role: expectedRole,
          email: expectedEmails,
          now: timeGateway.now(),
          targetRoute: frontRoutes.conventionToSign,
        }),
      );
    });

    it("Also work when using encoded Url", async () => {
      shortLinkIdGeneratorGateway.addMoreShortLinkIds([
        "shortLink1",
        "shortLink2",
      ]);
      const expiredPayload = createConventionMagicLinkPayload({
        id: validConvention.id,
        role: "beneficiary",
        email: validConvention.signatories.beneficiary.email,
        now: timeGateway.now(),
      });

      const request: RenewExpiredJwtRequestDto = {
        originalUrl: encodeURIComponent(
          "http://immersionfacile.fr/verifier-et-signer",
        ),
        expiredJwt: generateConventionJwt(expiredPayload),
      };

      await useCase.execute(request);
      // should not throw error
      expect(uow.outboxRepository.events).toHaveLength(1);
    });
  });

  describe("Wrong paths", () => {
    it("requires a valid application id", async () => {
      const invalidConventionId: ConventionId = "not-a-valid-id";

      const request: RenewExpiredJwtRequestDto = {
        originalUrl: "https://immersionfacile.com/%jwt%",
        expiredJwt: generateConventionJwt(
          createConventionMagicLinkPayload({
            id: invalidConventionId,
            role: "counsellor",
            email,
            now: timeGateway.now(),
          }),
        ),
      };

      await expectPromiseToFailWithError(
        useCase.execute(request),
        errors.convention.notFound({ conventionId: invalidConventionId }),
      );
    });

    it("requires a known agency id", async () => {
      const storedUnknownId = "some unknown agency id";
      const convention = new ConventionDtoBuilder()
        .withAgencyId(storedUnknownId)
        .build();
      uow.conventionRepository.setConventions([convention]);

      const request: RenewExpiredJwtRequestDto = {
        originalUrl: "https://immersionfacile.com/%jwt%",
        expiredJwt: generateConventionJwt(
          createConventionMagicLinkPayload({
            id: convention.id,
            role: "counsellor",
            email,
            now: timeGateway.now(),
          }),
        ),
      };

      await expectPromiseToFailWithError(
        useCase.execute(request),
        errors.agency.notFound({ agencyId: storedUnknownId }),
      );
    });

    // Admins use non-magic-link based authentication, so no need to renew these.
    it("Refuses to generate backoffice magic links", async () => {
      const request: RenewExpiredJwtRequestDto = {
        originalUrl: "https://immersionfacile.com/verification",
        expiredJwt: generateConventionJwt(
          createConventionMagicLinkPayload({
            id: validConvention.id,
            role: "back-office" as ConventionRole,
            email,
            now: timeGateway.now(),
          }),
        ),
      };

      await expectPromiseToFailWithError(
        useCase.execute(request),
        errors.convention.roleHasNoMagicLink({ role: "back-office" }),
      );
    });

    it("does not accept to renew links from url that are not supported", async () => {
      const request: RenewExpiredJwtRequestDto = {
        originalUrl: "immersionfacile.com/",
        expiredJwt: generateConventionJwt(
          createConventionMagicLinkPayload({
            id: validConvention.id,
            role: "counsellor",
            email,
            now: timeGateway.now(),
          }),
        ),
      };

      await expectPromiseToFailWithError(
        useCase.execute(request),
        errors.convention.unsupportedRenewRoute({
          originalUrl: request.originalUrl,
          supportedRenewRoutes: [
            "demande-immersion",
            "verifier-et-signer",
            "pilotage-convention",
            "bilan-immersion",
            "bilan-document",
          ],
        }),
      );
    });
  });
});
