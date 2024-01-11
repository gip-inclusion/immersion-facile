import * as React from "react";
import { AbsoluteUrl, domElementIds } from "shared";
import { File } from "react-design-system";
import { outOfReduxDependencies } from "src/config/dependencies";

interface UploadFileProps {
  setFileUrl: (fileUrl: AbsoluteUrl) => void;
}

const maxSize_Mo = 10;

export const UploadFile = ({ setFileUrl }: UploadFileProps) => {
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
        } else {
          setError(undefined);
        }
        if (!file) return;

        const fileUrl =
          await outOfReduxDependencies.technicalGateway.uploadAnyFile(file);
        setFileUrl(fileUrl);
      }}
      label={"Uploader un fichier"}
      errorMessage={error}
      id={domElementIds.addAgency.uploadLogoInput}
    />
  );
};
