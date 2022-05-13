import { File } from "@dataesr/react-dsfr";
import * as React from "react";
import { technicalGateway } from "src/app/config/dependencies";

interface UploadFileProps {
  label: string;
  hint?: string;
  maxSize_Mo: number;
}

export const UploadFile = ({ maxSize_Mo }: UploadFileProps) => {
  const [error, setError] = React.useState<string>();
  return (
    <File
      onChange={async (e) => {
        const file = e.target.files[0];
        console.log("new file", file);
        if (file.size > 1_000_000 * maxSize_Mo) {
          setError(`Le fichier ne peut pas faire plus de ${maxSize_Mo} Mo`);
          return;
        } else {
          setError(undefined);
        }
        if (!file) return;
        await technicalGateway.uploadFile(file);
      }}
      label="Vous pouvez également télécharger votre logo."
      hint="Cela permettra de personnaliser les mails automatisés."
      errorMessage={error}
    />
  );
};
