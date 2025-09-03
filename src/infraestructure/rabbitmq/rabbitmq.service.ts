import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import * as amqp from 'amqplib';
import { envs } from '@config/envs';

@Injectable()
export class RabbitMqService implements OnModuleInit, OnModuleDestroy {
  private connection: amqp.Connection;
  private publishChannel: amqp.ConfirmChannel;
  private consumeChannels: Map<string, amqp.Channel> = new Map();

  private isConnecting = false;
  private connectionPromise: Promise<void> | null = null;
  private readonly maxRetries = 5;
  private retryCount = 0;

  private readonly logger = new Logger(RabbitMqService.name);

  async onModuleInit() {
    await this.connectWithRetry().catch(err =>
      this.logger.error('Error inicializando RabbitMQ:', err),
    );
  }

  async onModuleDestroy() {
    await this.disconnect();
  }

  /** --- 🔗 Conexión y Reconexión --- */
  private async connectWithRetry(): Promise<void> {
    if (this.isConnecting && this.connectionPromise) return this.connectionPromise;

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
      } catch (err) {
        this.retryCount++;
        this.logger.warn(`❌ Intento ${this.retryCount}/${this.maxRetries} fallido. Reintentando en 5s...`);
        if (this.retryCount >= this.maxRetries) {
          this.isConnecting = false;
          this.connectionPromise = null;
          this.logger.error('❌ Máximo de intentos alcanzado');
          throw err;
        }
        await new Promise(res => setTimeout(res, 5000));
      }
    }
  }

  private async connect(): Promise<void> {
    await this.disconnect();

    this.connection = await amqp.connect(envs.rabbitMq.url || 'amqp://localhost:5672');

    // ✅ Canal único para publicación
    this.publishChannel = await this.connection.createConfirmChannel();
    this.publishChannel.on('error', err => this.logger.error('❌ Publish channel error:', err));
    this.publishChannel.on('close', () => this.logger.warn('🔌 Publish channel cerrado'));

    this.connection.on('error', err => {
      this.logger.error('❌ Error de conexión RabbitMQ:', err);
      this.handleConnectionError();
    });

    this.connection.on('close', () => {
      this.logger.warn('🔌 Conexión RabbitMQ cerrada, reconectando...');
      this.handleConnectionError();
    });

    this.logger.log('✅ Conectado a RabbitMQ exitosamente');
  }

  private handleConnectionError() {
    this.publishChannel = null;
    this.connection = null;
    this.consumeChannels.clear();
    this.isConnecting = false;
    this.connectionPromise = null;

    setTimeout(() => {
      this.connectWithRetry().catch(err =>
        this.logger.error('Error reconectando automáticamente:', err),
      );
    }, 5000);
  }

  private async disconnect(): Promise<void> {
    try {
      // Cerramos todos los canales de consumo
      for (const [queue, channel] of this.consumeChannels.entries()) {
        await channel.close().catch(err =>
          this.logger.warn(`⚠️ Error cerrando canal de consumo (${queue}):`, err),
        );
      }
      this.consumeChannels.clear();

      if (this.publishChannel) {
        await this.publishChannel.close().catch(err =>
          this.logger.warn('⚠️ Error cerrando publish channel:', err),
        );
        this.publishChannel = null;
      }
      if (this.connection) {
        await this.connection.close().catch(err =>
          this.logger.warn('⚠️ Error cerrando conexión:', err),
        );
        this.connection = null;
      }
    } finally {
      this.isConnecting = false;
      this.connectionPromise = null;
    }
  }

  private async ensureConnection(): Promise<void> {
    if (this.connection && this.publishChannel) return;
    if (this.isConnecting && this.connectionPromise) await this.connectionPromise;
    else await this.connectWithRetry();
  }

  async waitForConnection(): Promise<void> {
    await this.ensureConnection();
  }

  /** --- 📨 Publicar Mensajes --- */
  async assertQueue(queueName: string): Promise<void> {
    await this.ensureConnection();
    await this.publishChannel.assertQueue(queueName, { durable: true });
    this.logger.log(`✅ Cola ${queueName} asegurada`);
  }

  async sendToQueue(queueName: string, message: any, options?: amqp.Options.Publish): Promise<void> {
    await this.ensureConnection();
    await this.publishChannel.assertQueue(queueName, { durable: true });

    this.publishChannel.sendToQueue(queueName, Buffer.from(JSON.stringify(message)), {
      persistent: true,
      ...options,
    });

    this.logger.debug(`📤 Mensaje enviado a cola: ${queueName}`);
  }

  async publishWithDelay(queue: string, message: any, delay: number): Promise<void> {
    await this.ensureConnection();
    const exchange = `${queue}_delayed_exchange`;

    await this.publishChannel.assertExchange(exchange, 'x-delayed-message', {
      durable: true,
      arguments: { 'x-delayed-type': 'direct' },
    });

    await this.publishChannel.assertQueue(queue, { durable: true });
    await this.publishChannel.bindQueue(queue, exchange, queue);

    this.publishChannel.publish(exchange, queue, Buffer.from(JSON.stringify(message)), {
      headers: { 'x-delay': delay },
      persistent: true,
    });

    this.logger.debug(`⏳ Mensaje con delay de ${delay}ms publicado en cola: ${queue}`);
  }

  /** --- 📥 Consumir Mensajes (canal dedicado por cola) --- */
  async consume(
    queueName: string,
    callback: (msg: amqp.ConsumeMessage, ack: () => void, nack: (requeue?: boolean) => void) => void,
    prefetch = 10
  ): Promise<void> {
    await this.ensureConnection();

    if (this.consumeChannels.has(queueName)) {
      this.logger.warn(`⚠️ Ya existe un consumidor para la cola: ${queueName}`);
      return;
    }

    const channel = await this.connection.createChannel();
    channel.prefetch(prefetch);
    await channel.assertQueue(queueName, { durable: true });

    channel.consume(queueName, (msg) => {
      if (!msg) return;

      const ack = () => {
        try {
          channel.ack(msg);
        } catch (err) {
          this.logger.error(`⚠️ Error haciendo ack en ${queueName}:`, err);
        }
      };

      const nack = (requeue = true) => {
        try {
          channel.nack(msg, false, requeue);
        } catch (err) {
          this.logger.error(`⚠️ Error haciendo nack en ${queueName}:`, err);
        }
      };

      try {
        callback(msg, ack, nack);
      } catch (err) {
        this.logger.error(`❌ Error procesando mensaje en ${queueName}:`, err);
        nack(true);
      }
    });

    this.consumeChannels.set(queueName, channel);
    this.logger.log(`✅ Consumidor registrado para cola: ${queueName} en canal dedicado`);
  }

  getConnectionStatus(): string {
    if (this.connection && this.publishChannel) return 'connected';
    if (this.isConnecting) return 'connecting';
    return 'disconnected';
  }
}
