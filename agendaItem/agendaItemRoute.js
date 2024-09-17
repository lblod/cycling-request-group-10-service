import { app } from 'mu';

/**
 * Agenda point mocking function
 * @param { Express.Request } req
 * @param { Express.Response} res
 */
const agendaItemMock = (req,res) => {

}

export function installAgendaItemRoutes(app) {
  app.post('/agenda-item/mock', postAgendaItemMock);
}
