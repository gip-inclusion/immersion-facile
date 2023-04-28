import { ShortLinkId } from "../../../domain/core/ports/ShortLinkQuery";
import { NanoIdShortLinkIdGeneratorGateway } from "./NanoIdShortLinkIdGeneratorGateway";

describe("shortLinkGenerator manual test", () => {
  const shortLinkQty = 100000;
  const shortLinkIds: ShortLinkId[] = [];
  const shortLinkGenerator = new NanoIdShortLinkIdGeneratorGateway();

  it(`generate ${shortLinkQty} ids`, () => {
    for (let index = 0; index < shortLinkQty; index++) {
      shortLinkIds.push(shortLinkGenerator.generate());
    }
    expect(shortLinkIds.length === shortLinkQty).toBeTruthy();
  });
  describe("make sure there is no collision on large shortLink Id generation", () => {
    it(`make sure there is not collision for ${shortLinkQty} shortLinkIds`, () => {
      expect(new Set(shortLinkIds).size === shortLinkQty).toBeTruthy();
    });
    it(`confirm each shortLinkIds have unique size of ${shortLinkGenerator.idSize}`, () => {
      const sizes = new Set(shortLinkIds.map((record) => record.length));
      expect(sizes.size === 1).toBeTruthy();
      expect(sizes.has(shortLinkGenerator.idSize)).toBeTruthy();
    });
  });
});
