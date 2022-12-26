import { TimeGateway } from "../../../../domain/core/ports/TimeGateway";

export class RealTimeGateway extends TimeGateway {
  public now() {
    return new Date();
  }
}
