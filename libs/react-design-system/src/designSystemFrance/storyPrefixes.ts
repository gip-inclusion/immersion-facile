const dsfrPrefix = "DSFR/";
const componentPrefix = `${dsfrPrefix}Components/`;
export const storybookPrefix = (componentType: string) =>
  componentPrefix + componentType + "/";
