import 'dotenv/config';
import * as joi from 'joi';

interface EnvVars {
    // APP NAME
    APP_NAME: string;

    APP_LOCALE: string;

    // APP VERSION
    APP_VERSION: string;

    // APP DESCRIPTION
    APP_DESCRIPTION: string;

    // APP ENVIRONMENT
    APP_ENVIRONMENT: 'development' | 'production' | 'test';

    // REPORTS VERTICAL TEXT
    VERTICAL_TEXT_REPORTS: string;

    // DATABASE
    DATABASE_URL: string;

    // SERVER
    APP_PORT: number;

    // JWT - ✅ Cambiar a string
    JWT_SECRET: string;
    BCRYPT_SALT_ROUNDS: string;
    EXPIRES_IN: string;

    // AES
    AES_SECRET: string;

    APP_REDIS_HOST: string;
    APP_REDIS_PORT: number;
    APP_REDIS_USERNAME: string;
    APP_REDIS_PASSWORD: string;

    APP_IP_GEOLOCATION: string;

    FRONTEND_URL: string;

    RABBITMQ_URLS: string;
    RABBITMQ_LOAN_INSTALLMENTS_QUEUE: string;
    RABBITMQ_LOAN_OVERDUE_QUEUE: string;
    RABBITMQ_IMPORT_QUEUE: string;

    ALLOWED_ORIGINS: string;

    // WEBHOOKS
    WEBHOOK_IMPORT_URL: string;

    // METRICS AUTH
    METRICS_ACCESS_TOKEN: string;
    METRICS_PREFIX: string;

}

const envVarsSchema = joi.object({
    // APP NAME
    APP_NAME: joi.string().default('MyApp'),

    APP_LOCALE: joi.string().default('es-CO'),

    // APP VERSION
    APP_VERSION: joi.string().default('1.0'),

    // APP DESCRIPTION
    APP_DESCRIPTION: joi.string().default('nestJS API'),

    // APP ENVIRONMENT
    APP_ENVIRONMENT: joi.string().valid('development', 'production', 'test').default('development'),

    // REPORTS VERTICAL TEXT
    VERTICAL_TEXT_REPORTS: joi.string().default('Reporte generado por MiGestor Software™  - © 2025 <a href="https://dccomunicacionessas.com" target="_blank">D&C IDEM COMUNICACIONES S.A.S.</a>'),

    // DATABASE
    DATABASE_URL: joi.string().uri().required(),

    // SERVER
    APP_PORT: joi.number().required(),

    // JWT - ✅ Corregir validaciones
    JWT_SECRET: joi.string().required(),
    BCRYPT_SALT_ROUNDS: joi.string().default('10'),
    EXPIRES_IN: joi.string().default('24h'), // ✅ String con formato tiempo

    // AES
    AES_SECRET: joi.string().optional(),

    APP_REDIS_HOST: joi.string().required().default('localhost'),
    APP_REDIS_PORT: joi.number().required().default(6379),
    APP_REDIS_USERNAME: joi.string().required().default('default'),
    APP_REDIS_PASSWORD: joi.string().required().default('redis'),

    APP_IP_GEOLOCATION: joi.string().optional(),

    RABBITMQ_URLS: joi.string().required().default('amqp://localhost:5672'),
    RABBITMQ_LOAN_INSTALLMENTS_QUEUE: joi.string().required().default('loan_installments'),
    RABBITMQ_LOAN_OVERDUE_QUEUE: joi.string().required().default('loan_overdue'),
    RABBITMQ_IMPORT_QUEUE: joi.string().required().default('import_queue'),

    ALLOWED_ORIGINS: joi.string().required().default('http://localhost:3000,http://localhost:5173'),

    // WEBHOOKS
    WEBHOOK_IMPORT_URL: joi.string().uri().optional(),

    // METRICS AUTH
    METRICS_ACCESS_TOKEN: joi.string().optional(),
    METRICS_PREFIX: joi.string().default('migestor_metrics'),

}).unknown(true);

const { error, value } = envVarsSchema.validate(process.env);

if (error) {
    throw new Error(`Config validation error: ${error.message}`);
}

const envVars: EnvVars = value;

export const envs = {
    // APP NAME
    appName: envVars.APP_NAME,

    // APP LOCALE
    appLocale: envVars.APP_LOCALE,

    // APP VERSION
    appVersion: envVars.APP_VERSION,

    // APP DESCRIPTION
    appDescription: envVars.APP_DESCRIPTION,

    // SERVER
    port: envVars.APP_PORT,

    // DATABASE
    databaseUrl: envVars.DATABASE_URL,

    // ENVIRONMENT
    environment: envVars.APP_ENVIRONMENT,

    // REPORTS VERTICAL TEXT
    verticalTextReports: envVars.VERTICAL_TEXT_REPORTS,

    // JWT - ✅ Usar string consistentemente
    jwtSecret: envVars.JWT_SECRET,
    bcryptSaltRounds: envVars.BCRYPT_SALT_ROUNDS,
    expiresIn: envVars.EXPIRES_IN, // ✅ Ahora es string

    // AES
    aesSecret: envVars.AES_SECRET,

    redis: {
        host: envVars.APP_REDIS_HOST,
        port: envVars.APP_REDIS_PORT,
        username: envVars.APP_REDIS_USERNAME,
        password: envVars.APP_REDIS_PASSWORD,
        loanInstallmentsQueue: envVars.RABBITMQ_LOAN_INSTALLMENTS_QUEUE
    },

    ipGeoLocation: envVars.APP_IP_GEOLOCATION,

    frontendUrl: envVars.FRONTEND_URL || 'http://localhost:3000',

    rabbitMq: {
        url: envVars.RABBITMQ_URLS,
        loanInstallmentsQueue: envVars.RABBITMQ_LOAN_INSTALLMENTS_QUEUE,
        loanOverdueQueue: envVars.RABBITMQ_LOAN_OVERDUE_QUEUE,
        importQueue: process.env.RABBITMQ_IMPORT_QUEUE || 'import_queue',
        notificationQueue: process.env.RABBITMQ_NOTIFICATION_QUEUE || 'notification_queue',
    },

    allowedOrigins: envVars.ALLOWED_ORIGINS,

    webhooks: {
        importUrl: envVars.WEBHOOK_IMPORT_URL,
    },

    metrics:{
        prefix: envVars.METRICS_PREFIX,
        metricsAccessToken: envVars.METRICS_ACCESS_TOKEN,
    }
    
};