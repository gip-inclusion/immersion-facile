import { fr } from "@codegouvfr/react-dsfr";
import React, { Fragment } from "react";
import {
  SliceOfString,
  highlightStringsFromMatches,
} from "src/app/utils/highlightStringsFromMatches";
import { Proposal } from "./Proposal";

export const StringWithHighlights = ({
  description,
  matchRanges,
}: Pick<Proposal<unknown>, "description" | "matchRanges">) => {
  const slices: SliceOfString[] =
    matchRanges.length === 0
      ? onNoMatchRanges(description)
      : highlightStringsFromMatches(matchRanges, description);

  return (
    <span>
      {slices.map(
        ({ startIndexInclusive, endIndexExclusive, bolded }, index) => {
          const text = description.slice(
            startIndexInclusive,
            endIndexExclusive,
          );
          if (bolded)
            return (
              // biome-ignore lint/suspicious/noArrayIndexKey: Index is ok here
              <span className={fr.cx("fr-text--bold")} key={index}>
                {text}
              </span>
            );
          // biome-ignore lint/suspicious/noArrayIndexKey: Index is ok here
          return <Fragment key={index}>{text}</Fragment>;
        },
      )}
    </span>
  );
};

const onNoMatchRanges = (description: string) => [
  {
    startIndexInclusive: 0,
    endIndexExclusive: description.length,
    bolded: false,
  },
];
