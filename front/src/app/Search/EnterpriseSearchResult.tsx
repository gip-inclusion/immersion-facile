import React, { ReactNode } from "react";
import { DistanceIcon } from "src/assets/DistanceIcon";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import { SearchButton } from "src/components/SearchButton";
import { SearchImmersionResultDto } from "src/shared/SearchImmersionDto";

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
  } = searchResult;
  const distanceKm = ((distance_m ?? 0) / 1000).toFixed(1);

  return (
    <div className="flex flex-col items-stretch p-4 w-[80%] bg-white my-4 rounded border-solid border-gray-400 border gap-4">
      <div className="pb-2">
        <div className="font-bold text-xl leading-6 text-immersionRed-light pb-1">
          {name}
        </div>
        {nafLabel && <div>{nafLabel}</div>}
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
