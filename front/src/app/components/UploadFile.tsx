import * as React from "react";
import { File } from "react-design-system";
import type { AbsoluteUrl } from "shared";
import { domElementIds } from "shared";
import { outOfReduxDependencies } from "src/config/dependencies";

interface UploadLogoProps {
  label: string;
  hint?: React.ReactNode;
  maxSize_Mo: number;
  setFileUrl: (fileUrl: AbsoluteUrl) => void;
}

export const UploadFile = ({
  maxSize_Mo,
  setFileUrl,
  label,
  hint,
}: UploadLogoProps) => {
  const [error, setError] = React.useState<string>();
  return (
    <File
      onChange={async (e) => {
        let file = null;
        if (e.target.files?.length) {
          file = e.target.files[0];
        }
        if (file && file.size > 1_000_000 * maxSize_Mo) {
          setError(`Le fichier ne peut pas faire plus de ${maxSize_Mo} Mo`);
          return;
        }
        setError(undefined);
        if (!file) return;

        const fileUrl =
          await outOfReduxDependencies.technicalGateway.uploadFile(file);
        setFileUrl(fileUrl);
      }}
      label={label}
      hint={hint}
      errorMessage={error}
      id={domElementIds.addAgency.uploadLogoInput}
    />
  );
};
