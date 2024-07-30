import {
  AbsoluteUrl,
  CreateConventionMagicLinkPayloadProperties,
  ShortLinkId,
} from "shared";
import { AppConfig } from "../../../config/bootstrap/appConfig";
import { GenerateConventionMagicLinkUrl } from "../../../config/bootstrap/magicLinkUrl";
import { UnitOfWork } from "../unit-of-work/ports/UnitOfWork";
import { ShortLinkIdGeneratorGateway } from "./ports/ShortLinkIdGeneratorGateway";

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
    shortLinkIdGeneratorGateway.generate();

  await uow.shortLinkRepository.save(conventionSignShortLinkId, longLink);

  return makeShortLinkUrl(config, conventionSignShortLinkId);
};
