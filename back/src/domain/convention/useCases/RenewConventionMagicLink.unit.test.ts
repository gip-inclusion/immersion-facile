import {
  AgencyDtoBuilder,
  BeneficiaryCurrentEmployer,
  BeneficiaryRepresentative,
  ConventionDto,
  ConventionDtoBuilder,
  createConventionMagicLinkPayload,
  expectPromiseToFailWithError,
  expectToEqual,
  frontRoutes,
  RenewMagicLinkRequestDto,
  Role,
  shortLinkRoute,
} from "shared";
import { AppConfigBuilder } from "../../../_testBuilders/AppConfigBuilder";
import { fakeGenerateMagicLinkUrlFn } from "../../../_testBuilders/jwtTestHelper";
import { AppConfig } from "../../../adapters/primary/config/appConfig";
import {
  createInMemoryUow,
  InMemoryUnitOfWork,
} from "../../../adapters/primary/config/uowConfig";
import {
  BadRequestError,
  NotFoundError,
} from "../../../adapters/primary/helpers/httpErrors";
import { CustomTimeGateway } from "../../../adapters/secondary/core/TimeGateway/CustomTimeGateway";
import { TestUuidGenerator } from "../../../adapters/secondary/core/UuidGeneratorImplementations";
import { InMemoryUowPerformer } from "../../../adapters/secondary/InMemoryUowPerformer";
import { DeterministShortLinkIdGeneratorGateway } from "../../../adapters/secondary/shortLinkIdGeneratorGateway/DeterministShortLinkIdGeneratorGateway";
import { makeGenerateJwtES256 } from "../../auth/jwt";
import { makeCreateNewEvent } from "../../core/eventBus/EventBus";
import { RenewMagicLinkPayload } from "./notifications/DeliverRenewedMagicLink";
import { RenewConventionMagicLink } from "./RenewConventionMagicLink";

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

const defaultAgency = AgencyDtoBuilder.create(validConvention.agencyId).build();
const email = "some email";

