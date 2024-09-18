import { SPARQL_PREFIXES, PUBLIC_GRAPH } from '../env';
import { v4 as uuid } from 'uuid';
import dayjs from 'dayjs';
import { dateToSparqlLiteral, instance } from './util';
import { querySudo as query } from '@lblod/mu-auth-sudo';
import bodyParser from 'body-parser';
import {
  bestuurseenhedenForRequest,
  createApprovalByCommune,
  getRequestData,
  attachApprovalByMayor,
  attachConsideration,
  attachTakingDomain,
  getSegmentsForBestuur,
} from '../queries';

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
const createMockResolution = async (req, res) => {
  /** @type {MockResolutionBody} */
  const body = req.body;

  const now = dayjs();

  const bvapId = uuid();
  const resolutionId = uuid();
  const publishedResourceId = uuid();

  const resolutionTitle = `Mock resolution for cycling competition in ${body.municipalityName}`;

  const resolutionDescription = `
    Mock resolution for ${body.municipalityName}:
    This resolution was generated using a mock endpoint. It will trigger a delta message and this will further the cycling application process automatically.
    It also has a class signifying that the cycling competition has been approved.
  `;

  const sparql = `
  ${SPARQL_PREFIXES}

  INSERT DATA {
    GRAPH <${PUBLIC_GRAPH}> {
      ${instance('vergunning', resolutionId)} a besluit:Besluit;
        a cycling:Innamevergunning;
        mu:uuid "${resolutionId}";
        eli:description ${JSON.stringify(resolutionDescription)};
        eli:title_short "${resolutionTitle}";
        besluit:motivering ${JSON.stringify(resolutionDescription)};
        eli:date_publication ${dateToSparqlLiteral(now)};
        prov:value ${JSON.stringify(resolutionDescription)};
        eli:language "nl";
        eli:title "${resolutionTitle}";
        nao:score 1.
      ${instance('bvap', bvapId)} a besluit:BehandelingVanAgendapunt;
        dct:subject <${body.agendaItemUri}>;
        prov:generated ${instance('vergunning', resolutionId)} .
      ${instance('published-resource', publishedResourceId)} a sign:PublishedResource;
        sign:text ${JSON.stringify(resolutionDescription)}.
    }
  }
  `;
  try {
    await query(sparql);
  } catch (e) {
    res.status(500).json({ message: e.message, sparql, error: e });
    return;
  }
  res.status(200).json({ success: true });
};

export async function createAgendaItems(req, res) {
  const requestId = req.params.cyclingRequestId;
  const requestData = await getRequestData(requestId);
  const bestuurseenheden = await bestuurseenhedenForRequest(requestId);

  await Promise.all(
    bestuurseenheden.map(async (bestuur) => {
      const segments = await getSegmentsForBestuur(bestuur, requestId);
      const approval = await createApprovalByCommune(bestuur, requestData.request);
      await Promise.all([
        await attachConsideration(approval, requestData, segments),
        // TODO Fix the rendering of these other two
        // await attachTakingDomain(approval, requestData, segments),
        // await attachApprovalByMayor(approval, requestData, segments),
      ]);
    }),
  );

  res.end();
}

export function installMockRoutes(app) {
  app.post(
    '/mock/resolution',
    bodyParser.json({ limit: '50mb' }),
    createMockResolution,
  );

  app.post('/mock/create-agenda-items/:cyclingRequestId', createAgendaItems);
}
