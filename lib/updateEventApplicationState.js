import { SPARQL_PREFIXES, PUBLIC_GRAPH, PREFIXES } from '../env';
import { v4 as uuid } from 'uuid';
import { querySudo as query } from '@lblod/mu-auth-sudo';

/**
 * Gets the associated cycling request and updates it
 *
 * @param { string } agendaItemUri
 */
export async function updateApplicatonState(agendaitemUri, bvapUri) {
  // Find agendapunt
  const agendapuntQuery = `
    ${SPARQL_PREFIXES}

    SELECT ?approval WHERE {
        GRAPH <${PUBLIC_GRAPH}> {
            ?approval a cycling:GoedkeuringDoorGemeente;
        }
    }
    `;
  const { bindings } = await query(agendapuntQuery);
  const approvals = bindings.map((b) => b.approval.value);
  // If approval object does not exist yet
}
