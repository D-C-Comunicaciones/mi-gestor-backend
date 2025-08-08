import 'dotenv/config';
import * as joi from 'joi';

interface EnvVars {
    // APP NAME
    APP_NAME: string;
    // APP VERSION
    APP_VERSION: string;
    // APP DESCRIPTION
    APP_DESCRIPTION: string;
    // APP ENVIRONMENT
    APP_ENVIRONMENT: 'development' | 'production' | 'test';

    // DATABASE
    DATABASE_URL: string;

    // SERVER
    APP_PORT: number;

    // EMAIL
    MAIL_HOST: string;
    MAIL_PORT: number;
    MAIL_USER: string;
    MAIL_PASS: string;
    MAIL_FROM?: string;
    FRONTEND_URL?: string;

    // JWT - ✅ Cambiar a string
    JWT_SECRET: string;
    BCRYPT_SALT_ROUNDS: string;
    EXPIRES_IN: string;

    // AES
    AES_SECRET: string;

    APP_REDIS_HOST: string;
    APP_REDIS_PORT: number;
    APP_REDIS_PASSWORD: string;

    APP_IP_GEOLOCATION: string;
}

const envVarsSchema = joi.object({
    // APP NAME
    APP_NAME: joi.string().default('MyApp'),

    // APP VERSION
    APP_VERSION: joi.string().default('1.0'),
    // APP DESCRIPTION
    APP_DESCRIPTION: joi.string().default('E-DUCATIVE'),

    // APP ENVIRONMENT
    APP_ENVIRONMENT: joi.string().default('development'),

    // DATABASE
    DATABASE_URL: joi.string().uri().required(),

    // SERVER
    APP_PORT: joi.number().required(),

    // ENVIRONMENT
    NODE_ENV: joi.string().valid('development', 'production', 'test').default('development'),

    // EMAIL
    MAIL_HOST: joi.string().required(),
    MAIL_PORT: joi.number().default(587),
    MAIL_USER: joi.string().email().required(),
    MAIL_PASS: joi.string().required(),
    MAIL_FROM: joi.string().email().optional(),
    FRONTEND_URL: joi.string().uri().optional(),

    // JWT - ✅ Corregir validaciones
    JWT_SECRET: joi.string().required(),
    BCRYPT_SALT_ROUNDS: joi.string().default('10'),
    EXPIRES_IN: joi.string().default('24h'), // ✅ String con formato tiempo

    // AES
    AES_SECRET: joi.string().optional(),

    APP_REDIS_HOST: joi.string().required().default('localhost'),
    APP_REDIS_PORT: joi.number().required().default(6379),
    APP_REDIS_PASSWORD: joi.string().required().default('redis'),

    APP_IP_GEOLOCATION: joi.string().optional(),

}).unknown(true);

const { error, value } = envVarsSchema.validate(process.env);

if (error) {
    throw new Error(`Config validation error: ${error.message}`);
}

const envVars: EnvVars = value;

export const envs = {
    // APP NAME
    appName: envVars.APP_NAME,
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
    mail: {
        host: envVars.MAIL_HOST,
        port: envVars.MAIL_PORT,
        user: envVars.MAIL_USER,
        pass: envVars.MAIL_PASS,
        from: envVars.MAIL_FROM || `${envVars.MAIL_USER}`,
        frontendUrl: envVars.FRONTEND_URL || 'http://localhost:3000',
    },

    // JWT - ✅ Usar string consistentemente
    jwtSecret: envVars.JWT_SECRET,
    bcryptSaltRounds: envVars.BCRYPT_SALT_ROUNDS,
    expiresIn: envVars.EXPIRES_IN, // ✅ Ahora es string

    // AES
    aesSecret: envVars.AES_SECRET,

    redis: {
        host: envVars.APP_REDIS_HOST,
        port: envVars.APP_REDIS_PORT,
        password: envVars.APP_REDIS_PASSWORD,
    },

    ipGeoLocation: envVars.APP_IP_GEOLOCATION,

    frontendUrl: envVars.FRONTEND_URL || 'http://localhost:3000',
};
