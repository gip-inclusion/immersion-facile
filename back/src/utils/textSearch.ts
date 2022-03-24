import { MatchRangeDto } from "../shared/romeAndAppellationDtos/romeAndAppellation.dto";

export const normalize = (s: string): string =>
  s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "") // remove all accents, e.g 'à' -> 'a'
    .toLowerCase();

// Parameters:
//   searchTerms: a single search term to search for
//   str: the string in which to search for the term
const findMatchRangesInternal = (
  searchTerm: string,
  str: string,
): MatchRangeDto[] => {
  const ranges: MatchRangeDto[] = [];
  for (
    let pos = str.indexOf(searchTerm);
    pos != -1;
    pos = str.indexOf(searchTerm, pos + 1)
  ) {
    ranges.push({
      startIndexInclusive: pos,
      endIndexExclusive: pos + searchTerm.length,
    });
  }
  return ranges;
};

// Parameters:
//   searchTerms: a space-separated list of terms to search for
//   str: the string in which to search for the terms
export const findMatchRanges = (
  searchTerms: string,
  str: string,
): MatchRangeDto[] => {
  const strNorm = normalize(str);
  return normalize(searchTerms)
    .split(" ")
    .filter((el) => !!el)
    .map((searchTerm) => findMatchRangesInternal(searchTerm, strNorm))
    .reduce((acc, lst) => [...acc, ...lst], []);
};
