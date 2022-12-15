import {
  AbsoluteUrl,
  AgencyDtoBuilder,
  ConventionDto,
  ConventionDtoBuilder,
  createConventionMagicLinkPayload,
  expectPromiseToFailWithError,
  RenewMagicLinkRequestDto,
} from "shared";
import { AppConfigBuilder } from "../../../_testBuilders/AppConfigBuilder";

import { AppConfig } from "../../../adapters/primary/config/appConfig";
import { createInMemoryUow } from "../../../adapters/primary/config/uowConfig";
import {
  BadRequestError,
  NotFoundError,
} from "../../../adapters/primary/helpers/httpErrors";
import { CustomClock } from "../../../adapters/secondary/core/ClockImplementations";
import { InMemoryOutboxRepository } from "../../../adapters/secondary/core/InMemoryOutboxRepository";
import { TestUuidGenerator } from "../../../adapters/secondary/core/UuidGeneratorImplementations";
import { InMemoryAgencyRepository } from "../../../adapters/secondary/InMemoryAgencyRepository";
import { InMemoryConventionRepository } from "../../../adapters/secondary/InMemoryConventionRepository";
import { InMemoryUowPerformer } from "../../../adapters/secondary/InMemoryUowPerformer";
import { RenewMagicLinkPayload } from "./notifications/NotifyBeneficiaryAndEnterpriseThatApplicationNeedsModification";
import { RenewConventionMagicLink } from "./RenewConventionMagicLink";
import {
  CreateNewEvent,
  makeCreateNewEvent,
} from "../../core/eventBus/EventBus";
import {
  GenerateMagicLinkJwt,
  makeGenerateJwtES256,
  makeVerifyJwtES256,
} from "../../auth/jwt";

const validConvention: ConventionDto = new ConventionDtoBuilder().build();

const defaultAgency = AgencyDtoBuilder.create(validConvention.agencyId).build();
const immersionBaseUrl: AbsoluteUrl = "http://immersion-fake.com";

describe("RenewConventionMagicLink use case", () => {
  let conventionRepository: InMemoryConventionRepository;
  let outboxRepository: InMemoryOutboxRepository;
  let clock: CustomClock;
  let uuidGenerator: TestUuidGenerator;
  let createNewEvent: CreateNewEvent;
  let agencyRepository: InMemoryAgencyRepository;
  let config: AppConfig;
  let generateJwtFn: GenerateMagicLinkJwt;
  let renewConventionMagicLink: RenewConventionMagicLink;

  beforeEach(() => {
    const uow = createInMemoryUow();
    conventionRepository = uow.conventionRepository;
    outboxRepository = uow.outboxRepository;
    agencyRepository = uow.agencyRepository;
    agencyRepository.setAgencies([defaultAgency]);
    clock = new CustomClock();
    clock.setNextDate(new Date());
    uuidGenerator = new TestUuidGenerator();
    createNewEvent = makeCreateNewEvent({ clock, uuidGenerator });

    const entity = new ConventionDtoBuilder().build();
    conventionRepository.setConventions({ [entity.id]: entity });
    config = new AppConfigBuilder().withTestPresetPreviousKeys().build();

    generateJwtFn = makeGenerateJwtES256(config.magicLinkJwtPrivateKey);
    renewConventionMagicLink = new RenewConventionMagicLink(
      new InMemoryUowPerformer(uow),
      createNewEvent,
      generateJwtFn,
      config,
      clock,
      immersionBaseUrl,
    );
  });

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
      renewConventionMagicLink.execute(request),
      new NotFoundError("not-a-valid-id"),
    );
  });

  it("requires a known agency id", async () => {
    const storedUnknownId = "some unknown agency id";
    const entity = new ConventionDtoBuilder()
      .withAgencyId(storedUnknownId)
      .build();
    conventionRepository.setConventions({ [entity.id]: entity });

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
      renewConventionMagicLink.execute(request),
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
      renewConventionMagicLink.execute(request),
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
      renewConventionMagicLink.execute(request),
      new BadRequestError(
        `Wrong link format, should be one of the supported route: /demande-immersion, /verifier-et-signer, /verification, /bilan-immersion. It was : ${request.originalUrl}`,
      ),
    );
  });

  it("Posts an event to deliver a correct JWT for correct responses", async () => {
    const expiredPayload = createConventionMagicLinkPayload(
      validConvention.id,
      "beneficiary",
      validConvention.signatories.beneficiary.email,
    );

    const request: RenewMagicLinkRequestDto = {
      originalUrl: "immersionfacile.fr/verifier-et-signer",
      expiredJwt: generateJwtFn(expiredPayload),
    };

    await renewConventionMagicLink.execute(request);

    expect(outboxRepository.events).toHaveLength(1);
    const renewalEvent = outboxRepository.events[0];
    expect(renewalEvent.topic).toBe("MagicLinkRenewalRequested");
    const dispatchedPayload = renewalEvent.payload as RenewMagicLinkPayload;
    expect(dispatchedPayload["emails"]).toEqual([
      validConvention.signatories.beneficiary.email,
    ]);
    const ml = dispatchedPayload.magicLink;
    const expectedNewLinkStart = `${immersionBaseUrl}/verifier-et-signer?jwt=`;
    expect(ml.startsWith(expectedNewLinkStart)).toBeTruthy();
    const jwt = ml.replace(expectedNewLinkStart, "");

    const verifyJwt = makeVerifyJwtES256(config.magicLinkJwtPublicKey);
    expect(verifyJwt(jwt)).toBeDefined();
  });
});
