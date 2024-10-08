import {
  prefixHeaderLines,
  formatDate,
  parseSparqlResults,
  joinWords,
} from './utils';
import {
  query,
  update,
  sparqlEscapeString,
  uuid,
  sparqlEscapeUri,
  sparqlEscapeDateTime,
} from 'mu';
import { RESOURCE_BASE } from './constants';
import { updateSudo } from '@lblod/mu-auth-sudo';
import { PUBLIC_GRAPH } from './env';

async function bestuurseenhedenForRequest(requestId) {
  const queryString = `
    ${prefixHeaderLines.adres}
    ${prefixHeaderLines.besluit}
    ${prefixHeaderLines.cycling}
    ${prefixHeaderLines.mobi}
    ${prefixHeaderLines.mu}
    ${prefixHeaderLines.rdfs}

    SELECT DISTINCT ?bestuurseenheid 
    WHERE {
      ?request 
        mu:uuid ${sparqlEscapeString(requestId)} ;
        mobi:Project.omvat ?routeSection .
      
      ?routeSection
        cycling:gebruiktWerkingsgebied ?adres .
      
      ?adres 
        adres:gemeentenaam ?gemeentenaam .
      ?werkingsgebied 
        rdfs:label ?gemeentenaam ;
        ^besluit:werkingsgebied ?bestuurseenheid .
    }
  `;

  const result = await query(queryString);
  const parsed = parseSparqlResults(result);
  return parsed.map((entry) => entry.bestuurseenheid);
}

async function createApprovalByCommune(bestuurseenheidUri, requestUri) {
  const approvalId = uuid();
  const approvalUri = `${RESOURCE_BASE}/cycling/commune-approval/${approvalId}`;
  const now = new Date();
  await update(`
    ${prefixHeaderLines.cycling}
    ${prefixHeaderLines.mu}
    ${prefixHeaderLines.dct}

    INSERT DATA {
      ${sparqlEscapeUri(approvalUri)} 
        a cycling:GoedkeuringDoorGemeente ;
        mu:uuid ${sparqlEscapeString(approvalId)} ;
        dct:createdAt ${sparqlEscapeDateTime(now)} ;
        cycling:goedkeuringVoor ${sparqlEscapeUri(requestUri)} ;
        cycling:bevoegdeBestuurseenheid ${sparqlEscapeUri(bestuurseenheidUri)} .
    }
  `);

  return approvalUri;
}
/**
 * We need for a race
 * raceName: Omloop Het Nieuwsblad
 * placeDescription: Citadelpark en omgeving met parcours in Gent
 * raceDate: 24/02/2024
 * organizerName: RIA vzw
 * organizerAdress: Harensesteenweg 28, 1800 Vilvoorde
 * startOccupation: 19/02/2024 vanaf 08:00
 * endOccupation: 25/02/2024 tot 18:00
 */
async function attachConsideration(
  approvalByCommuneUri,
  raceDescription,
  segments,
) {
  const id = uuid();
  const uri = `${RESOURCE_BASE}/agendapunten/${id}`;
  const placeDescription = joinWords(segments.map((seg) => seg.description));
  const { raceName, raceDate, organizerName, organizerAdress } =
    raceDescription;
  const description = `Aan het college van burgemeester en schepenen wordt gevraagd het gebruik van ${placeDescription} - voor de organisatie van ${raceName} van 19/02/2024 vanaf 08:00 tot 25/02/2024 tot 18:00 door ${organizerName}, ${organizerAdress}, principieel goed te keuren.Deze vraag tot principiële goedkeuring kadert in de toepassing van het afwegingskader met betrekking tot de impact van evenementen op het openbaar domein dat werd goedgekeurd door het college van burgemeester en schepenen op 14 juni 2018.`;
  const title = `Afweging evenement: Inname van het openbaar domein - ${placeDescription} - voor de organisatie van de wielerwedstrijd ${raceName} - ${formatDate(raceDate)} - Goedkeuring`;
  const queryString = `
    ${prefixHeaderLines.besluit}
    ${prefixHeaderLines.cycling}
    ${prefixHeaderLines.dct}
    ${prefixHeaderLines.mu}

    INSERT DATA {
      GRAPH ${sparqlEscapeUri(PUBLIC_GRAPH)} {
        ${sparqlEscapeUri(approvalByCommuneUri)} cycling:afweging ${sparqlEscapeUri(uri)} .
        ${sparqlEscapeUri(uri)} 
          a besluit:Agendapunt ;
          mu:uuid ${sparqlEscapeString(id)} ;
          dct:description ${sparqlEscapeString(description)} ;
          dct:title ${sparqlEscapeString(title)} .
      }
    }
  `;

  console.log(queryString);

  await updateSudo(queryString);
}

