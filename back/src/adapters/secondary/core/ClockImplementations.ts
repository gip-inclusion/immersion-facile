import { Clock, DateStr } from "../../../domain/core/ports/Clock";

export class CustomClock implements Clock {
  constructor(private _nextDate: DateStr = "2021-09-01T10:10:00.000Z") {}

  public now() {
    return this._nextDate;
  }

  setNextDate(date: DateStr) {
    this._nextDate = date;
  }
}

export class RealClock implements Clock {
  public now() {
    return new Date().toISOString();
  }
}
