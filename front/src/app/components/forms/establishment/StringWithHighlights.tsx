import React, { Fragment } from "react";
import { fr } from "@codegouvfr/react-dsfr";
import { MatchRangeDto } from "shared";
import { Proposal } from "./Proposal";

type SliceOfString = {
  startIndexInclusive: number;
  endIndexExclusive: number;
  bolded: boolean;
};

export const StringWithHighlights = ({
  description,
  matchRanges,
}: Pick<Proposal<unknown>, "description" | "matchRanges">) => {
  const slices: SliceOfString[] =
    matchRanges.length === 0
      ? onNoMatchRanges(description)
      : onMatchRange(matchRanges, description);

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
              <span className={fr.cx("fr-text--bold")} key={index}>
                {text}
              </span>
            );
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

const onMatchRange = (matchRanges: MatchRangeDto[], description: string) =>
  matchRanges.reduce(
    (acc, { startIndexInclusive, endIndexExclusive }, index) => {
      const isFirstMatch = acc.length === 0;
      const unboldedRange = {
        startIndexInclusive: isFirstMatch
          ? 0
          : acc[acc.length - 1].endIndexExclusive,
        endIndexExclusive: startIndexInclusive,
        bolded: false,
      };

      const boldedRange = {
        startIndexInclusive,
        endIndexExclusive,
        bolded: true,
      };

      const isLastMatch = index === matchRanges.length - 1;
      const addEndOfDescriptionIfLastMatch = isLastMatch
        ? [
            {
              startIndexInclusive: endIndexExclusive,
              endIndexExclusive: description.length,
              bolded: false,
            },
          ]
        : [];

      return [
        ...acc,
        unboldedRange,
        boldedRange,
        ...addEndOfDescriptionIfLastMatch,
      ];
    },
    [] as SliceOfString[],
  );
