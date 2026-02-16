import {
  type AbsoluteUrl,
  errors,
  frontRoutes,
  makeUrlWithQueryParams,
} from "shared";
import z from "zod";
import { useCaseBuilder } from "../../../core/useCaseBuilder";
import type { TimeGateway } from "../../time-gateway/ports/TimeGateway";

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
        const jwt = new URL(shortLink.url).searchParams.get("jwt");
        if (!jwt)
          throw errors.shortLink.invalidUrl({ shortLinkId: inputParams });
        return `${immersionFacileBaseUrl}${makeUrlWithQueryParams(
          `/${frontRoutes.linkAlreadyUsed}`,
          { shortLinkId: inputParams, jwt },
        )}`;
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
