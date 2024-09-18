import { app } from 'mu';
import { v4 as uuid } from 'uuid';
import { BASES as b } from './env';
import { NAMESPACES as ns } from './env';
import * as env from './env';
import * as mas from '@lblod/mu-auth-sudo';
import * as N3 from 'n3';
const { namedNode, literal } = N3.DataFactory;
import {installMockRoutes} from './mock/createResolutionRoute';
import bodyParser from 'body-parser';
import { updateApplicatonState} from './updateEventApplicationState';
import { querySudo as query } from '@lblod/mu-auth-sudo';

// Body parser already in app.
// app.use(
//   bodyParser.json({
//     type: function (req) {
//       return /^application\/json/.test(req.get('content-type'));
//     },
//     limit: '50mb',
//     extended: true,
//   }),
// );

app.get('/', async function (req , res) {
  res.send('Hello from cycling-application-dispatch-service');
});

installMockRoutes(app);

app.post('/delta',bodyParser.json({ limit: '50mb' }), function(req,res) {
  res.status(200).end();
  try {
    const changesets = req.body;
    // Check if agendeitem is linked to besluit
    let triggeringInsert = null;
    outside: for (const changeset of changesets) {
      for (const insert of changeset.inserts) {
        if (insert.predicate.value === 'http://purl.org/dc/terms/subject') {
          triggeringInsert = insert;
          break outside;
        }
      }
    }
    if (!triggeringInsert) return; // We can ignore if nothing was received
    // Insert found. We can now update the associated event tate
    const bvapUri = triggeringInsert.object.value;
    const agendaitemUri = triggeringInsert.subject.value;
    console.log('Recieved a changed AgendaItem delta')
    updateApplicatonState(agendaitemUri, bvapUri);

  } catch (err) {
    next(err);
  }
})
/**
 * Use a `setTimeout` to schedule the scanning of the temporary graphs. This
 * happens once on startup of the service. The reason for this being on a timer
 * is that it can be delayed if needed.
 */
// setTimeout(encapsulatedScanAndProcess, 500);

/**
 * This is a lock to make sure requests are only processed one by one. This is
 * to make sure requests are not touching the data of other requests. Although
 * that is allowed (it wont break the data), we don't want to be wasteful with
 * queries.
 *
 * @global
 */
app.post('/delta-inserts', async function (req, res, next) {
  // We can already send a 200 back. The delta-notifier does not care about the
  // result, as long as the request is closed.
  res.status(200).end();
  try {
    const changesets = req.body;
    console.log(changesets);
  } catch (err) {
    next(err);
  } finally {
    // lock.release();
  }
});

app.post('/delta-deletes', async function (req, res, next) {
  // We can already send a 200 back. The delta-notifier does not care about the
  // result, as long as the request is closed.
  res.status(200).end();
  try {
    const changesets = req.body;
    //Deletes are actually inserts in the temporary deletes graph. Move them
    //over to deletes and remove the inserts to trick the delta processor.
    // for (const changeset of changesets) {
    //   changeset.deletes = changeset.deletes.concat(changeset.inserts);
    //   changeset.inserts = [];
    // }
    // const result = await del.processDeltaChangesets(changesets);
    // handleProcessingResult(result);
  } catch (err) {
    next(err);
  } finally {
    // lock.release();
  }
});

// app.post('/manual-dispatch', async function (req, res, next) {
//   // We can already send a 200 back. The delta-notifier does not care about the
//   // result, as long as the request is closed.
//   res.status(200).end();
//   try {
//     await lock.acquire();
//     const results = await del.scanAndProcess();
//     handleProcessingResult(results);
//   } catch (err) {
//     next(err);
//   } finally {
//     lock.release();
//   }
// });

///////////////////////////////////////////////////////////////////////////////
// Error handler
///////////////////////////////////////////////////////////////////////////////

// For some reason the 'next' parameter is unused and eslint notifies us, but
// when removed, Express does not use this middleware anymore.
/* eslint-disable no-unused-vars */
app.use(async (err, req, res, next) => {
  await logError(err);
});
/* eslint-enable no-unused-vars */

async function logError(err) {
  if (env.LOGLEVEL === 'error' || env.LOGLEVEL === 'info') console.error(err);
  if (env.WRITE_ERRORS === true) {
    const errorStore = errorToStore(err);
    await writeError(errorStore);
  }
}

///////////////////////////////////////////////////////////////////////////////
// Helpers
///////////////////////////////////////////////////////////////////////////////

/*
 * Produces an RDF store with the data to encode an error in the OSLC
 * namespace.
 *
 * @function
 * @param {Error} errorObject - Instance of the standard JavaScript Error class
 * or similar object that has a `message` property.
 * @returns {N3.Store} A new Store with the properties to represent the error.
 */
function errorToStore(errorObject) {
  const store = new N3.Store();
  const errorUuid = uuid();
  const error = b.error(errorUuid);
  store.addQuad(error, ns.rdf`type`, ns.oslc`Error`);
  store.addQuad(error, ns.mu`uuid`, literal(errorUuid));
  store.addQuad(
    error,
    ns.dct`creator`,
    literal('Verenigingen graph dispatcher service'),
  );
  store.addQuad(error, ns.oslc`message`, literal(errorObject.message));
  return store;
}

/*
 * Receives a store with only the triples related to error messages and stores
 * them in the triplestore.
 *
 * @async
 * @function
 * @param {N3.Store} errorStore - Store with only error triples. (All of the
 * contents are stored.)
 * @returns {undefined} Nothing
 */
async function writeError(errorStore) {
  const writer = new N3.Writer();
  errorStore.forEach((q) => writer.addQuad(q));
  const errorTriples = await new Promise((resolve, reject) => {
    writer.end((err, res) => {
      if (err) reject(err);
      resolve(res);
    });
  });
  await mas.updateSudo(`
    INSERT DATA {
      GRAPH ${rst.termToString(namedNode(env.ERROR_GRAPH))} {
        ${errorTriples}
      }
    }
  `);
}
