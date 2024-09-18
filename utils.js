import dayjs from 'dayjs';
import { sparqlEscapeUri } from 'mu';

const prefixes = {
  adms: 'http://www.w3.org/ns/adms#',
  adres: 'https://data.vlaanderen.be/ns/adres#',
  besluit: 'http://data.vlaanderen.be/ns/besluit#',
  ch: 'http://data.lblod.info/vocabularies/contacthub/',
  cycling: 'http://mu.semte.ch/vocabularies/ext/cycling/',
  dbpedia: 'http://dbpedia.org/ontology/',
  dct: 'http://purl.org/dc/terms/',
  eli: 'http://data.europa.eu/eli/ontology#',
  euvoc: 'http://publications.europa.eu/ontology/euvoc#',
  ext: 'http://mu.semte.ch/vocabularies/ext/',
  foaf: 'http://xmlns.com/foaf/0.1/',
  form: 'http://lblod.data.gift/vocabularies/forms/',
  generiek: 'http://data.vlaanderen.be/ns/generiek#',
  lblodlg: 'http://data.lblod.info/vocabularies/leidinggevenden/',
  lmb: 'http://lblod.data.gift/vocabularies/lmb/',
  locn: 'http://www.w3.org/ns/locn#',
  mandaat: 'http://data.vlaanderen.be/ns/mandaat#',
  mobi: 'https://data.vlaanderen.be/ns/mobiliteit#',
  mu: 'http://mu.semte.ch/vocabularies/core/',
  nao: 'http://www.semanticdesktop.org/ontologies/2007/08/15/nao#',
  nfo: 'http://www.semanticdesktop.org/ontologies/2007/03/22/nfo#',
  nie: 'http://www.semanticdesktop.org/ontologies/2007/01/19/nie#',
  org: 'http://www.w3.org/ns/org#',
  person: 'http://www.w3.org/ns/person#',
  persoon: 'http://data.vlaanderen.be/ns/persoon#',
  prov: 'http://www.w3.org/ns/prov#',
  rdfs: 'http://www.w3.org/2000/01/rdf-schema#',
  regorg: 'https://www.w3.org/ns/regorg#',
  schema: 'http://schema.org/',
  sh: 'http://www.w3.org/ns/shacl#',
  sign: 'http://mu.semte.ch/vocabularies/ext/signing/',
  skos: 'http://www.w3.org/2004/02/skos/core#',
};

const prefixHeaderLines = Object.fromEntries(
  Object.entries(prefixes).map(([key, value]) => [
    key,
    `PREFIX ${key}: ${sparqlEscapeUri(value)}`,
  ]),
);

// Make more generic if needed
function formatDate(date) {
  return dayjs(date).format('DD/MM/YYYY');
}

function parseSparqlResults(data) {
  if (!data) return;
  const vars = data.head.vars;
  return data.results.bindings.map((binding) => {
    const obj = {};
    vars.forEach((varKey) => {
      if (binding[varKey]) {
        obj[varKey] = binding[varKey].value;
      }
    });
    return obj;
  });
}

function joinWords(words) {
  if (words.length === 0) return ''; // Return empty string for no words
  if (words.length === 1) return words[0]; // If there's only one word, return it
  if (words.length === 2) return words.join(' en '); // For two words, join them with 'en'

  // For more than two words, join all except the last word with commas
  const allExceptLast = words.slice(0, -1).join(', ');
  const lastWord = words[words.length - 1];

  return `${allExceptLast} en ${lastWord}`;
}

export { prefixHeaderLines, formatDate, parseSparqlResults, joinWords };
