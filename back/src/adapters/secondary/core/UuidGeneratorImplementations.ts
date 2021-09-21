import { UuidGenerator } from "../../../domain/core/ports/UuidGenerator";
import { v4 as uuidV4 } from "uuid";

// To be used mostly for tests
export class TestUuidGenerator implements UuidGenerator {
  constructor(private _nextUuid: string = "myGeneratedUuid") {}

  public new() {
    return this._nextUuid;
  }

  // for test purposes only
  public setNextUuid(uuid: string) {
    this._nextUuid = uuid;
  }
}

// Now the real one for prod
export class UuidV4Generator implements UuidGenerator {
  public new() {
    return uuidV4();
  }
}
