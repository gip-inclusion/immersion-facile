export const getUrlParameters: (location: Location) => {
  [k: string]: string;
} = () => Object.fromEntries(new URLSearchParams(location.search).entries());
