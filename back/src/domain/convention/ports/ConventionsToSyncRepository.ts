import { ConventionId } from "shared";

export type ConventionToSync = {
  id: ConventionId;
} & (
  | {
      status: "TO_PROCESS";
    }
  | {
      status: "SUCCESS";
      processDate: Date;
    }
  | {
      status: "ERROR";
      processDate: Date;
      reason: string;
    }
  | {
      status: "SKIP";
      processDate: Date;
      reason: string;
    }
);

export interface ConventionsToSyncRepository {
  getById(id: ConventionId): Promise<ConventionToSync | undefined>;

  getToProcessOrError(limit: number): Promise<ConventionToSync[]>;

  save(filledConvention: ConventionToSync): Promise<void>;
}
