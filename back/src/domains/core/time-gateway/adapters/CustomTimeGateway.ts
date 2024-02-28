import { DateString } from "shared";
import { TimeGateway } from "../ports/TimeGateway";

export class CustomTimeGateway implements TimeGateway {
  #nextDates: Date[] = [];

  #defaultDate: Date;

  constructor(defaultDate = new Date("2021-09-01T10:10:00.000Z")) {
    this.#defaultDate = defaultDate;
  }

  public set defaultDate(date: Date) {
    this.#defaultDate = date;
  }

  public now() {
    return this.#nextDates.shift() ?? this.#defaultDate;
  }

  public setNextDate(date: Date) {
    this.#nextDates.push(date);
  }

  public setNextDates(dates: Date[]) {
    this.#nextDates = dates;
  }

  public setNextDateStr(dateStr: DateString) {
    this.setNextDate(new Date(dateStr));
  }
}
