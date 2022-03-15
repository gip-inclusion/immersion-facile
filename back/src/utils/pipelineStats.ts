import intervalToDuration from "date-fns/intervalToDuration";

class Timer {
  private endTime: Date | undefined;

  public constructor(private readonly startTime = new Date()) {}

  public stop(endTime = new Date()) {
    this.endTime = endTime;
  }

  public getDurationMs() {
    const end = this.endTime || new Date();
    return end.getTime() - this.startTime.getTime();
  }

  public readStats() {
    return {
      start_time: this.startTime,
      is_stopped: !!this.endTime,
      ...{ end_time: this.endTime },
      duration: intervalToDuration({ start: 0, end: this.getDurationMs() }),
      duration_ms: this.getDurationMs(),
    };
  }
}

class SampleStats {
  private readonly stats = {
    sample_count: 0,
    total: 0,
    min: +Infinity,
    avg: 0,
    max: -Infinity,
  };

  public recordSample(value: number) {
    this.stats.sample_count++;
    this.stats.total += value;
    this.stats.min = Math.min(this.stats.min, value);
    this.stats.avg = this.stats.total / this.stats.sample_count;
    this.stats.max = Math.max(this.stats.max, value);
  }

  public readStats() {
    return { ...this.stats };
  }
}

export class PipelineStats {
  private readonly counters: { [name: string]: number } = {};
  private readonly timers: { [name: string]: Timer } = {};
  private readonly internalTimers: { [name: string]: Timer } = {};
  private readonly sampleStats: { [name: string]: SampleStats } = {};

  public constructor(private readonly prefix: string = "") {}

  public readStats() {
    return Object.fromEntries(
      Object.entries({
        ...this.counters,
        ...this.readTimers(),
        ...this.readSampleStats(),
      })
        .sort(([k1], [k2]) => (k1 > k2 ? 1 : -1))
        .map(([name, value]) => [`${this.prefix}-${name}`, value]),
    );
  }

  private readTimers() {
    return Object.fromEntries(
      Object.entries(this.timers).map(([name, timer]) => [
        name,
        timer.readStats(),
      ]),
    );
  }

  private readSampleStats() {
    return Object.fromEntries(
      Object.entries(this.sampleStats).map(([name, sampleStats]) => [
        name,
        sampleStats.readStats(),
      ]),
    );
  }

  public incCounter(name: string, increment = 1) {
    if (!this.counters[name]) this.counters[name] = 0;
    this.counters[name] += increment;
  }

  public recordSample(name: string, value: number) {
    if (!this.sampleStats[name]) this.sampleStats[name] = new SampleStats();
    this.sampleStats[name].recordSample(value);
  }

  public startTimer(name: string, startTime = new Date()) {
    this.timers[name] = new Timer(startTime);
  }

  public stopTimer(name: string, endTime = new Date()) {
    if (!this.timers[name]) this.startTimer(name, endTime);
    this.timers[name].stop();
  }

  // Warning: We support only a single active timer per aggregate timer at the moment.
  // Any already active timer will be silently discarded when this method is called.
  public startAggregateTimer(name: string, startTime = new Date()) {
    this.internalTimers[name] = new Timer(startTime);
  }

  public stopAggregateTimer(name: string, endTime = new Date()) {
    if (!this.internalTimers[name]) this.startAggregateTimer(name, endTime);
    this.internalTimers[name].stop();
    this.recordSample(name, this.internalTimers[name].getDurationMs());
    delete this.internalTimers[name];
  }
}
