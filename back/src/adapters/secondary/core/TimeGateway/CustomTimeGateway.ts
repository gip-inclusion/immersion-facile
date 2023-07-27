import { addMilliseconds } from "date-fns";
import { DateIsoString } from "shared";
import { TimeGateway } from "../../../../domain/core/ports/TimeGateway";

export class CustomTimeGateway implements TimeGateway {
  constructor(private _nextDate = new Date("2021-09-01T10:10:00.000Z")) {}

  advanceByMs(ms: number) {
    this._nextDate = addMilliseconds(this._nextDate, ms);
  }

  now() {
    return this._nextDate;
  }

  setNextDate(date: Date) {
    this._nextDate = date;
  }

  setNextDateStr(dateStr: DateIsoString) {
    this.setNextDate(new Date(dateStr));
  }
}
