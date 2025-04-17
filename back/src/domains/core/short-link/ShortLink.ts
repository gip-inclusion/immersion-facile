import type {
  AbsoluteUrl,
  CreateConventionMagicLinkPayloadProperties,
  ShortLinkId,
} from "shared";
import type { AppConfig } from "../../../config/bootstrap/appConfig";
import type { GenerateConventionMagicLinkUrl } from "../../../config/bootstrap/magicLinkUrl";
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
  }: {
    targetRoute: string;
    lifetime: "short" | "long";
  }): Promise<AbsoluteUrl> =>
    makeShortLink({
      uow,
      shortLinkIdGeneratorGateway,
      config,
      longLink: generateConventionMagicLinkUrl({
        ...conventionMagicLinkPayload,
        targetRoute,
        lifetime,
      }),
    });

export const makeShortLink = async ({
  uow,
  shortLinkIdGeneratorGateway,
  config,
  longLink,
}: ProvidesShortLinkProperties): Promise<AbsoluteUrl> => {
  const shortlinkId: ShortLinkId = shortLinkIdGeneratorGateway.generate();

  await uow.shortLinkRepository.save(shortlinkId, longLink);

  return makeShortLinkUrl(config, shortlinkId);
};
