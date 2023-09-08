/* eslint-disable no-console */
import { AppLogger } from "../../../domain/core/ports/AppLogger";

export class ConsoleAppLogger implements AppLogger {
  public debug(...messages: any[]): void {
    console.debug(...messages);
  }

  public error(...messages: any[]): void {
    console.error(...messages);
  }

  public info(...messages: any[]): void {
    console.log(...messages);
  }

  public warn(...messages: any[]): void {
    console.warn(...messages);
  }
}
