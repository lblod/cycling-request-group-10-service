import { SPARQL_PREFIXES, PUBLIC_GRAPH, BASE } from '../env';
import { v4 as uuid } from 'uuid';
import { querySudo as query } from '@lblod/mu-auth-sudo';

/**
 * Gets the associated cycling request and updates it
 *
 * @param { string } agendaItemUri
 */
export async function updateApplicatonState(agendaitemUri, bvapUri) {
  // Find agendapunt
  const besluitQuery = `
    ${SPARQL_PREFIXES}

    SELECT ?resolution ?class WHERE {
        GRAPH <${PUBLIC_GRAPH}> {
            ?resolution a besluit:Besluit;
                a ?class;
                prov:generated <${bvapUri}>.
        }
    }
    `;
  const result = await query(besluitQuery);
  if (!result.results.bindings || result.results.length === 0) {
    console.log(`Did receive a delta for an agendaitem related resolution but was unable to find the resolution itself.`)
    return;
  }
  /** @type {string[]} */
  const classes = result.results.bindings.map((b)=>b.class.value);
  const resolutionUri = result.results.bindings[0]?.resolution.value;
  if (classes.includes('http://mu.semte.ch/vocabularies/ext/cycling/Innamevergunning')) {
    // The agendapoint was approved
    // Get the associated approval by commune
    console.log(`Commune agreed. Agenda item: ${agendaitemUri}`)
    await writeApplicationStateAgreed(resolutionUri, agendaitemUri, bvapUri);
  }
}


async function writeApplicationStateAgreed(resolutionUri, agendaitemUri,bvapUri) {
  // Get approval
  const approvalQuery = `
  ${SPARQL_PREFIXES}

  INSERT {
    GRAPH <http://mu.semte.ch/graphs/public> {
      ?request cycling:state <>.
    }
  }
  WHERE {
      VALUES ?p {
          cycling:afweging,
          cycling:innameOpenbaarDomein,
          cycling:approvalByMayor
      }
      GRAPH <http://mu.semte.ch/graphs/public> {
          ?approval ?p <${agendaitemUri}>;
              cycling:goedkeuringVoor ?request.
      }
  }
  `;
  await query(approvalQuery);
  // Check if everything is approved
  const everythingApprovedQuery = `

  `
}
