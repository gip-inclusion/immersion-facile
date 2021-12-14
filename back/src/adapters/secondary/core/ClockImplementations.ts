import { addMilliseconds } from "date-fns";
import { Clock, DateStr } from "../../../domain/core/ports/Clock";

export class CustomClock implements Clock {
  constructor(private _nextDate = new Date("2021-09-01T10:10:00.000Z")) {}

  public now() {
    return this._nextDate;
  }

  setNextDateStr(dateStr: DateStr) {
    this.setNextDate(new Date(dateStr));
  }

  setNextDate(date: Date) {
    this._nextDate = date;
  }

  advanceByMs(ms: number) {
    this._nextDate = addMilliseconds(this._nextDate, ms);
  }
}

export class RealClock implements Clock {
  public now() {
    return new Date();
  }
}
