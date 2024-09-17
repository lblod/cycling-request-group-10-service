const prefixes = {
  adms: "http://www.w3.org/ns/adms#",
  adres: "https://data.vlaanderen.be/ns/adres#",
  besluitvorming: "https://data.vlaanderen.be/ns/besluitvorming#",
  cycling: "http://mu.semte.ch/vocabularies/ext/cycling/",
  dbpedia: "http://dbpedia.org/ontology/",
  dct: "http://purl.org/dc/terms/",
  dossier: "https://data.vlaanderen.be/ns/dossier#",
  ext: "http://mu.semte.ch/vocabularies/ext/",
  mandaat: "http://data.vlaanderen.be/ns/mandaat#",
  mu: "http://mu.semte.ch/vocabularies/core/",
  nfo: "http://www.semanticdesktop.org/ontologies/2007/03/22/nfo#",
  nie: "http://www.semanticdesktop.org/ontologies/2007/01/19/nie#",
  nmo: "http://www.semanticdesktop.org/ontologies/2007/03/22/nmo#",
  org: "http://www.w3.org/ns/org#",
  parl: "http://mu.semte.ch/vocabularies/ext/parlement/",
  pav: "http://purl.org/pav/",
  prov: "http://www.w3.org/ns/prov#",
  schema: "http://schema.org/",
  sign: "http://mu.semte.ch/vocabularies/ext/handtekenen/",
  skos: "http://www.w3.org/2004/02/skos/core#",
  xsd: "http://www.w3.org/2001/XMLSchema#"
};

const prefixHeaderLines = Object.fromEntries(
  Object.entries(prefixes).map(([key, value]) => [
    key,
    `PREFIX ${key}: ${sparqlEscapeUri(value)}`,
  ])
);

// Make more generic if needed
function formatDate(date) {
    return format(date, 'dd/MM/yyyy');
}

export { prefixHeaderLines, formatDate };