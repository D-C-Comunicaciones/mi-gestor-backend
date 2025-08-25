import { envs } from '@config/envs';
import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import * as amqp from 'amqplib';

@Injectable()
export class RabbitMqService implements OnModuleInit, OnModuleDestroy {
  private connection: amqp.Connection;
  private channel: amqp.Channel;
  private isConnecting: boolean = false;
  private connectionPromise: Promise<void> | null = null;
  private readonly maxRetries: number = 5;
  private retryCount: number = 0;

  private readonly logger = new Logger(RabbitMqService.name);

  async onModuleInit() {
    // Solo iniciar conexión, no bloquear el módulo
    this.connectWithRetry().catch(error => {
      this.logger.error('Error inicializando RabbitMQ:', error);
    });
  }

  async onModuleDestroy() {
    await this.disconnect();
  }

  private async connectWithRetry(): Promise<void> {
    if (this.isConnecting && this.connectionPromise) {
      // Si ya se está conectando, retornar la promesa existente
      return this.connectionPromise;
    }

    this.isConnecting = true;
    this.connectionPromise = this.attemptConnection();
    return this.connectionPromise;
  }

  private async attemptConnection(): Promise<void> {
    while (this.retryCount < this.maxRetries) {
      try {
        await this.connect();
        this.retryCount = 0;
        this.isConnecting = false;
        this.connectionPromise = null;
        return;
      } catch (error) {
        this.retryCount++;
        this.logger.warn(`❌ Intento ${this.retryCount}/${this.maxRetries} de conexión fallido. Reintentando en 5s...`);
        
        if (this.retryCount >= this.maxRetries) {
          this.logger.error('❌ Máximo de intentos de conexión alcanzado');
          this.isConnecting = false;
          this.connectionPromise = null;
          throw error;
        }
        
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
  }

  private async connect(): Promise<void> {
    try {
      // Cerrar conexiones existentes si las hay
      await this.disconnect();

      this.connection = await amqp.connect(envs.rabbitMq.url || 'amqp://localhost:5672');
      this.channel = await this.connection.createChannel();

      // Manejar eventos de error
      this.connection.on('error', (error) => {
        this.logger.error('❌ Error de conexión RabbitMQ:', error);
        this.handleConnectionError();
      });

      this.connection.on('close', () => {
        this.logger.warn('🔌 Conexión RabbitMQ cerrada, reconectando...');
        this.handleConnectionError();
      });

      this.channel.on('error', (error) => {
        this.logger.error('❌ Error de canal RabbitMQ:', error);
        this.handleConnectionError();
      });

      this.channel.on('close', () => {
        this.logger.warn('🔌 Canal RabbitMQ cerrado');
      });

      this.logger.log('✅ Conectado a RabbitMQ exitosamente');
      
    } catch (error) {
      this.logger.error('❌ Error en conexión inicial RabbitMQ:', error);
      throw error;
    }
  }

  private async handleConnectionError(): Promise<void> {
    // Limpiar referencias
    this.channel = null;
    this.connection = null;
    this.isConnecting = false;
    this.connectionPromise = null;
    
    // Reconectar después de un breve delay
    setTimeout(() => {
      this.connectWithRetry().catch(error => {
        this.logger.error('Error en reconexión automática:', error);
      });
    }, 5000);
  }

  private async disconnect(): Promise<void> {
    try {
      if (this.channel) {
        await this.channel.close().catch(error => {
          this.logger.warn('⚠️ Error cerrando canal:', error);
        });
        this.channel = null;
      }
      
      if (this.connection) {
        await this.connection.close().catch(error => {
          this.logger.warn('⚠️ Error cerrando conexión:', error);
        });
        this.connection = null;
      }
    } catch (error) {
      this.logger.error('❌ Error en desconexión RabbitMQ:', error);
    } finally {
      this.isConnecting = false;
      this.connectionPromise = null;
    }
  }

  private async ensureConnection(): Promise<void> {
    if (this.connection && this.channel) {
      return; // Ya está conectado
    }

    if (this.isConnecting && this.connectionPromise) {
      // Esperar a que la conexión en progreso se complete
      await this.connectionPromise;
      return;
    }

    // Iniciar nueva conexión
    await this.connectWithRetry();
  }

  async assertQueue(queueName: string): Promise<void> {
    await this.ensureConnection();
    await this.channel.assertQueue(queueName, { durable: true });
    this.logger.log(`✅ Cola ${queueName} asegurada`);
  }

  async sendToQueue(queueName: string, message: any, options?: any): Promise<void> {
    await this.ensureConnection();
    await this.channel.assertQueue(queueName, { durable: true });
    this.channel.sendToQueue(
      queueName,
      Buffer.from(JSON.stringify(message)),
      { persistent: true, ...options }
    );
    this.logger.log(`✅ Mensaje enviado a cola: ${queueName}`);
  }

  async consume(queueName: string, callback: (msg: amqp.ConsumeMessage) => void): Promise<void> {
    await this.ensureConnection();
    await this.channel.assertQueue(queueName, { durable: true });
    this.channel.consume(queueName, (msg) => {
      if (msg !== null) {
        callback(msg);
        this.channel.ack(msg);
      }
    });
    this.logger.log(`✅ Consumiendo de cola: ${queueName}`);
  }

  async publishWithDelay(queue: string, message: any, delay: number): Promise<void> {
    await this.ensureConnection();

    const exchange = `${queue}_delayed_exchange`;
    
    try {
      // Asegurar que el exchange delayed existe
      await this.channel.assertExchange(exchange, 'x-delayed-message', {
        durable: true,
        arguments: { 'x-delayed-type': 'direct' },
      });

      // Asegurar que la cola existe
      await this.channel.assertQueue(queue, { durable: true });
      
      // Vincular cola al exchange
      await this.channel.bindQueue(queue, exchange, queue);

      // Publicar mensaje con delay
      this.channel.publish(
        exchange,
        queue,
        Buffer.from(JSON.stringify(message)),
        { 
          headers: { 'x-delay': delay },
          persistent: true
        }
      );

      this.logger.log(`✅ Mensaje con delay de ${delay}ms publicado en cola: ${queue}`);

    } catch (error) {
      this.logger.error('❌ Error publicando mensaje con delay:', error);
      throw error;
    }
  }

  getConnectionStatus(): string {
    if (this.connection && this.channel) return 'connected';
    if (this.isConnecting) return 'connecting';
    return 'disconnected';
  }

  // Método para esperar conexión explícitamente
  async waitForConnection(): Promise<void> {
    if (this.connection && this.channel) {
      return;
    }
    
    if (this.isConnecting && this.connectionPromise) {
      await this.connectionPromise;
      return;
    }
    
    await this.connectWithRetry();
  }
}