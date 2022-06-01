import { useField } from "formik";
import React, { useEffect, useState } from "react";
import { apiAdresseGateway } from "src/app/config/dependencies";
import { ConventionDto } from "shared/src/convention/convention.dto";
import { LatLonDto } from "shared/src/latLon";
import { TextInput } from "src/uiComponents/form/TextInput";

export type PostcodeAutocompleteProps = {
  initialSearchTerm?: string;
  disabled?: boolean;
  inputStyle?: React.CSSProperties;
  onFound: (position: LatLonDto) => void;
};

export const PostcodeAutocomplete = ({
  disabled,
  onFound,
}: PostcodeAutocompleteProps) => {
  const name: keyof ConventionDto = "postalCode";
  const [{ value }] = useField<string>({ name });
  const [error, setError] = useState<any | null>(null);

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    (async () => {
      const sanitizedTerm = value.trim();
      if (sanitizedTerm.length !== 5) return;
      try {
        const position = await apiAdresseGateway.lookupPostCode(sanitizedTerm);
        if (position) {
          onFound(position);
          setError(null);
        } else {
          setError("Code postal inconnu");
        }
      } catch (e: any) {
        setError(e);
        return;
      }
    })();
  }, [value]);

  return (
    <>
      <TextInput label="Votre code postal *" name={name} disabled={disabled} />
      {error && (
        <p id={`post-code-error-desc-error`} className="fr-error-text">
          {error}
        </p>
      )}
    </>
  );
};
