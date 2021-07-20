export interface Clock {
  getNow: () => Date;
}

export class RealClock implements Clock {
  getNow() {
    return new Date();
  }
}

export class CustomClock implements Clock {
  nextDate = new Date();

  getNow() {
    return this.nextDate;
  }

  setNextDate(date: Date) {
    this.nextDate = date;
  }
}
