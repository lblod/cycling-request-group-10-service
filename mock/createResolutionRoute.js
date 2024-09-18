import { app } from 'mu';
import { SPARQL_PREFIXES, PUBLIC_GRAPH } from '../env';
import { v4 as uuid } from 'uuid';
import dayjs from 'dayjs';
import { dateToSparqlLiteral, toExtNode } from '../lib/util';
import { querySudo as query } from '@lblod/mu-auth-sudo';
import bodyParser from 'body-parser';
import { bestuurseenhedenForRequest } from '../queries';

/**
 * @typedef {Object} MockResolutionBody
 * @property {string} municipalityName - The name of the municipality.
 * @property {string} agendaItemUri - Uri of the linked agendaItem
 */

/**
 * Agenda point mocking function
 * @param { Express.Request } req
 * @param { Express.Response} res
 */
const createMockResolution = async (req,res) => {
  /** @type {MockResolutionBody} */
  const body = req.body;

  const now = dayjs();

  const bvapId = uuid();
  const resolutionId = uuid();
  const publishedResourceId = uuid();

  const resolutionTitle = `Mock resolution for cycling competition in ${body.municipalityName}`

  const resolutionDescription = `
    Mock resolution for ${body.municipalityName}:
    This resolution was generated using a mock endpoint. It will trigger a delta message and this will further the cycling application process automatically."
  `
  
  const sparql = `
  ${SPARQL_PREFIXES}

  INSERT DATA {
    GRAPH <${PUBLIC_GRAPH}> {
      ${toExtNode('besluit',resolutionId)} a besluit:Besluit;
        mu:uuid "${resolutionId}";
        eli:description ${JSON.stringify(resolutionDescription)};
        eli:title_short "${resolutionTitle}";
        besluit:motivering ${JSON.stringify(resolutionDescription)};
        eli:date_publication ${dateToSparqlLiteral(now)};
        prov:value ${JSON.stringify(resolutionDescription)};
        eli:language "nl";
        eli:title "${resolutionTitle}";
        nao:score 1;
        prov:generated ${toExtNode('bvap',bvapId)} .
      ${toExtNode('bvap',bvapId)} a besluit:BehandelingVanAgendapunt;
        dct:subject <${body.agendaItemUri}>.
      ${toExtNode('published-resources',publishedResourceId)} a sign:PublishedResource;
        sign:text ${JSON.stringify(resolutionDescription)}.
    }
  }
  `;
  try {
    await query(sparql);
  } catch (e) {
    res.status(500).json({message: e.message, sparql,error:e});
    return;
  }
  res.status(200).json({success:true});
}

export async function createAgendaItems(req, res) {
  const requestId = req.params.cyclingRequestId;
  const bestuurseenhedenResponse = await query(bestuurseenhedenForRequest(requestId));
  // const bestuurseenheden = parseSparqlResults(bestuurseenhedenResponse);
  // res.send(bestuurseenheden);
  res.end();
  
  // await Promise.all(
  //   bestuurseenheden.map(async (eenheid) => {
  //     await update(createApprovalByCommune(eenheid.uri));
  //     await Promise.all([
  //       attachConsideration(approval),
  //       attachTakingDomain(approval),
  //       attachApprovalByMayor(approval),
  //     ]);
  //   })
  // );
}

export function installMockRoutes(app) {
  app.post('/mock/resolution',  bodyParser.json({ limit: '50mb' }), createMockResolution);
  app.post('/mock/create-agenda-items/:cyclingRequestId', createAgendaItems);
}
