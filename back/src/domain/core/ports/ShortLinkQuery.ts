import { AbsoluteUrl, Flavor, shortLinkRoute } from "shared";
import { AppConfig } from "../../../adapters/primary/config/appConfig";

export type ShortLinkId = Flavor<string, "ShortLinkId">;

export interface ShortLinkQuery {
  getById(id: ShortLinkId): Promise<AbsoluteUrl>;
}

export const makeShortLinkUrl = (
  config: AppConfig,
  shortLinkId: ShortLinkId,
): AbsoluteUrl =>
  `${config.immersionFacileBaseUrl}/api/${shortLinkRoute}/${shortLinkId}`;

export const shortLinkNotFoundMessage = (shortLinkId: ShortLinkId): string =>
  `Short link '${shortLinkId}' not found.`;
