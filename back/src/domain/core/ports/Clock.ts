import { Flavor } from "../../../shared/typeFlavors";

export type DateStr = Flavor<string, "DateStr">;

export abstract class Clock {
  abstract now(): Date;

  public timestamp() {
    return this.now().getTime();
  }
}
