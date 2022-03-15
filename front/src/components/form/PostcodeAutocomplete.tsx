import { useField } from "formik";
import React, { useEffect, useState } from "react";
import { apiAdresseGateway } from "src/app/dependencies";
import { TextInput } from "src/components/form/TextInput";
import { ImmersionApplicationDto } from "src/shared/ImmersionApplication/ImmersionApplication.dto";
import { LatLonDto } from "src/shared/SearchImmersionDto";

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
  const name: keyof ImmersionApplicationDto = "postalCode";
  const [{ value }] = useField<string>({ name });
  const [error, setError] = useState<any | null>(null);

  useEffect(() => {
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
