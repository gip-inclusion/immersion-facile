import { AgencyDtoBuilder } from "shared/src/agency/AgencyDtoBuilder";
import {
  ConventionDto,
  RenewMagicLinkRequestDto,
} from "shared/src/convention/convention.dto";
import { ConventionDtoBuilder } from "shared/src/convention/ConventionDtoBuilder";
import { createConventionMagicLinkPayload } from "shared/src/tokens/MagicLinkPayload";
import { AppConfigBuilder } from "../../../_testBuilders/AppConfigBuilder";
import { expectPromiseToFailWithError } from "../../../_testBuilders/test.helpers";
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
import {
  GenerateMagicLinkJwt,
  makeGenerateJwtES256,
  makeVerifyJwtES256,
} from "../../../domain/auth/jwt";
import { RenewMagicLinkPayload } from "../../../domain/convention/useCases/notifications/NotifyBeneficiaryAndEnterpriseThatApplicationNeedsModification";
import { RenewConventionMagicLink } from "../../../domain/convention/useCases/RenewConventionMagicLink";
import {
  CreateNewEvent,
  makeCreateNewEvent,
} from "../../../domain/core/eventBus/EventBus";

const validConvention: ConventionDto = new ConventionDtoBuilder().build();

const defaultAgency = AgencyDtoBuilder.create(validConvention.agencyId).build();

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
    );
  });

  it("requires a valid application id", async () => {
    const payload = createConventionMagicLinkPayload(
      "not-a-valid-id",
      "counsellor",
      "some email",
    );

    const request: RenewMagicLinkRequestDto = {
      linkFormat: "immersionfacile.com/%jwt%",
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
      linkFormat: "immersionfacile.com/%jwt%",
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
      linkFormat: "immersionfacile.com/%jwt%",
      expiredJwt: generateJwtFn(payload),
    };

    await expectPromiseToFailWithError(
      renewConventionMagicLink.execute(request),
      new BadRequestError("L'admin n'a pas de liens magiques."),
    );
  });

  it("requires a link format that includes %jwt% string", async () => {
    const payload = createConventionMagicLinkPayload(
      validConvention.id,
      "counsellor",
      "some email",
    );

    const request: RenewMagicLinkRequestDto = {
      linkFormat: "immersionfacile.com/",
      expiredJwt: generateJwtFn(payload),
    };

    await expectPromiseToFailWithError(
      renewConventionMagicLink.execute(request),
      new BadRequestError(request.linkFormat),
    );
  });

  it("Posts an event to deliver a correct JWT for correct responses", async () => {
    const expiredPayload = createConventionMagicLinkPayload(
      validConvention.id,
      "beneficiary",
      validConvention.signatories.beneficiary.email,
    );

    const request: RenewMagicLinkRequestDto = {
      linkFormat: "immersionfacile.fr/%jwt%",
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
    expect(ml.startsWith("immersionfacile.fr/")).toBeTruthy();
    const jwt = ml.replace("immersionfacile.fr/", "");

    const verifyJwt = makeVerifyJwtES256(config.magicLinkJwtPublicKey);
    expect(verifyJwt(jwt)).toBeDefined();
  });
});
