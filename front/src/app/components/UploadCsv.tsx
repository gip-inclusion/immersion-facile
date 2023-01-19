import * as React from "react";
import { File } from "react-design-system/immersionFacile";

interface UploadCsvProps {
  label: string;
  hint?: string;
  maxSize_Mo: number;
  onUpload: (file: File) => void;
}

export const UploadCsv = ({
  maxSize_Mo,
  label,
  hint,
  onUpload,
}: UploadCsvProps) => {
  const [error, setError] = React.useState<string>();

  return (
    <File
      onChange={(e) => {
        let file = null;
        if (e.target.files?.length) {
          file = e.target.files[0];
          onUpload(file);
        }
        if (file && file.size > 1_000_000 * maxSize_Mo) {
          setError(`Le fichier ne peut pas faire plus de ${maxSize_Mo} Mo`);
          return;
        } else {
          setError(undefined);
        }
        if (!file) return;
      }}
      label={label}
      hint={hint}
      errorMessage={error}
      id="file-upload-csv"
    />
  );
};
