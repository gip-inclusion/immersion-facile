import CommentIcon from "@mui/icons-material/Comment";
import LaunchIcon from "@mui/icons-material/Launch";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import SentimentSatisfiedAltIcon from "@mui/icons-material/SentimentSatisfiedAlt";
import React, { ReactNode } from "react";
import { ButtonSearch } from "react-design-system/immersionFacile";
import {
  addressDtoToString,
  ContactMethod,
  SearchImmersionResultDto,
} from "shared";
import { DistanceIcon } from "src/icons/DistanceIcon";
import { TrefleIcon } from "src/icons/TrefleIcon";

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
    <div
      className="pl-2 w-full text-justify"
      style={{ whiteSpace: "pre-line" }}
    >
      {children}
    </div>
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
    customizedName,
    distance_m,
    address,
    contactMode,
    numberOfEmployeeRange,
    nafLabel,
    romeLabel,
    appellationLabels,
    voluntaryToImmersion,
    website,
    additionalInformation,
  } = searchResult;
  const distanceKm = ((distance_m ?? 0) / 1000).toFixed(1);
  return (
    <div className="flex flex-col items-stretch p-4 w-[80%] bg-white my-4 rounded border-solid border-gray-400 border gap-4">
      <div className="flex flex-wrap justify-between">
        <div className="pb-2">
          <div className="font-bold text-xl leading-6 text-immersionRed-light pb-1">
            {customizedName ?? name}
          </div>
          {nafLabel && <div className="font-bold">{nafLabel}</div>}
          <div>
            {appellationLabels.length > 0
              ? appellationLabels.join(", ")
              : romeLabel}
          </div>
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
        {addressDtoToString(address).toLocaleLowerCase()}
      </SearchResultInfo>
      {website && (
        <SearchResultInfo icon={<LaunchIcon sx={{ color: iconColor }} />}>
          <a href={website}>{website}</a>
        </SearchResultInfo>
      )}
      {additionalInformation && (
        <SearchResultInfo icon={<CommentIcon sx={{ color: iconColor }} />}>
          {additionalInformation}
        </SearchResultInfo>
      )}
      <hr className="pb-2" />
      <ButtonSearch onClick={onButtonClick} disabled={disableButton}>
        {contactMode === "PHONE" ||
        contactMode === "EMAIL" ||
        contactMode === "IN_PERSON"
          ? "Contacter l'entreprise"
          : "Tentez votre chance"}
      </ButtonSearch>
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
      return (
        <div className={allStyles}>
          <TrefleIcon /> Tentez votre chance
        </div>
      );

    default:
      return null;
  }
};
