import React, { memo, useState } from "react";
import LinesEllipsis from "react-lines-ellipsis";
import { fr } from "@codegouvfr/react-dsfr";
import Button from "@codegouvfr/react-dsfr/Button";
import { useStyles } from "tss-react/dsfr";
import {
  addressDtoToString,
  ContactMethod,
  SearchImmersionResultDto,
} from "shared";
import { toAbsoluteUrl } from "shared";
import { getMapsLink } from "../search/ContactModalContent";
import "./SearchResult.scss";

export type EnterpriseSearchResultProps = {
  establishment: SearchImmersionResultDto;
  onButtonClick?: () => void;
  disableButton?: boolean;
  preview?: boolean;
  showDistance?: boolean;
  layout?: "fr-col-lg-4" | "fr-col-md-6";
};

const componentName = "im-search-result";

const SearchResultComponent = ({
  onButtonClick,
  establishment,
  preview,
  layout = "fr-col-lg-4",
  showDistance = true,
}: EnterpriseSearchResultProps) => {
  const { cx } = useStyles();

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
    fitForDisabledWorkers,
    additionalInformation,
  } = establishment;

  const distanceKm = ((distance_m ?? 0) * 0.001).toFixed(1);

  const establishmentRawName =
    customizedName && customizedName.length > 0 ? customizedName : name;

  const [establismentNameFirstLetter, ...establismentNameOtherLetters] =
    establishmentRawName;

  const [additionalInformationClamped, setAdditionalInformationClamped] =
    useState<boolean>(true);

  const [additionalInformationIsTooLong, setAdditionalInformationIsTooLong] =
    useState<boolean>(false);

  const [
    shouldUpdateAdditionalInformationState,
    setShouldUpdateAdditionalInformationState,
  ] = useState<boolean>(true);

  const establismentName = [
    establismentNameFirstLetter.toLocaleUpperCase(),
    establismentNameOtherLetters.join("").toLocaleLowerCase(),
  ].join("");

  const onAdditionalInformationClick = () => {
    setAdditionalInformationClamped((prevValue) => !prevValue);
  };

  const onAdditionalInformationReflow = (additionalInformationDisplayState: {
    clamped: boolean;
    text: string;
  }) => {
    if (shouldUpdateAdditionalInformationState) {
      setAdditionalInformationIsTooLong(
        additionalInformationDisplayState.clamped,
      );
      setShouldUpdateAdditionalInformationState(false);
    }
  };

  return (
    <div className={fr.cx("fr-col-12", "fr-col-md-6", layout)}>
      <div className={cx(fr.cx("fr-card"), componentName)}>
        <div className={fr.cx("fr-card__body")}>
          <div className={fr.cx("fr-card__content")}>
            <h3 className={fr.cx("fr-card__title")}>{establismentName}</h3>
            <p className={fr.cx("fr-card__desc")}>
              {" "}
              {appellationLabels.length > 0
                ? appellationLabels.join(", ")
                : romeLabel}
            </p>
            <ul className={fr.cx("fr-card__desc", "fr-text--xs")}>
              {nafLabel && nafLabel !== "" && <li>{nafLabel}</li>}
              {numberOfEmployeeRange && (
                <li>
                  {numberOfEmployeeRange}{" "}
                  {numberOfEmployeeRange === "0" ? "salarié" : "salariés"}
                </li>
              )}
              <li>
                <a
                  href={getMapsLink(establishment)}
                  target="_blank"
                  className={cx(`${componentName}__location-link`)}
                  rel="noreferrer"
                >
                  {addressDtoToString(address).toLocaleLowerCase()}
                </a>{" "}
                {showDistance && (
                  <span>
                    <strong>
                      {distanceKm}
                      km
                    </strong>{" "}
                    de votre position
                  </span>
                )}
              </li>
              {website && (
                <li>
                  <a
                    href={toAbsoluteUrl(website)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Voir le site de l'entreprise
                  </a>
                </li>
              )}
              {additionalInformation && (
                <li>
                  <LinesEllipsis
                    text={additionalInformation}
                    maxLine={additionalInformationClamped ? 2 : 10}
                    basedOn="letters"
                    ellipsis={"..."}
                    onReflow={onAdditionalInformationReflow}
                  />
                  {additionalInformationIsTooLong && (
                    <button
                      className={fr.cx("fr-tag", "fr-tag--sm", "fr-mt-1w")}
                      onClick={onAdditionalInformationClick}
                    >
                      {additionalInformationClamped
                        ? "Voir plus"
                        : "Voir moins"}
                    </button>
                  )}
                </li>
              )}
            </ul>
            <ul className={fr.cx("fr-card__desc", "fr-badges-group")}>
              <li>
                <InfoLabel
                  contactMode={contactMode}
                  voluntaryToImmersion={voluntaryToImmersion}
                />
              </li>
              {fitForDisabledWorkers && (
                <li>
                  <Label className={fr.cx("fr-badge--yellow-moutarde")}>
                    Priorité aux personnes en situation de handicap
                  </Label>
                </li>
              )}
            </ul>
          </div>
          <div className={fr.cx("fr-card__footer")}>
            <Button
              size="small"
              type="button"
              iconId="fr-icon-mail-fill"
              disabled={preview}
              onClick={
                preview
                  ? () => {
                      //
                    }
                  : onButtonClick
              }
            >
              {contactMode === "PHONE" ||
              contactMode === "EMAIL" ||
              contactMode === "IN_PERSON" ||
              preview
                ? "Contacter l'entreprise"
                : "Tentez votre chance"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const SearchResult = memo(SearchResultComponent, () => true);

type InfoLabelProps = {
  voluntaryToImmersion?: boolean;
  contactMode?: ContactMethod;
  className?: string;
};

const InfoLabel = ({ contactMode, voluntaryToImmersion }: InfoLabelProps) => {
  const { cx } = useStyles();
  const luckyGuess = typeof contactMode === "undefined";
  const className = [
    ...(voluntaryToImmersion ? [fr.cx("fr-badge--blue-cumulus")] : []),
    ...(luckyGuess ? [fr.cx("fr-badge--purple-glycine")] : []),
  ].join(" ");

  const label = voluntaryToImmersion
    ? "Entreprise accueillante"
    : "Tentez votre chance";

  return voluntaryToImmersion || luckyGuess ? (
    <Label className={cx(className)}>{label}</Label>
  ) : null;
};

const Label = ({
  children,
  className,
}: {
  children: string;
  className?: string;
}) => {
  const { cx } = useStyles();
  return <span className={cx(fr.cx("fr-badge"), className)}>{children}</span>;
};
