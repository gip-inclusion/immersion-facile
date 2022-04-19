import { ApplicationEvent } from "../events/ApplicationEvent";

export abstract class UseCase {
  abstract execute(event: ApplicationEvent): Promise<void>;
}
