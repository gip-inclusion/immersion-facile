import { SequenceRunner } from "../../../domain/core/ports/SequenceRunner";
import { sleep } from "../../../shared/utils";
import { createLogger } from "../../../utils/logger";

const logger = createLogger(__filename);

export class ThrottledSequenceRunner implements SequenceRunner {
  constructor(
    private throttleDuration: number,
    private maxNumberOfError: number,
  ) {}

  public async run<Input, Output>(
    array: Input[],
    cb: (param: Input) => Promise<Output>,
    errorCount?: number,
  ): Promise<Array<Output | undefined>> {
    if (array.length === 0) return [];
    const [toProcessNow, ...nextArray] = array;

    let processed: Output;
    try {
      processed = await cb(toProcessNow);
    } catch (_) {
      if (errorCount && errorCount >= this.maxNumberOfError) {
        logger.warn(
          `Tried ${errorCount} times with no success, will return undefined`,
        );
        return [undefined, ...(await this.run<Input, Output>(nextArray, cb))];
      }
      await sleep(this.throttleDuration);
      const newErrorCount = errorCount ? errorCount + 1 : 1;
      return this.run(array, cb, newErrorCount);
    }

    await sleep(this.throttleDuration);
    return [processed, ...(await this.run<Input, Output>(nextArray, cb))];
  }
}
