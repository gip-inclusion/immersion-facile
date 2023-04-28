import { nanoid } from "nanoid";
import { ShortLinkIdGeneratorGateway } from "../../../domain/core/ports/ShortLinkIdGeneratorGateway";
import { ShortLinkId } from "../../../domain/core/ports/ShortLinkQuery";

//2023-04-27: NANO ID used with version ^3.0.0 instead of latest (^4.0.0) due to ESM module errors with jest
export class NanoIdShortLinkIdGeneratorGateway
  implements ShortLinkIdGeneratorGateway
{
  public generate(): ShortLinkId {
    return nanoid(this.idSize);
  }
  public readonly idSize = 36;
}
