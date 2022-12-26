import { Flavor } from "shared";

export type DateStr = Flavor<string, "DateStr">;

export abstract class TimeGateway {
  abstract now(): Date;
}
