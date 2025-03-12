import { nanoid } from "nanoid";
import type { ShortLinkId } from "shared";
import { createLogger } from "../../../../../utils/logger";
import type { ShortLinkIdGeneratorGateway } from "../../ports/ShortLinkIdGeneratorGateway";

const logger = createLogger(__filename);

//2023-04-27: NANO ID used with version ^3.0.0 instead of latest (^4.0.0) due to ESM module errors with jest
export class NanoIdShortLinkIdGeneratorGateway
  implements ShortLinkIdGeneratorGateway
{
  public readonly idSize = 36;

  public generate(): ShortLinkId {
    const id = nanoid(this.idSize);
    logger.info({
      message: `shortlink id generated: ${id}`,
    });
    return id;
  }
}
