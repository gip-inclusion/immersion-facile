import { Flavor } from "shared/src/typeFlavors";

type StoredFileId = Flavor<string, "StoredFileId">;

export interface StoredFile {
  id: StoredFileId;
  name: string;
  encoding: string;
  size: number;
  path: string;
}
