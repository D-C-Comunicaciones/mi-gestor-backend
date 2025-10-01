import { ResponseCollectionRouteDto } from "../dto";

export interface FindAllFilters {
  isActive?: boolean;
  collectorId?: number;
}

export interface CollectionRouteWithCollector {
  id: number;
  collectorId: number;
  name: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: number;
  collector: {
    id: number;
    firstName: string;
    lastName: string;
    phone: string;
  };
}


export interface CollectionRouteList {
    customMessage: string;
    collectionsRoutes: ResponseCollectionRouteDto[];
}