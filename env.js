import envvar from 'env-var';
import * as N3 from 'n3';
const { namedNode } = N3.DataFactory;

export const SLEEP_BETWEEN_BATCHES = envvar
  .get('SLEEP_BETWEEN_BATCHES')
  .default('1000')
  .asInt();
export const TEMP_GRAPH_PREFIX = envvar
  .get('TEMP_GRAPH_PREFIX')
  .default('http://mu.semte.ch/graphs/ingest')
  .asUrlString();

export const TEMP_GRAPH_INSERTS = `${TEMP_GRAPH_PREFIX}-inserts`;
export const TEMP_GRAPH_DELETES = `${TEMP_GRAPH_PREFIX}-deletes`;
export const TEMP_GRAPH_DISCARDS = `${TEMP_GRAPH_PREFIX}-discards`;

export const ORGANISATION_GRAPH_PREFIX = envvar
  .get('ORGANISATION_GRAPH_PREFIX')
  .default('http://mu.semte.ch/graphs/organizations/')
  .asUrlString();

export const PUBLIC_GRAPH = envvar
  .get('PUBLIC_GRAPH')
  .default('http://mu.semte.ch/graphs/public')
  .asUrlString();

export const BATCH_SIZE = envvar.get('BATCH_SIZE').default('1000').asInt();

export const LOGLEVEL = envvar
  .get('LOGLEVEL')
  .default('silent')
  .asEnum(['error', 'info', 'silent']);

export const WRITE_ERRORS = envvar
  .get('WRITE_ERRORS')
  .default('false')
  .asBool();

export const ERROR_GRAPH = envvar
  .get('ERROR_GRAPH')
  .default('http://lblod.data.gift/errors')
  .asUrlString();

export const ERROR_BASE = envvar
  .get('ERR0R_BASE')
  .default('http://data.lblod.info/errors/')
  .asUrlString();

export const PREFIXES = {
  adms: 'http://www.w3.org/ns/adms#',
  skos: 'http://www.w3.org/2004/02/skos/core#',
  reorg: 'http://www.w3.org/ns/regorg#',
  lblodgeneriek: 'https://data.lblod.info/vocabularies/generiek/',
  org: 'http://www.w3.org/ns/org#',
  generiek: 'https://data.vlaanderen.be/ns/generiek#',
  ere: 'http://data.lblod.info/vocabularies/erediensten/',
  organisatie: 'https://data.vlaanderen.be/ns/organisatie#',
  mu: 'http://mu.semte.ch/vocabularies/core/',
  euvoc: 'http://publications.europa.eu/ontology/euvoc#',
  prov: 'http://www.w3.org/ns/prov#',
  schema: 'http://schema.org/',
  locn: 'http://www.w3.org/ns/locn#',
  foaf: 'http://xmlns.com/foaf/0.1/',
  dcterms: 'http://purl.org/dc/terms/',
  geo: 'http://www.opengis.net/ont/geosparql#',
  adres: 'https://data.vlaanderen.be/ns/adres#',
  ns1: 'http://www.w3.org/ns/prov#',
  ns3: 'http://mu.semte.ch/vocabularies/ext/',
  rdfs: 'http://www.w3.org/2000/01/rdf-schema#',
  fv: 'http://data.lblod.info/vocabularies/FeitelijkeVerenigingen/',
  ns: 'https://data.lblod.info/ns/',
  verenigingen_ext:
    'http://data.lblod.info/vocabularies/FeitelijkeVerenigingen/',
  vereniging: 'https://data.vlaanderen.be/ns/FeitelijkeVerenigingen#',
  pav: 'http://purl.org/pav/',
  code: 'http://data.vlaanderen.be/id/concept/',
  person: 'http://www.w3.org/ns/person#',
  xsd: 'http://www.w3.org/2001/XMLSchema#',
  cycling: 'http://mu.semte.ch/vocabularies/ext/cycling/',
  ext: 'http://mu.semte.ch/vocabularies/ext/',
  besluit: 'http://data.vlaanderen.be/ns/besluit#',
  mandaat: 'http://data.vlaanderen.be/ns/mandaat#',
  persoon: 'http://data.vlaanderen.be/ns/persoon#',
  eli: 'http://data.europa.eu/eli/ontology#',
  nao: 'http://www.semanticdesktop.org/ontologies/2007/08/15/nao#',
  sign: 'http://mu.semte.ch/vocabularies/ext/signing/',
  dct: 'http://purl.org/dc/terms/',
};

export const BASE = {
  error: 'http://data.lblod.info/errors/',
  ext: 'http://mu.semte.ch/vocabularies/ext/',
  agendapunt: 'http://data.lblod.info/id/agendapunten/',
  besluit: 'http://data.lblod.info/id/besluiten/',
  refusal: 'http://data.lblod.info/id/weigeringen/',
  vergunning: 'http://data.lblod.info/id/vergunning/',
  bvap: 'http://data.lblod.info/id/behandelingen-van-agendapunten/',
  'published-resource': 'http://data.lblod.info/published-resources/',
  'commune-approval': 'http://data.lblod.info/id/cycling/commune-approval/',
  adminunit: 'http://data.lblod.info/id/bestuurseenheden/'
};

export const NAMESPACES = (() => {
  const all = {};
  for (const key in PREFIXES)
    all[key] = (pred) => namedNode(`${PREFIXES[key]}${pred}`);
  return all;
})();

export const BASES = (() => {
  const all = {};
  for (const key in BASE) all[key] = (pred) => namedNode(`${BASE[key]}${pred}`);
  return all;
})();

export const SPARQL_PREFIXES = (() => {
  const all = [];
  for (const key in PREFIXES) all.push(`PREFIX ${key}: <${PREFIXES[key]}>`);
  return all.join('\n');
})();
