import { fr } from "@codegouvfr/react-dsfr";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { type ChangeEvent, type ReactNode, useState } from "react";
import { CopyButton, File } from "react-design-system";
import type { AbsoluteUrl } from "shared";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import { outOfReduxDependencies } from "src/config/dependencies";
import { authSelectors } from "src/core-logic/domain/auth/auth.selectors";

interface UploadLogoProps {
  label: string;
  hint?: ReactNode;
  maxSize_Mo: number;
  setUploadedFileUrl?: (fileUrl: AbsoluteUrl) => void;
  initialFileUrl?: AbsoluteUrl;
  id: string;
  shouldDisplayFeedback: boolean;
}

export const UploadFile = ({
  maxSize_Mo,
  setUploadedFileUrl,
  label,
  hint,
  id,
  shouldDisplayFeedback,
  initialFileUrl,
}: UploadLogoProps) => {
  const copyButtonLabel = "Copier l'URL du fichier";
  const [error, setError] = useState<string>();
  const [uploadError, setUploadError] = useState<string>();
  const [file, setFile] = useState<File | null>(null);
  const [fileUrl, setFileUrl] = useState<AbsoluteUrl | null>(null);
  const [fileBase64, setFileBase64] = useState<string | ArrayBuffer | null>(
    null,
  );
  const connectedUserJwt = useAppSelector(authSelectors.inclusionConnectToken);

  if (!connectedUserJwt) return null;

  const toBase64 = (file: File) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => setFileBase64(reader.result);
    reader.onerror = () => setFileBase64(null);
  };

  const setUploadedFile = (file: File, fileUrl: AbsoluteUrl) => {
    setFile(file);
    toBase64(file);
    setFileUrl(fileUrl);
    setUploadedFileUrl ? setUploadedFileUrl(fileUrl) : null;
  };

  return (
    <>
      <File
        onChange={async (e: ChangeEvent<HTMLInputElement>) => {
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

          try {
            const fileUrl =
              await outOfReduxDependencies.technicalGateway.uploadFile(
                file,
                connectedUserJwt,
              );
            setUploadedFile(file, fileUrl);
          } catch (error: any) {
            const errorMessage =
              "message" in error
                ? error.message
                : "Une erreur est survenue lors de l'upload de fichier";
            setUploadError(errorMessage);
          }
        }}
        label={label}
        hint={hint}
        errorMessage={error}
        id={id}
      />
      {((file?.type.startsWith("image/") && fileBase64) || initialFileUrl) && (
        <div className={fr.cx("fr-col-3")}>
          <figure
            className={fr.cx("fr-content-media", "fr-m-0", "fr-mt-2w")}
            aria-label="Aperçu de l'image"
          >
            <div className={fr.cx("fr-content-media__img")}>
              {initialFileUrl && !fileBase64 ? (
                <img src={initialFileUrl} alt="" />
              ) : (
                <img
                  className={fr.cx("fr-responsive-img", "fr-ratio-16x9")}
                  src={String(fileBase64)}
                  alt=""
                />
              )}
            </div>
            <figcaption className={fr.cx("fr-content-media__caption")}>
              Aperçu de l'image
            </figcaption>
          </figure>
        </div>
      )}
      {shouldDisplayFeedback && (
        <>
          {uploadError && <Alert severity="error" title={uploadError} />}
          {!uploadError && fileUrl && (
            <>
              <Alert
                severity="success"
                title="Fichier uploadé !"
                description={`URL du fichier : ${fileUrl}`}
                className={fr.cx("fr-mb-2w", "fr-mt-2w")}
              />
              <CopyButton textToCopy={fileUrl} label={copyButtonLabel} />
            </>
          )}
        </>
      )}
    </>
  );
};
