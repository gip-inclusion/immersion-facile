import { TimeGateway } from "../ports/TimeGateway";

export class RealTimeGateway implements TimeGateway {
  public now() {
    return new Date();
  }
}
