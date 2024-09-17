/**
 * 
 * @param {Dayjs} date 
 * @returns {string}
 */
export function dateToSparqlLiteral(date) {
    return `"${date.format("YYYY-MM-DD")}"^^xsd:date`
}