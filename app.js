import { app } from 'mu';
import {installMockRoutes} from './lib/createResolutionRoute';
import bodyParser from 'body-parser';
import { updateApplicatonState} from './lib/updateEventApplicationState';

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
