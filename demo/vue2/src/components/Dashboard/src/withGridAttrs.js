import { kebabCase } from 'lodash-es';

export function withGridAttrs(props, include = [], prefix = 'gs-') {
  return Object.entries(props)
    .filter(([key]) => include.includes(key))
    .reduce((acc, [key, val]) => {
      acc[`${prefix}${kebabCase(key)}`] = val;
      return acc;
    }, {});
}