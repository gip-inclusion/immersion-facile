import intervalToDuration from "date-fns/intervalToDuration";

export class PipelineStats {
  private counters: { [name: string]: number } = {};
  private timers: {
    [name: string]: { start: Date; end?: Date };
  } = {};

  public constructor(private readonly prefix: string = "") {}

  public readStats() {
    return Object.fromEntries(
      Object.entries({
        ...this.counters,
        ...this.readTimers(),
      }).map(([name, value]) => [`${this.prefix}-${name}`, value]),
    );
  }

  private readTimers() {
    const now = new Date();
    return Object.fromEntries(
      Object.entries(this.timers).map(([name, { start, end }]) => [
        name,
        {
          is_stopped: !!end,
          start,
          ...{ end: end ?? undefined },
          duration: intervalToDuration({ start, end: end ?? now }),
        },
      ]),
    );
  }

  public incCounter(name: string, increment = 1) {
    if (!this.counters[name]) this.counters[name] = 0;
    this.counters[name] += increment;
  }

  public startTimer(name: string, startTime = new Date()) {
    this.timers[name] = { start: startTime };
  }

  public stopTimer(name: string, endTime = new Date()) {
    if (!this.timers[name]) this.startTimer(name, endTime);
    this.timers[name].end = endTime;
  }
}
