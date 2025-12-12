import type { PayloadAction } from "@reduxjs/toolkit";

export type AutocompleteItem<T> = {
  suggestions: T[];
  value: T | null;
  query: string;
  isLoading: boolean;
  isDebouncing: boolean;
};

export type AutocompleteState<Locator extends string, T> = {
  data: Partial<Record<Locator, AutocompleteItem<T>>>;
};

const emptyObject = {};

export type PayloadActionWithLocator<
  Locator extends string,
  Payload = typeof emptyObject,
> = PayloadAction<Payload & { locator: Locator }>;

export const initialAutocompleteItem = {
  suggestions: [],
  value: null,
  query: "",
  isLoading: false,
  isDebouncing: false,
};
