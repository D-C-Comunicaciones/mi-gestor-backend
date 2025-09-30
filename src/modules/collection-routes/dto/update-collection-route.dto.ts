import { PartialType } from '@nestjs/swagger';
import { CreateCollectionRouteDto } from './create-collection-route.dto';

export class UpdateCollectionRouteDto extends PartialType(CreateCollectionRouteDto) {}
