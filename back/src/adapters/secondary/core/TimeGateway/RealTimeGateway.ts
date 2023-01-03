import { TimeGateway } from "../../../../domain/core/ports/TimeGateway";

export class RealTimeGateway implements TimeGateway {
  public now() {
    return new Date();
  }
}
