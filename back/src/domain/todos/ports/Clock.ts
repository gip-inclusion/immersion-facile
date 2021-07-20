export interface Clock {
  getNow: () => Date;
}

export class RealClock implements Clock {
  getNow() {
    return new Date();
  }
}

export class CustomClock implements Clock {
  nextDate = new Date("2021-07-21T10:00:00");

  getNow() {
    return this.nextDate;
  }

  setNextDate(date: Date) {
    this.nextDate = date;
  }
}
