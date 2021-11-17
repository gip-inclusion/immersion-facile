import { ThrottledSequenceRunner } from "../../adapters/secondary/core/ThrottledSequenceRunner";

describe("ThrottledSequenceRunner", () => {
  let sequenceRunner: ThrottledSequenceRunner;
  beforeEach(() => {
    sequenceRunner = new ThrottledSequenceRunner(0, 3);
  });

  it("when every thing works fine with no failure", async () => {
    const result = await sequenceRunner.run(
      ["1", "word"],
      async (str) => str.length,
    );
    expect(result).toEqual([1, 4]);
  });

  it("when an errors occurs, retries and end with undefined after max number of retries", async () => {
    const result = await sequenceRunner.run(["a", "bb", "ccc"], async (str) => {
      if (str.length === 2)
        throw new Error("Does not handle string of length 2");
      return str.length;
    });
    expect(result).toEqual([1, undefined, 3]);
  });
});
