import {
  AbsoluteUrl,
  AgencyDtoBuilder,
  BeneficiaryCurrentEmployer,
  BeneficiaryRepresentative,
  ConventionDto,
  ConventionDtoBuilder,
  ConventionMagicLinkPayload,
  createConventionMagicLinkPayload,
  expectPromiseToFailWithError,
  expectToEqual,
  RenewMagicLinkRequestDto,
  Role,
} from "shared";
import { AppConfigBuilder } from "../../../_testBuilders/AppConfigBuilder";

import { AppConfig } from "../../../adapters/primary/config/appConfig";
import {
  createInMemoryUow,
  InMemoryUnitOfWork,
} from "../../../adapters/primary/config/uowConfig";
import {
  BadRequestError,
  NotFoundError,
} from "../../../adapters/primary/helpers/httpErrors";
import { CustomClock } from "../../../adapters/secondary/core/ClockImplementations";
import { TestUuidGenerator } from "../../../adapters/secondary/core/UuidGeneratorImplementations";
import { InMemoryUowPerformer } from "../../../adapters/secondary/InMemoryUowPerformer";
import { makeGenerateJwtES256, makeVerifyJwtES256 } from "../../auth/jwt";
import { makeCreateNewEvent } from "../../core/eventBus/EventBus";
import { RenewMagicLinkPayload } from "./notifications/NotifyBeneficiaryAndEnterpriseThatApplicationNeedsModification";
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
};
const beneficiaryRepresentative: BeneficiaryRepresentative = {
  email: "beneficiaryRepresentative@mail.com",
  firstName: "",
  lastName: "",
  phone: "",
  role: "beneficiary-representative",
};
const validConvention: ConventionDto = new ConventionDtoBuilder()
  .withBeneficiaryCurentEmployer(currentEmployer)
  .withBeneficiaryRepresentative(beneficiaryRepresentative)
  .build();

const defaultAgency = AgencyDtoBuilder.create(validConvention.agencyId).build();
const immersionBaseUrl: AbsoluteUrl = "http://immersion-fake.com";

describe("RenewConventionMagicLink use case", () => {
  const config: AppConfig = new AppConfigBuilder()
    .withTestPresetPreviousKeys()
    .build();
  const generateJwtFn = makeGenerateJwtES256(config.magicLinkJwtPrivateKey);
  const clock = new CustomClock(new Date());

  let uow: InMemoryUnitOfWork;
  let useCase: RenewConventionMagicLink;

  beforeEach(() => {
    const entity = new ConventionDtoBuilder()
      .withBeneficiaryCurentEmployer(currentEmployer)
      .withBeneficiaryRepresentative(beneficiaryRepresentative)
      .build();

    uow = createInMemoryUow();
    uow.agencyRepository.setAgencies([defaultAgency]);
    uow.conventionRepository.setConventions({ [entity.id]: entity });
    useCase = new RenewConventionMagicLink(
      new InMemoryUowPerformer(uow),
      makeCreateNewEvent({
        clock,
        uuidGenerator: new TestUuidGenerator(),
      }),
      generateJwtFn,
      config,
      clock,
      immersionBaseUrl,
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
        const expiredPayload = createConventionMagicLinkPayload(
          validConvention.id,
          expectedRole,
          expectedEmails,
        );

        const request: RenewMagicLinkRequestDto = {
          originalUrl: "immersionfacile.fr/verifier-et-signer",
          expiredJwt: generateJwtFn(expiredPayload),
        };

        await useCase.execute(request);

        expect(uow.outboxRepository.events).toHaveLength(1);

        const renewalEvent = uow.outboxRepository.events[0];
        expect(renewalEvent.topic).toBe("MagicLinkRenewalRequested");

        const dispatchedPayload = renewalEvent.payload as RenewMagicLinkPayload;
        expect(dispatchedPayload.emails).toEqual([expectedEmails]);

        const [url, jwt] = dispatchedPayload.magicLink.split("?jwt=");
        expect(url).toBe(`${immersionBaseUrl}/verifier-et-signer`);

        expectToEqual(
          makeVerifyJwtES256<ConventionMagicLinkPayload>(
            config.magicLinkJwtPublicKey,
          )(jwt),
          createConventionMagicLinkPayload(
            validConvention.id,
            expectedRole,
            expectedEmails,
            undefined,
            () => clock.now().getTime(),
          ),
        );
      },
    );

    it("Also work when using encoded Url", async () => {
      const expiredPayload = createConventionMagicLinkPayload(
        validConvention.id,
        "beneficiary",
        validConvention.signatories.beneficiary.email,
      );

      const request: RenewMagicLinkRequestDto = {
        originalUrl: "immersionfacile.fr%2Fverifier-et-signer",
        expiredJwt: generateJwtFn(expiredPayload),
      };

      await useCase.execute(request);
      // should not throw error
      expect(uow.outboxRepository.events).toHaveLength(1);
    });
  });

  describe("Wrong paths", () => {
    it("requires a valid application id", async () => {
      const payload = createConventionMagicLinkPayload(
        "not-a-valid-id",
        "counsellor",
        "some email",
      );

      const request: RenewMagicLinkRequestDto = {
        originalUrl: "immersionfacile.com/%jwt%",
        expiredJwt: generateJwtFn(payload),
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

      const payload = createConventionMagicLinkPayload(
        validConvention.id,
        "counsellor",
        "some email",
      );

      const request: RenewMagicLinkRequestDto = {
        originalUrl: "immersionfacile.com/%jwt%",
        expiredJwt: generateJwtFn(payload),
      };

      await expectPromiseToFailWithError(
        useCase.execute(request),
        new BadRequestError(storedUnknownId),
      );
    });

    // Admins use non-magic-link based authentication, so no need to renew these.
    it("Refuses to generate admin magic links", async () => {
      const payload = createConventionMagicLinkPayload(
        validConvention.id,
        "admin",
        "some email",
      );

      const request: RenewMagicLinkRequestDto = {
        originalUrl: "immersionfacile.com/verification",
        expiredJwt: generateJwtFn(payload),
      };

      await expectPromiseToFailWithError(
        useCase.execute(request),
        new BadRequestError("L'admin n'a pas de liens magiques."),
      );
    });

    it("does not accept to renew links from url that are not supported", async () => {
      const payload = createConventionMagicLinkPayload(
        validConvention.id,
        "counsellor",
        "some email",
      );

      const request: RenewMagicLinkRequestDto = {
        originalUrl: "immersionfacile.com/",
        expiredJwt: generateJwtFn(payload),
      };

      await expectPromiseToFailWithError(
        useCase.execute(request),
        new BadRequestError(
          `Wrong link format, should be one of the supported route: /demande-immersion, /verifier-et-signer, /verification, /bilan-immersion. It was : ${request.originalUrl}`,
        ),
      );
    });
  });
});
