import { prefixHeaderLines, formatDate, parseSparqlResults } from './utils';
import {
  query,
  update,
  sparqlEscapeString,
  uuid,
  sparqlEscapeUri,
  sparqlEscapeDatetime,
} from 'mu';
import { RESOURCE_BASE } from './constants';

async function bestuurseenhedenForRequest(requestId) {
  const queryString = `
    ${prefixHeaderLines.adres}
    ${prefixHeaderLines.besluit}
    ${prefixHeaderLines.cycling}
    ${prefixHeaderLines.mu}
    ${prefixHeaderLines.rdfs}

    SELECT DISTINCT ?bestuurseenheid 
    WHERE {
      ?request 
        mu:uuid ${sparqlEscapeString(requestId)} ;
        cycling:routeSectie ?routeSection .
      
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

  return parsed.map((entry) => entry.uri);
}

function createApprovalByCommune(bestuurseenheidUri) {
  const approvalId = uuid();
  const approvalUri = `${RESOURCE_BASE}/cycling/commune-approval/${approvalId}`;
  const now = new Date();
  return `
    ${prefixHeaderLines.cycling}
    ${prefixHeaderLines.dct}

    INSERT DATA {
      ${sparqlEscapeUri(approvalUri)} 
        a cycling:GoedkeuringDoorGemeente ;
        dct:createdAt ${sparqlEscapeDatetime(now)} ;
        cycling:bevoegdeBestuurseenheid ${sparqlEscapeUri(bestuurseenheidUri)} .
    }
  `;
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
function attachConsideration(approvalByCommuneUri, raceDescription) {
  const id = uuid();
  const uri = `${RESOURCE_BASE}/agendapunten/${id}`;
  const { name: raceName, placeDescription, date: raceDate,  } = raceDescription;
  const description = `Aan het college van burgemeester en schepenen wordt gevraagd het gebruik van ${placeDescription} - voor de organisatie van ${raceName} van 19/02/2024 vanaf 08:00 tot 25/02/2024 tot 18:00 door ${raceOrganizerName}, ${raceOrganizerAdress}, principieel goed te keuren.Deze vraag tot principiële goedkeuring kadert in de toepassing van het afwegingskader met betrekking tot de impact van evenementen op het openbaar domein dat werd goedgekeurd door het college van burgemeester en schepenen op 14 juni 2018.`;
  const title = `Afweging evenement: Inname van het openbaar domein - ${placeDescription} - voor de organisatie van de wielerwedstrijd ${raceName} - ${formatDate(raceDate)} - Goedkeuring`;
  const type = ''; // TODO: should be URI
  return `
    ${prefixHeaderLines.besluit}
    ${prefixHeaderLines.cycling}
    ${prefixHeaderLines.dct}

    INSERT DATA {
      ${approvalByCommuneUri} cycling:afweging ${sparqlEscapeUri(uri)} .
      ${sparqlEscapeUri(uri)} 
        a besluit:Agendapunt ;
        dct:description ${sparqlEscapeString(description)} ;
        dct:title ${sparqlEscapeString(title)} ;
        besluit:Agendapunt.type ${sparqlEscapeUri(type)} .
    }
  `;
}

function attachTakingDomain(approvalByCommuneUri, raceDescription) {
  const id = uuid();
  const uri = `${RESOURCE_BASE}/agendapunten/${id}`;
  const { name: raceName, placeDescription, date: raceDate } = raceDescription;
  const description = `Aan het college van burgemeester en schepenen wordt gevraagd aan ${raceOrganizerName}, Harensesteenweg 28, 1800 Vilvoorde, het gebruik van het Citadelpark en omgeving in Gent voor de organisatie van de wielerwedstrijd Omloop Het Nieuwsblad elite mannen en elite vrouwen toe te staan op 24/02/2024 - met start opbouw op 19/02/2024 en einde afbouw op 26/02/2024.`;
  const title = `Afweging evenement: Inname van het openbaar domein - ${placeDescription} - voor de organisatie van de wielerwedstrijd ${raceName} - ${formatDate(raceDate)} - Goedkeuring`;
  const type = ''; // TODO: should be URI
  const now = new Date();
  return `
    ${prefixHeaderLines.besluit}
    ${prefixHeaderLines.cycling}
    ${prefixHeaderLines.dct}

    INSERT DATA {
      ${approvalByCommuneUri} cycling:innameOpenbaarDomein ${sparqlEscapeUri(uri)} .
      ${sparqlEscapeUri(uri)} 
        a besluit:Agendapunt ;
        dct:description ${sparqlEscapeString(description)} ;
        dct:title ${sparqlEscapeString(title)} ;
        besluit:Agendapunt.type ${sparqlEscapeUri(type)} .
    }
  `;
}

function attachApprovalByMayor(approvalByCommuneUri, raceDescription) {
  const id = uuid();
  const uri = `${RESOURCE_BASE}/agendapunten/${id}`;
  const { name: raceName, placeDescription, date: raceDate } = raceDescription;
  const title = `${raceName} - goedkeuring`;
  const description = `Aan het college van burgemeester en schepenen wordt gevraagd het gebruik van ${placeDescription} - voor de organisatie van ${raceName} van 19/02/2024 vanaf 08:00 tot 25/02/2024 tot 18:00 door ${raceOrganizerName}, ${raceOrganizerAdress}, principieel goed te keuren.Deze vraag tot principiële goedkeuring kadert in de toepassing van het afwegingskader met betrekking tot de impact van evenementen op het openbaar domein dat werd goedgekeurd door het college van burgemeester en schepenen op 14 juni 2018.`;
  const type = ''; // TODO: should be URI
  const now = new Date();
  return `
    ${prefixHeaderLines.besluit}
    ${prefixHeaderLines.cycling}
    ${prefixHeaderLines.dct}

    INSERT DATA {
      ${approvalByCommuneUri} cycling:approvalByMayor ${sparqlEscapeUri(uri)} .
      ${sparqlEscapeUri(uri)} 
        a besluit:Agendapunt ;
        dct:description ${sparqlEscapeString(description)} ;
        dct:title ${sparqlEscapeString(title)} ;
        besluit:Agendapunt.type ${sparqlEscapeUri(type)} .
    }
  `;
}
export {
  bestuurseenhedenForRequest,
  createApprovalByCommune,
  attachConsideration,
  attachApprovalByMayor,
  attachTakingDomain
};
