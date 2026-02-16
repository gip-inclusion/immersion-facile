import type { AbsoluteUrl } from "shared";
import { frontRoutes } from "shared";
import z from "zod";
import { useCaseBuilder } from "../../../core/useCaseBuilder";
import type { TimeGateway } from "../../time-gateway/ports/TimeGateway";

const extractJwtFromUrl = (url: string): string | null => {
  return new URL(url).searchParams.get("jwt");
};

export const makeGetLink = useCaseBuilder("GetLink")
  .withInput(z.string())
  .withOutput<AbsoluteUrl>()
  .withDeps<{
    timeGateway: TimeGateway;
    immersionFacileBaseUrl: AbsoluteUrl;
  }>()
  .build(
    async ({
      inputParams,
      uow,
      deps: { timeGateway, immersionFacileBaseUrl },
    }) => {
      const shortLink = await uow.shortLinkQuery.getById(inputParams);

      if (shortLink.singleUse && shortLink.lastUsedAt) {
        const jwt = extractJwtFromUrl(shortLink.url);
        return `${immersionFacileBaseUrl}/${frontRoutes.linkAlreadyUsed}${jwt ? `?jwt=${jwt}` : ""}`;
      }

      if (shortLink.singleUse && !shortLink.lastUsedAt) {
        await uow.shortLinkRepository.markAsUsed(
          inputParams,
          timeGateway.now(),
        );
      }

      return shortLink.url;
    },
  );
