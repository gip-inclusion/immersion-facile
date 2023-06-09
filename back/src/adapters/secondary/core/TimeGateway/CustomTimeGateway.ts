import { addMilliseconds } from "date-fns";
import { DateStr } from "shared";
import { TimeGateway } from "../../../../domain/core/ports/TimeGateway";

export class CustomTimeGateway implements TimeGateway {
  constructor(private _nextDate = new Date("2021-09-01T10:10:00.000Z")) {}

  now() {
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
