import { Prisma } from '@prisma/client';

export interface CustomerWithRelations extends Prisma.CustomerGetPayload<{
  include: {
    typeDocumentIdentification: true;
    gender: true;
    zone: true;
    user: true; // si quieres incluir info del user, aunque aquí solo tomas userId
  }
}>{};