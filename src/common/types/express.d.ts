import { UserFromToken } from '../interfaces/user-from-token';

declare module 'express' {
  export interface Request {
    user?: UserFromToken;
  }
}