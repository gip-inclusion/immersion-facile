/*
 * React 18 error with Formik last version (2.2.9 last update >>> june 2021 !!!!)
 * Namespace 'React' has no exported member 'StatelessComponent'
 * in formik, react-mapbox-gl
 * https://github.com/jaredpalmer/formik/issues/3546
 */
declare namespace React {
  type StatelessComponent<P> = React.FunctionComponent<P>;
}
