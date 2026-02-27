import { type AbsoluteUrl, errors } from "shared";
import z from "zod";
import { useCaseBuilder } from "../../../core/useCaseBuilder";
import type { TimeGateway } from "../../time-gateway/ports/TimeGateway";

export type GetLink = ReturnType<typeof makeGetLink>;

export const makeGetLink = useCaseBuilder("GetLink")
  .withInput(z.string())
  .withOutput<AbsoluteUrl>()
  .withDeps<{
    timeGateway: TimeGateway;
  }>()
  .build(async ({ inputParams, uow, deps: { timeGateway } }) => {
    const shortLink = await uow.shortLinkQuery.getById(inputParams);
    if (!shortLink)
      throw errors.shortLink.notFound({ shortLinkId: inputParams });

    await uow.shortLinkRepository.save({
      ...shortLink,
      lastUsedAt: timeGateway.now(),
    });

    return shortLink.url;
  });
