import { makeGenerateJwt, makeVerifyJwt } from "./../../../domain/auth/jwt";
import { AppConfig } from "./../../../adapters/primary/appConfig";
import {
  BadRequestError,
  NotFoundError,
} from "../../../adapters/primary/helpers/sendHttpResponse";
import { CustomClock } from "../../../adapters/secondary/core/ClockImplementations";
import { TestUuidGenerator } from "../../../adapters/secondary/core/UuidGeneratorImplementations";
import { InMemoryAgencyRepository } from "../../../adapters/secondary/InMemoryAgencyRepository";
import { InMemoryImmersionApplicationRepository } from "../../../adapters/secondary/InMemoryImmersionApplicationRepository";
import { GenerateMagicLinkJwt } from "../../../domain/auth/jwt";
import { AgencyConfig } from "../../../domain/immersionApplication/ports/AgencyRepository";
import {
  ImmersionApplicationDto,
  RenewMagicLinkRequestDto,
} from "../../../shared/ImmersionApplicationDto";
import { createMagicLinkPayload } from "../../../shared/tokens/MagicLinkPayload";
import { AgencyConfigBuilder } from "../../../_testBuilders/AgencyConfigBuilder";
import { ImmersionApplicationEntityBuilder } from "../../../_testBuilders/ImmersionApplicationEntityBuilder";
import { expectPromiseToFailWithError } from "../../../_testBuilders/test.helpers";
import { InMemoryOutboxRepository } from "./../../../adapters/secondary/core/InMemoryOutboxRepository";
import {
  CreateNewEvent,
  makeCreateNewEvent,
} from "./../../../domain/core/eventBus/EventBus";
import { RenewMagicLink } from "./../../../domain/immersionApplication/useCases/RenewMagicLink";
import { AppConfigBuilder } from "../../../_testBuilders/AppConfigBuilder";
import jwt from "jsonwebtoken";
import { RenewMagicLinkPayload } from "../../../domain/immersionApplication/useCases/notifications/NotifyBeneficiaryAndEnterpriseThatApplicationNeedsModification";

const validDemandeImmersion: ImmersionApplicationDto =
  new ImmersionApplicationEntityBuilder().build().toDto();

const defaultAgencyConfig = AgencyConfigBuilder.create(
  validDemandeImmersion.agencyId,
).build();

describe("RenewMagicLink use case", () => {
  let agencyConfig: AgencyConfig;
  let applicationRepository: InMemoryImmersionApplicationRepository;
  let outboxRepository: InMemoryOutboxRepository;
  let clock: CustomClock;
  let uuidGenerator: TestUuidGenerator;
  let createNewEvent: CreateNewEvent;
  let agencyRepository: InMemoryAgencyRepository;
  let config: AppConfig;

  let generateJwtFn: GenerateMagicLinkJwt;
  let generateLegacyV0JwtFn: (payload: any) => string;

  beforeEach(() => {
    agencyConfig = defaultAgencyConfig;
    applicationRepository = new InMemoryImmersionApplicationRepository();
    outboxRepository = new InMemoryOutboxRepository();
    clock = new CustomClock();
    clock.setNextDate(new Date());
    uuidGenerator = new TestUuidGenerator();
    createNewEvent = makeCreateNewEvent({ clock, uuidGenerator });
    agencyRepository = new InMemoryAgencyRepository([agencyConfig]);

    const entity = new ImmersionApplicationEntityBuilder().build();
    applicationRepository.setDemandesImmersion({ [entity.id]: entity });
    config = new AppConfigBuilder().withTestPresetPreviousKeys().build();

    generateJwtFn = makeGenerateJwt(config);
    // This is the JWT function that was used with the V0 magic links
    generateLegacyV0JwtFn = (payload: any) =>
      jwt.sign(payload, config.jwtPreviousPrivateKey as string, {
        algorithm: "ES256",
      });
  });

  const createUseCase = () => {
    return new RenewMagicLink(
      applicationRepository,
      createNewEvent,
      outboxRepository,
      agencyRepository,
      generateJwtFn,
      config,
      clock,
    );
  };

  it("requires a valid application id", async () => {
    const payload = createMagicLinkPayload(
      "not-a-valid-id",
      "counsellor",
      "some email",
    );

    const request: RenewMagicLinkRequestDto = {
      linkFormat: "immersionfacile.com/%jwt%",
      expiredJWT: generateJwtFn(payload),
    };

    await expectPromiseToFailWithError(
      createUseCase().execute(request),
      new NotFoundError("not-a-valid-id"),
    );
  });

  it("requires a known agency id", async () => {
    const storedUnknownId = "some unknown agency id";
    const entity = new ImmersionApplicationEntityBuilder()
      .withAgencyId(storedUnknownId)
      .build();
    applicationRepository.setDemandesImmersion({ [entity.id]: entity });

    const payload = createMagicLinkPayload(
      validDemandeImmersion.id,
      "counsellor",
      "some email",
    );

    const request: RenewMagicLinkRequestDto = {
      linkFormat: "immersionfacile.com/%jwt%",
      expiredJWT: generateJwtFn(payload),
    };

    await expectPromiseToFailWithError(
      createUseCase().execute(request),
      new BadRequestError(storedUnknownId),
    );
  });

  // Admins use non-magic-link based authentication, so no need to renew these.
  it("Refuses to generate admin magic links", async () => {
    const payload = createMagicLinkPayload(
      validDemandeImmersion.id,
      "admin",
      "some email",
    );

    const request: RenewMagicLinkRequestDto = {
      linkFormat: "immersionfacile.com/%jwt%",
      expiredJWT: generateJwtFn(payload),
    };

    await expectPromiseToFailWithError(
      createUseCase().execute(request),
      new BadRequestError("L'admin n'a pas de liens magiques."),
    );
  });

  it("requires a link format that includes %jwt% string", async () => {
    const payload = createMagicLinkPayload(
      validDemandeImmersion.id,
      "counsellor",
      "some email",
    );

    const request: RenewMagicLinkRequestDto = {
      linkFormat: "immersionfacile.com/",
      expiredJWT: generateJwtFn(payload),
    };

    await expectPromiseToFailWithError(
      createUseCase().execute(request),
      new BadRequestError(request.linkFormat),
    );
  });

  it("Posts an event to deliver a correct JWT for correct responses", async () => {
    const expiredPayload = createMagicLinkPayload(
      validDemandeImmersion.id,
      "beneficiary",
      validDemandeImmersion.email,
    );

    const request: RenewMagicLinkRequestDto = {
      linkFormat: "immersionfacile.fr/%jwt%",
      expiredJWT: generateJwtFn(expiredPayload),
    };

    await createUseCase().execute(request);

    const expectedJWT = generateJwtFn(
      createMagicLinkPayload(
        validDemandeImmersion.id,
        "beneficiary",
        validDemandeImmersion.email,
      ),
    );

    expect(outboxRepository.events).toHaveLength(1);
    const renewalEvent = outboxRepository.events[0];
    expect(renewalEvent.topic).toEqual("MagicLinkRenewalRequested");
    const dispatchedPayload = renewalEvent.payload as RenewMagicLinkPayload;
    expect(dispatchedPayload["emails"]).toEqual([validDemandeImmersion.email]);
    const ml = dispatchedPayload.magicLink;
    expect(ml.startsWith("immersionfacile.fr/"));
    const jwt = ml.replace("immersionfacile.fr/", "");

    const verifyJwt = makeVerifyJwt(config.jwtPublicKey);
    expect(verifyJwt(jwt)).not.toBeUndefined();
  });
});
