import React, { useEffect, useState } from "react";
import { apiAdresseGateway } from "src/app/dependencies";
import { LatLonDto } from "src/shared/SearchImmersionDto";

export type PostcodeAutocompleteProps = {
  initialSearchTerm?: string;
  disabled?: boolean;
  inputStyle?: React.CSSProperties;
  onFound: (position: LatLonDto) => void;
};

export const PostcodeAutocomplete = ({
  disabled,
  inputStyle,
  initialSearchTerm = "",
  onFound,
}: PostcodeAutocompleteProps) => {
  const [searchTerm, setSearchTerm] = useState<string>(initialSearchTerm);
  const [error, setError] = useState<any | null>(null);

  const getAddressesFromApi = async (
    term: string,
  ): Promise<LatLonDto | null> => {
    const sanitizedTerm = term.trim();
    if (!sanitizedTerm) return null;
    try {
      const position = await apiAdresseGateway.lookupPostCode(sanitizedTerm);
      if (position) {
        onFound(position);
      }
      return position;
    } catch (e: any) {
      setError(e);
      return null;
    }
  };

  useEffect(() => {
    getAddressesFromApi(searchTerm);
  }, [searchTerm]);

  const onChange = (changeEvt: React.ChangeEvent<HTMLInputElement>) => {
    const postCode = changeEvt.target.value.trim();
    if (parseInt(postCode) > 9999 && parseInt(postCode) < 100000) {
      setError(null);
      setSearchTerm(postCode);
    } else {
      setError("Veuillez indiquer un code postale valide");
    }
  };

  return (
    <div>
      <input
        style={inputStyle}
        disabled={disabled}
        className={"fr-input"}
        placeholder="Code postale"
        onChange={onChange}
      />
      {error && (
        <p id={`post-code-error-desc-error`} className="fr-error-text">
          {error}
        </p>
      )}
    </div>
  );
};
