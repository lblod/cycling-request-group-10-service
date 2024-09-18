import { app } from 'mu';
import * as env from './env';
import * as N3 from 'n3';
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
// app.post('/delta-inserts', async function (req, res, next) {
//   // We can already send a 200 back. The delta-notifier does not care about the
//   // result, as long as the request is closed.
//   res.status(200).end();
//   try {
//     const changesets = req.body;
//     console.log(changesets);
//   } catch (err) {
//     next(err);
//   } finally {
//     // lock.release();
//   }
// });

// app.post('/delta-deletes', async function (req, res, next) {
//   // We can already send a 200 back. The delta-notifier does not care about the
//   // result, as long as the request is closed.
//   res.status(200).end();
//   try {
//     const changesets = req.body;
//     //Deletes are actually inserts in the temporary deletes graph. Move them
//     //over to deletes and remove the inserts to trick the delta processor.
//     // for (const changeset of changesets) {
//     //   changeset.deletes = changeset.deletes.concat(changeset.inserts);
//     //   changeset.inserts = [];
//     // }
//     // const result = await del.processDeltaChangesets(changesets);
//     // handleProcessingResult(result);
//   } catch (err) {
//     next(err);
//   } finally {
//     // lock.release();
//   }
// });

