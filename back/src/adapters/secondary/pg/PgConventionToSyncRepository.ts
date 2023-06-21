import { ConventionId } from "shared";
import {
  ConventionToSync,
  ConventionToSyncRepository,
} from "../../../domain/convention/ports/ConventionToSyncRepository";

export class PgConventionToSyncRepository
  implements ConventionToSyncRepository
{
  getNotProcessedAndErrored(): Promise<ConventionToSync[]> {
    return Promise.resolve([]);
  }

  save(_filledConvention: ConventionToSync): Promise<void> {
    return Promise.resolve(undefined);
  }

  getById(_id: ConventionId): Promise<ConventionToSync | undefined> {
    return Promise.resolve(undefined);
  }
}
