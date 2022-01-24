import React, { ReactNode } from "react";
import { DistanceIcon } from "src/assets/DistanceIcon";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import { TrefleIcon } from "src/assets/TrefleIcon";
import { SearchButton } from "src/components/SearchButton";
import { ContactMethod } from "src/shared/FormEstablishmentDto";
import { SearchImmersionResultDto } from "src/shared/SearchImmersionDto";
import SentimentSatisfiedAltIcon from "@mui/icons-material/SentimentSatisfiedAlt";

type EnterpriseSearchResultProps = {
  searchResult: SearchImmersionResultDto;
  onButtonClick: () => void;
  disableButton?: boolean;
};

type SearchResultInfoProps = {
  icon: ReactNode;
  children: ReactNode;
};

const SearchResultInfo = ({ children, icon }: SearchResultInfoProps) => (
  <div className="flex">
    {icon}
    <div className="pl-2 w-full text-justify">{children}</div>
  </div>
);

const iconColor = "#FF9575";

export const EnterpriseSearchResult = ({
  onButtonClick,
  disableButton,
  searchResult,
}: EnterpriseSearchResultProps) => {
  const {
    name,
    distance_m,
    address,
    contactMode,
    numberOfEmployeeRange,
    nafLabel,
    voluntaryToImmersion,
  } = searchResult;
  const distanceKm = ((distance_m ?? 0) / 1000).toFixed(1);

  return (
    <div className="flex flex-col items-stretch p-4 w-[80%] bg-white my-4 rounded border-solid border-gray-400 border gap-4">
      <div className="flex flex-wrap justify-between">
        <div className="pb-2">
          <div className="font-bold text-xl leading-6 text-immersionRed-light pb-1">
            {name}
          </div>
          {nafLabel && <div>{nafLabel}</div>}
        </div>
        <InfoLabel
          className=""
          contactMode={contactMode}
          voluntaryToImmersion={voluntaryToImmersion}
        />
      </div>
      <SearchResultInfo icon={<DistanceIcon sx={{ color: iconColor }} />}>
        <div className="flex justify-between w-full">
          <div>{distanceKm + " km"}</div>
          {numberOfEmployeeRange && (
            <div>
              {numberOfEmployeeRange}{" "}
              {numberOfEmployeeRange === "0" ? "salarié" : "salariés"}
            </div>
          )}
        </div>
      </SearchResultInfo>
      <SearchResultInfo icon={<LocationOnIcon sx={{ color: iconColor }} />}>
        {address.toLocaleLowerCase()}
      </SearchResultInfo>
      <hr className="pb-2" />
      <SearchButton onClick={onButtonClick} disabled={disableButton}>
        {contactMode === "PHONE" ||
        contactMode === "EMAIL" ||
        contactMode === "IN_PERSON"
          ? "Contacter l'entreprise"
          : "Tentez votre chance"}
      </SearchButton>
    </div>
  );
};

type InfoLabelProps = {
  voluntaryToImmersion?: boolean;
  contactMode?: ContactMethod;
  className?: string;
};

const InfoLabel = ({
  contactMode,
  voluntaryToImmersion,
  className,
}: InfoLabelProps) => {
  const defaultStyles =
    "text-immersionBlue bg-blue-50 rounded-md p-2 w-56 h-10 text-center";
  const allStyles = `${defaultStyles} ${className}`;

  if (voluntaryToImmersion) {
    return (
      <div className={allStyles}>
        <SentimentSatisfiedAltIcon /> Entreprise accueillante
      </div>
    );
  }

  switch (contactMode) {
    case undefined:
    case "UNKNOWN":
      return (
        <div className={allStyles}>
          <TrefleIcon /> Tentez votre chance
        </div>
      );

    default:
      return null;
  }
};
