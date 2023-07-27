import { nanoid } from "nanoid";
import { ShortLinkIdGeneratorGateway } from "../../../domain/core/ports/ShortLinkIdGeneratorGateway";
import { ShortLinkId } from "../../../domain/core/ports/ShortLinkQuery";
import { createLogger } from "../../../utils/logger";

const logger = createLogger(__filename);

//2023-04-27: NANO ID used with version ^3.0.0 instead of latest (^4.0.0) due to ESM module errors with jest
export class NanoIdShortLinkIdGeneratorGateway
  implements ShortLinkIdGeneratorGateway
{
  public readonly idSize = 36;

  public generate(): ShortLinkId {
    const id = nanoid(this.idSize);
    logger.info(
      {
        shortlinkId: id,
      },
      "shortlink id generated",
    );
    return id;
  }
}
