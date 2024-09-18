import { SPARQL_PREFIXES, PUBLIC_GRAPH, BASE } from '../env';
import { v4 as uuid } from 'uuid';
import { querySudo as query } from '@lblod/mu-auth-sudo';

/**
 * Gets the associated cycling request and updates it
 *
 * @param { string } agendaItemUri
 */
export async function updateApplicatonState(agendaitemUri, bvapUri) {
  const besluitQuery = `
    ${SPARQL_PREFIXES}

    SELECT ?resolution ?class WHERE {
        GRAPH <${PUBLIC_GRAPH}> {
            <${bvapUri}> a besluit:BehandelingVanAgendapunt;
              prov:generated ?resolution.
            ?resolution a besluit:Besluit;
                a ?class.
        }
    }
    `;
  const result = await query(besluitQuery);
  if (!result.results.bindings || result.results.length === 0) {
    console.log(
      'Did receive a delta for an agendaitem related resolution but was unable to find the resolution itself.',
    );
    return;
  }
  /** @type {string[]} */
  const classes = result.results.bindings.map((b) => b.class.value);
  const resolutionUri = result.results.bindings[0]?.resolution.value;
  if (
    classes.includes(
      'http://mu.semte.ch/vocabularies/ext/cycling/Innamevergunning',
    )
  ) {
    await writeApplicationState(true, resolutionUri, agendaitemUri, bvapUri);
  } else if (
    classes.includes(
      'http://data.lblod.info/id/concept/cycling-request-statuses/rejected',
    )
  ) {
    await writeApplicationState(false, resolutionUri, agendaitemUri, bvapUri);
  }
}

async function writeApplicationState(
  approved,
  resolutionUri,
  agendaitemUri,
  bvapUri,
) {
  // We need t write approved if all agenda items are approved

  const approvalQuery = `
  ${SPARQL_PREFIXES}
  DELETE {
    GRAPH <http://mu.semte.ch/graphs/public> {
      ?request cycling:state ?state.
    }
  } INSERT {
    GRAPH <http://mu.semte.ch/graphs/public> {
      ?request cycling:state <http://data.lblod.info/id/concept/cycling-request-statuses/approved>.
    }
  } WHERE {
      VALUES ?p {
          cycling:afweging
          cycling:innameOpenbaarDomein
          cycling:approvalByMayor
      }
      GRAPH <http://mu.semte.ch/graphs/public> {
          ?approval ?p ?agendaitem;
              cycling:goedkeuringVoor ?request.
          ?bvap a besluit:BehandelingVanAgendapunt;
              prov:generated ?resolution;
              dct:subject ?agendaitem.

          ?resolution a besluit:Besluit, besluit:Innamevergunning.

          OPTIONAL {
            ?request cycling:state ?state.
          }
      }
  }
  `;
  await query(approvalQuery);
  // Check if everything is approved
  const everythingApprovedQuery = `

  `;
}
