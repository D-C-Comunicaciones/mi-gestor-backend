import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
@WebSocketGateway({
  namespace: '/reports',
  cors: {
    origin: '*', // ajusta según tus necesidades de seguridad
  },
})
export class ReportsGateway {
  private readonly logger = new Logger(ReportsGateway.name);

  @WebSocketServer()
  server: Server;

  emitReport(reportName: string, data: any) {
    this.logger.log(`🔔 Emitiendo reporte: ${reportName} a todos los clientes conectados`);
    this.server.emit('report_generated', { reportName, data });
  }

  // Opcional: manejar eventos de conexión/desconexión
  handleConnection(client: any, ...args: any[]) {
    this.logger.log(`Cliente conectado: ${client.id}`);
  }

  handleDisconnect(client: any) {
    this.logger.log(`Cliente desconectado: ${client.id}`);
  }
}
