import type { AbsoluteUrl, ShortLinkId } from "shared";
import type { AppConfig } from "../../../config/bootstrap/appConfig";
import type {
  ConventionMagicLinkLifetime,
  GenerateConnectedUserLoginUrl,
  GenerateConnectedUserLoginUrlParams,
  GenerateConventionMagicLinkUrl,
  GenerateEmailAuthCodeUrl,
  GenerateEmailAuthCodeUrlParams,
} from "../../../config/bootstrap/magicLinkUrl";
import type { CreateConventionMagicLinkPayloadProperties } from "../../../utils/jwt";
import type { UnitOfWork } from "../unit-of-work/ports/UnitOfWork";
import type { ShortLinkIdGeneratorGateway } from "./ports/ShortLinkIdGeneratorGateway";

export const makeShortLinkUrl = (
  config: AppConfig,
  shortLinkId: ShortLinkId,
): AbsoluteUrl => `${config.immersionFacileBaseUrl}/api/to/${shortLinkId}`;

type MakeMagicLinkAndProvidesShortLinkProperties = {
  conventionMagicLinkPayload: CreateConventionMagicLinkPayloadProperties;
  uow: UnitOfWork;
  generateConventionMagicLinkUrl: GenerateConventionMagicLinkUrl;
  shortLinkIdGeneratorGateway: ShortLinkIdGeneratorGateway;
  config: AppConfig;
};

type ProvidesShortLinkProperties = {
  uow: UnitOfWork;
  shortLinkIdGeneratorGateway: ShortLinkIdGeneratorGateway;
  config: AppConfig;
  longLink: AbsoluteUrl;
  singleUse: boolean;
};

export const prepareConventionMagicShortLinkMaker =
  ({
    conventionMagicLinkPayload,
    uow,
    generateConventionMagicLinkUrl,
    shortLinkIdGeneratorGateway,
    config,
  }: MakeMagicLinkAndProvidesShortLinkProperties) =>
  async ({
    targetRoute,
    lifetime,
    extraQueryParams,
    singleUse,
  }: {
    extraQueryParams?: Record<string, string>;
    targetRoute: string;
    lifetime: ConventionMagicLinkLifetime;
    singleUse: boolean;
  }): Promise<AbsoluteUrl> =>
    makeShortLink({
      uow,
      shortLinkIdGeneratorGateway,
      config,
      longLink: generateConventionMagicLinkUrl({
        ...conventionMagicLinkPayload,
        targetRoute,
        lifetime,
        extraQueryParams,
      }),
      singleUse,
    });

export const prepareConnectedUserMagicShortLinkMaker =
  ({
    uow,
    config,
    shortLinkIdGeneratorGateway,
    generateConnectedUserLoginUrl,
  }: {
    uow: UnitOfWork;
    config: AppConfig;
    shortLinkIdGeneratorGateway: ShortLinkIdGeneratorGateway;
    generateConnectedUserLoginUrl: GenerateConnectedUserLoginUrl;
  }) =>
  (params: GenerateConnectedUserLoginUrlParams): Promise<AbsoluteUrl> =>
    makeShortLink({
      uow,
      config,
      shortLinkIdGeneratorGateway,
      longLink: generateConnectedUserLoginUrl(params),
      singleUse: false,
    });

export const prepareEmailAuthCodeShortLinkMaker =
  ({
    uow,
    config,
    shortLinkIdGeneratorGateway,
    generateEmailAuthCodeLoginUrl,
  }: {
    uow: UnitOfWork;
    config: AppConfig;
    shortLinkIdGeneratorGateway: ShortLinkIdGeneratorGateway;
    generateEmailAuthCodeLoginUrl: GenerateEmailAuthCodeUrl;
  }) =>
  (params: GenerateEmailAuthCodeUrlParams): Promise<AbsoluteUrl> =>
    makeShortLink({
      uow,
      config,
      shortLinkIdGeneratorGateway,
      longLink: generateEmailAuthCodeLoginUrl(params),
      singleUse: false,
    });

export const makeShortLink = async ({
  uow,
  shortLinkIdGeneratorGateway,
  config,
  longLink,
  singleUse,
}: ProvidesShortLinkProperties): Promise<AbsoluteUrl> => {
  const shortlinkId: ShortLinkId = shortLinkIdGeneratorGateway.generate();

  await uow.shortLinkRepository.save(shortlinkId, longLink, singleUse);

  return makeShortLinkUrl(config, shortlinkId);
};
