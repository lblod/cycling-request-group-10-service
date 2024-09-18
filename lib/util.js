import { PREFIXES, BASE } from '../env';

/**
 *
 * @param {Dayjs} date
 * @returns {string}
 */
export function dateToSparqlLiteral(date) {
  return `"${date.format('YYYY-MM-DD')}"^^xsd:date`;
}

export function instance(instanceName, id) {
  if (!Object.keys(BASE).includes(instanceName))
    throw new Error(`No base for instance type ${instanceName}`);
  return `<${BASE[instanceName]}${id}>`;
}
