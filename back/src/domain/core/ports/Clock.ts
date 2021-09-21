import { Flavor } from "../../../shared/typeFlavors";

export type DateStr = Flavor<string, "DateStr">;

export interface Clock {
  now: () => DateStr;
}
