/** Used by Flavor to mark a type in a readable way. */
export interface Flavoring<FlavorT> {
  _type?: FlavorT;
}

/**
 * Create a "flavored" version of a type. TypeScript will disallow mixing flavors, but will allow
 * unflavored values of that type to be passed in where a flavored version is expected. This is a
 * less restrictive form of branding. */
export type Flavor<T, FlavorT> = T & Flavoring<FlavorT>;