function attachTakingDomain(approvalByCommuneUri, raceDescription) {
  const id = uuid();
  const uri = `${RESOURCE_BASE}/agendapunten/${id}`;
  const { name: raceName, placeDescription, date: raceDate } = raceDescription;
  const description = `Aan het college van burgemeester en schepenen wordt gevraagd aan ${raceOrganizerName}, Harensesteenweg 28, 1800 Vilvoorde, het gebruik van het Citadelpark en omgeving in Gent voor de organisatie van de wielerwedstrijd Omloop Het Nieuwsblad elite mannen en elite vrouwen toe te staan op 24/02/2024 - met start opbouw op 19/02/2024 en einde afbouw op 26/02/2024.`;
  const title = `Afweging evenement: Inname van het openbaar domein - ${placeDescription} - voor de organisatie van de wielerwedstrijd ${raceName} - ${formatDate(raceDate)} - Goedkeuring`;
  return `
    ${prefixHeaderLines.besluit}
    ${prefixHeaderLines.cycling}
    ${prefixHeaderLines.dct}
    ${prefixHeaderLines.mu}

    INSERT DATA {
      ${approvalByCommuneUri} cycling:innameOpenbaarDomein ${sparqlEscapeUri(uri)} .
      ${sparqlEscapeUri(uri)} 
        a besluit:Agendapunt ;
        mu:uuid ${sparqlEscapeString(id)} ;
        dct:description ${sparqlEscapeString(description)} ;
        dct:title ${sparqlEscapeString(title)} .
    }
  `;
}

function attachApprovalByMayor(approvalByCommuneUri, raceDescription) {
  const id = uuid();
  const uri = `${RESOURCE_BASE}/agendapunten/${id}`;
  const { name: raceName, placeDescription, date: raceDate } = raceDescription;
  const title = `${raceName} - goedkeuring`;
  const description = `Aan het college van burgemeester en schepenen wordt gevraagd het gebruik van ${placeDescription} - voor de organisatie van ${raceName} van 19/02/2024 vanaf 08:00 tot 25/02/2024 tot 18:00 door ${raceOrganizerName}, ${raceOrganizerAdress}, principieel goed te keuren.Deze vraag tot principiële goedkeuring kadert in de toepassing van het afwegingskader met betrekking tot de impact van evenementen op het openbaar domein dat werd goedgekeurd door het college van burgemeester en schepenen op 14 juni 2018.`;
  return `
    ${prefixHeaderLines.besluit}
    ${prefixHeaderLines.cycling}
    ${prefixHeaderLines.dct}
    ${prefixHeaderLines.mu}


    INSERT DATA {
      ${approvalByCommuneUri} cycling:approvalByMayor ${sparqlEscapeUri(uri)} .
      ${sparqlEscapeUri(uri)} 
        a besluit:Agendapunt ;
        mu:uuid ${sparqlEscapeString(id)} ;
        dct:description ${sparqlEscapeString(description)} ;
        dct:title ${sparqlEscapeString(title)} .
    }
  `;
}

async function getRequestData(requestId) {
  const queryString = `
    ${prefixHeaderLines.cycling}
    ${prefixHeaderLines.dct}
    ${prefixHeaderLines.mu}

    SELECT ?raceName ?raceDate ?organizerName ?organizerAdress ?description ?request
    WHERE {
      ?request 
        mu:uuid ${sparqlEscapeString(requestId)} ;
        dct:title ?raceName ;
        cycling:raceDate ?raceDate ;
        cycling:organizerName ?organizerName ;
        cycling:organizerAddress ?organizerAdress .

      OPTIONAL {
        ?request dct:description ?description .
      }
    }
  `;

  const response = await query(queryString);
  return parseSparqlResults(response)?.[0];
}

async function getSegmentsForBestuur(bestuur, requestId) {
  const queryString = `
    ${prefixHeaderLines.adres}
    ${prefixHeaderLines.besluit}
    ${prefixHeaderLines.cycling}
    ${prefixHeaderLines.dct}
    ${prefixHeaderLines.mobi}
    ${prefixHeaderLines.mu}
    ${prefixHeaderLines.rdfs}

    SELECT ?description ?section
    WHERE {
      ?request 
        mu:uuid ${sparqlEscapeString(requestId)} ;
        mobi:Project.omvat ?section .

      ?section 
        cycling:gebruiktWerkingsgebied/adres:gemeentenaam ?gemeente ;
        dct:description ?description .
      ${sparqlEscapeUri(bestuur)} besluit:werkingsgebied/rdfs:label ?gemeente .
    } 
  `;

  const response = await query(queryString);
  const parsed = parseSparqlResults(response);

  return parsed;
}

export {
  bestuurseenhedenForRequest,
  createApprovalByCommune,
  attachConsideration,
  attachApprovalByMayor,
  attachTakingDomain,
  getRequestData,
  getSegmentsForBestuur,
};
