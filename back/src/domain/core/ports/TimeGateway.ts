import { Flavor } from "shared";

export type DateStr = Flavor<string, "DateStr">;

export interface TimeGateway {
  now(): Date;
}
