import { Action, Slice } from "@reduxjs/toolkit";
import { Epic } from "redux-observable";
import { Dependencies } from "src/app/config/dependencies";
import { RootState } from "src/core-logic/storeConfig/store";

type ValueOf<T> = T[keyof T];
export type ActionOfSlice<S extends Slice> = ReturnType<ValueOf<S["actions"]>>;

export type AppEpic<Input extends Action, Output extends Input = Input> = Epic<
  Input,
  Output,
  RootState,
  Dependencies
>;

export const expectToEqual = <T>(actual: T, expected: T) => {
  expect(actual).toEqual(expected);
};
