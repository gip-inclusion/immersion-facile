import {
  AbsoluteUrl,
  CreateConventionMagicLinkPayloadProperties,
  shortLinkRoute,
} from "shared";
import { AppConfig } from "../../adapters/primary/config/appConfig";
import { GenerateConventionMagicLinkUrl } from "../../adapters/primary/config/magicLinkUrl";
import { ShortLinkIdGeneratorGateway } from "./ports/ShortLinkIdGeneratorGateway";
import { ShortLinkId } from "./ports/ShortLinkQuery";
import { UnitOfWork } from "./ports/UnitOfWork";

export const makeShortLinkUrl = (
  config: AppConfig,
  shortLinkId: ShortLinkId,
): AbsoluteUrl =>
  `${config.immersionFacileBaseUrl}/api/${shortLinkRoute}/${shortLinkId}`;

export const shortLinkNotFoundMessage = (shortLinkId: ShortLinkId): string =>
  `Short link '${shortLinkId}' not found.`;

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

export const prepareMagicShortLinkMaker =
  ({
    conventionMagicLinkPayload,
    uow,
    generateConventionMagicLinkUrl,
    shortLinkIdGeneratorGateway,
    config,
  }: MakeMagicLinkAndProvidesShortLinkProperties) =>
  async (targetRoute: string): Promise<AbsoluteUrl> =>
    makeShortLink({
      uow,
      shortLinkIdGeneratorGateway,
      config,
      longLink: generateConventionMagicLinkUrl({
        ...conventionMagicLinkPayload,
        targetRoute,
      }),
    });

export const makeShortLink = async ({
  uow,
  shortLinkIdGeneratorGateway,
  config,
  longLink,
}: ProvidesShortLinkProperties): Promise<AbsoluteUrl> => {
  const conventionSignShortLinkId: ShortLinkId =
    await shortLinkIdGeneratorGateway.generate();

  await uow.shortLinkRepository.save(conventionSignShortLinkId, longLink);

  return makeShortLinkUrl(config, conventionSignShortLinkId);
};
