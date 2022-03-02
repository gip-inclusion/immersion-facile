import { complement, equals } from "ramda";

export const notEqual = <V>(v: V) => complement(equals(v));
