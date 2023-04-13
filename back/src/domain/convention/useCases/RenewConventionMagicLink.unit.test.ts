import {
  AbsoluteUrl,
  AgencyDtoBuilder,
  BeneficiaryCurrentEmployer,
  BeneficiaryRepresentative,
  ConventionDto,
  ConventionDtoBuilder,
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
import { CustomTimeGateway } from "../../../adapters/secondary/core/TimeGateway/CustomTimeGateway";
import { TestUuidGenerator } from "../../../adapters/secondary/core/UuidGeneratorImplementations";
import { InMemoryUowPerformer } from "../../../adapters/secondary/InMemoryUowPerformer";
import { makeGenerateJwtES256, makeVerifyJwtES256 } from "../../auth/jwt";
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
const immersionBaseUrl: AbsoluteUrl = "http://immersion-fake.com";
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

  beforeEach(() => {
    uow = createInMemoryUow();
    uow.agencyRepository.setAgencies([defaultAgency]);
    uow.conventionRepository.setConventions({
      [validConvention.id]: validConvention,
    });
    useCase = new RenewConventionMagicLink(
      new InMemoryUowPerformer(uow),
      makeCreateNewEvent({
        timeGateway,
        uuidGenerator: new TestUuidGenerator(),
      }),
      generateConventionJwt,
      config,
      timeGateway,
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

        await useCase.execute(request);

        expect(uow.outboxRepository.events).toHaveLength(1);

        const renewalEvent = uow.outboxRepository.events[0];
        expect(renewalEvent.topic).toBe("MagicLinkRenewalRequested");

        const dispatchedPayload = renewalEvent.payload as RenewMagicLinkPayload;
        expect(dispatchedPayload.emails).toEqual([expectedEmails]);

        const [url, jwt] = dispatchedPayload.magicLink.split("?jwt=");
        expect(url).toBe(`${immersionBaseUrl}/verifier-et-signer`);

        expectToEqual(
          makeVerifyJwtES256<"convention">(config.jwtPublicKey)(jwt),
          createConventionMagicLinkPayload({
            id: validConvention.id,
            role: expectedRole,
            email: expectedEmails,
            now: timeGateway.now(),
          }),
        );
      },
    );

    it("Also work when using encoded Url", async () => {
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
          `Wrong link format, should be one of the supported route: /demande-immersion, /verifier-et-signer, /pilotage-convention, /verification, /bilan-immersion. It was : ${request.originalUrl}`,
        ),
      );
    });
  });
});
