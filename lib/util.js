
import { PREFIXES } from "../env"

/**
 * 
 * @param {Dayjs} date 
 * @returns {string}
 */
export function dateToSparqlLiteral(date) {
    return `"${date.format("YYYY-MM-DD")}"^^xsd:date`
}

export function toExtNode(resourceName, id) {
    return `<${PREFIXES['ext']}${resourceName}/${id}>`;
}