describe("RenewConventionMagicLink use case", () => {
  const config: AppConfig = new AppConfigBuilder()
    .withTestPresetPreviousKeys()
    .build();
  const generateConventionJwt = makeGenerateJwtES256<"convention">(
    config.jwtPrivateKey,
    undefined,
  );
  const timeGateway = new CustomTimeGateway(new Date());

  let uow: InMemoryUnitOfWork;
  let useCase: RenewConventionMagicLink;
  let shortLinkIdGeneratorGateway: DeterministShortLinkIdGeneratorGateway;

  beforeEach(() => {
    uow = createInMemoryUow();
    uow.agencyRepository.setAgencies([defaultAgency]);
    uow.conventionRepository.setConventions({
      [validConvention.id]: validConvention,
    });
    shortLinkIdGeneratorGateway = new DeterministShortLinkIdGeneratorGateway();
    useCase = new RenewConventionMagicLink(
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
    it.each<[Role, string]>([
      ["beneficiary", validConvention.signatories.beneficiary.email],
      [
        "beneficiary-current-employer",
        validConvention.signatories.beneficiaryCurrentEmployer!.email,
      ],
      [
        "beneficiary-representative",
        validConvention.signatories.beneficiaryRepresentative!.email,
      ],
      [
        "legal-representative",
        validConvention.signatories.beneficiaryRepresentative!.email,
      ],
      [
        "establishment",
        validConvention.signatories.establishmentRepresentative.email,
      ],
      [
        "establishment-representative",
        validConvention.signatories.establishmentRepresentative.email,
      ],
      ...defaultAgency.counsellorEmails.map(
        (counsellorEmail): [Role, string] => ["counsellor", counsellorEmail],
      ),
      ...defaultAgency.validatorEmails.map((validatorEmail): [Role, string] => [
        "validator",
        validatorEmail,
      ]),
    ])(
      "Posts an event to deliver a correct JWT for correct responses for role %s",
      async (expectedRole, expectedEmails) => {
        const expiredPayload = createConventionMagicLinkPayload({
          id: validConvention.id,
          role: expectedRole,
          email: expectedEmails,
          now: timeGateway.now(),
        });

        const request: RenewMagicLinkRequestDto = {
          originalUrl: "immersionfacile.fr/verifier-et-signer",
          expiredJwt: generateConventionJwt(expiredPayload),
        };

        const shortLinks = ["shortLink1", "shortLink2"];
        shortLinkIdGeneratorGateway.addMoreShortLinkIds(shortLinks);

        await useCase.execute(request);

        expect(uow.outboxRepository.events).toHaveLength(1);

        const renewalEvent = uow.outboxRepository.events[0];
        expect(renewalEvent.topic).toBe("MagicLinkRenewalRequested");

        const dispatchedPayload = renewalEvent.payload as RenewMagicLinkPayload;
        expect(dispatchedPayload.emails).toEqual([expectedEmails]);

        expectToEqual(
          [dispatchedPayload.magicLink, dispatchedPayload.conventionStatusLink],
          [
            `${config.immersionFacileBaseUrl}/api/${shortLinkRoute}/${shortLinks[0]}`,
            `${config.immersionFacileBaseUrl}/api/${shortLinkRoute}/${shortLinks[1]}`,
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
      },
    );

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

      const request: RenewMagicLinkRequestDto = {
        originalUrl: "immersionfacile.fr%2Fverifier-et-signer",
        expiredJwt: generateConventionJwt(expiredPayload),
      };

      await useCase.execute(request);
      // should not throw error
      expect(uow.outboxRepository.events).toHaveLength(1);
    });
  });

  describe("Wrong paths", () => {
    it("requires a valid application id", async () => {
      const payload = createConventionMagicLinkPayload({
        id: "not-a-valid-id",
        role: "counsellor",
        email,
        now: timeGateway.now(),
      });

      const request: RenewMagicLinkRequestDto = {
        originalUrl: "immersionfacile.com/%jwt%",
        expiredJwt: generateConventionJwt(payload),
      };

      await expectPromiseToFailWithError(
        useCase.execute(request),
        new NotFoundError("not-a-valid-id"),
      );
    });

    it("requires a known agency id", async () => {
      const storedUnknownId = "some unknown agency id";
      const entity = new ConventionDtoBuilder()
        .withAgencyId(storedUnknownId)
        .build();
      uow.conventionRepository.setConventions({ [entity.id]: entity });

      const payload = createConventionMagicLinkPayload({
        id: validConvention.id,
        role: "counsellor",
        email,
        now: timeGateway.now(),
      });

      const request: RenewMagicLinkRequestDto = {
        originalUrl: "immersionfacile.com/%jwt%",
        expiredJwt: generateConventionJwt(payload),
      };

      await expectPromiseToFailWithError(
        useCase.execute(request),
        new BadRequestError(storedUnknownId),
      );
    });

    // Admins use non-magic-link based authentication, so no need to renew these.
    it("Refuses to generate backoffice magic links", async () => {
      const payload = createConventionMagicLinkPayload({
        id: validConvention.id,
        role: "backOffice",
        email,
        now: timeGateway.now(),
      });

      const request: RenewMagicLinkRequestDto = {
        originalUrl: "immersionfacile.com/verification",
        expiredJwt: generateConventionJwt(payload),
      };

      await expectPromiseToFailWithError(
        useCase.execute(request),
        new BadRequestError("Le backoffice n'a pas de liens magiques."),
      );
    });

    it("does not accept to renew links from url that are not supported", async () => {
      const payload = createConventionMagicLinkPayload({
        id: validConvention.id,
        role: "counsellor",
        email,
        now: timeGateway.now(),
      });

      const request: RenewMagicLinkRequestDto = {
        originalUrl: "immersionfacile.com/",
        expiredJwt: generateConventionJwt(payload),
      };

      await expectPromiseToFailWithError(
        useCase.execute(request),
        new BadRequestError(
          `Wrong link format, should be one of the supported route: /demande-immersion, /verifier-et-signer, /pilotage-convention, /bilan-immersion. It was : ${request.originalUrl}`,
        ),
      );
    });
  });
});
