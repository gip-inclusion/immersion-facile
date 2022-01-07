import { UuidGenerator } from "../../../domain/core/ports/UuidGenerator";
import { v4 as uuidV4 } from "uuid";

// To be used mostly for tests
export class TestUuidGenerator implements UuidGenerator {
  constructor(private _nextUuids: string[] = []) {}

  public new() {
    return this._nextUuids.shift() ?? "no-uuid-provided";
  }

  // for test purposes only
  public setNextUuid(uuid: string) {
    this._nextUuids.push(uuid);
  }

  public setNextUuids(uuids: string[]) {
    this._nextUuids = uuids;
  }
}

// Now the real one for prod
export class UuidV4Generator implements UuidGenerator {
  public new() {
    return uuidV4();
  }
}
