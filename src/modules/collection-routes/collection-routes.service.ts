import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@infraestructure/prisma/prisma.service';
import { CreateCollectionRouteDto } from './dto/create-collection-route.dto';
import { UpdateCollectionRouteDto } from './dto/update-collection-route.dto';
import { FindAllFilters } from './interfaces/collection-route.interface';
import { AssignCustomersToRouteDto } from './dto/assign-customers-to-route.dto';
import { PaginationDto } from '@common/dto';
import { CollectionRoutesPaginationDto } from './dto';
import { Prisma } from '@prisma/client';
import { AssignCollectorToRouteDto } from './dto/assign-collector-to-route.dto';
import { BulkAssignCollectorsDto } from './dto/bulk-assign-collectors.dto';
import { BulkAssignCustomersDto } from './dto/bulk-assign-customers.dto';

@Injectable()
export class CollectionRoutesService {
  constructor(private readonly prisma: PrismaService) { }

  async create(createCollectionRouteDto: CreateCollectionRouteDto, req) {
    const user = req['user'];
    if (!user?.userId) {
      throw new BadRequestException('Usuario no autenticado');
    }
    // Verificar que el cobrador existe solo si se proporciona collectorId
    if (createCollectionRouteDto.collectorId) {
      const collector = await this.prisma.collector.findUnique({
        where: { id: createCollectionRouteDto.collectorId }
      });

      if (!collector) {
        throw new NotFoundException(`Cobrador con ID ${createCollectionRouteDto.collectorId} no encontrado`);
      }
    }

    // Verificar que no existe una ruta con el mismo nombre
    const existingRoute = await this.prisma.collectionRoute.findFirst({
      where: { name: createCollectionRouteDto.name }
    });

    if (existingRoute) {
      throw new BadRequestException(`Ya existe una ruta con el nombre "${createCollectionRouteDto.name}"`);
    }

    const route = await this.prisma.collectionRoute.create({
      data: {
        ...createCollectionRouteDto,
        createdBy: user.userId
      },
      include: {
        collector: createCollectionRouteDto.collectorId ? {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true
          }
        } : false
      }
    });

    return route;
  }

  async findAll(paginationDto: CollectionRoutesPaginationDto) {
    const { page = 1, limit = 10, isActive } = paginationDto;

    const where: Prisma.CollectionRouteWhereInput = {
      ...(typeof isActive === 'boolean' && { isActive }),
    };

    const totalItems = await this.prisma.collectionRoute.count({ where });
    const lastPage = Math.ceil(totalItems / limit || 1);

    if (page > lastPage && totalItems > 0) {
      throw new BadRequestException(`La página #${page} no existe`);
    }

    const rawCollectionRoutes = await this.prisma.collectionRoute.findMany({
      where: { ...where },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { id: 'asc' },
    });

    return {
      rawCollectionRoutes,
      meta: {
        total: totalItems,
        page,
        lastPage,
        limit,
        hasNextPage: page < lastPage,
      },
    };
  }

  async findOne(id: number) {
    const route = await this.prisma.collectionRoute.findUnique({
      where: { id },
      include: {
        collector: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
        customers: true,
      },
    });

    if (!route) {
      throw new NotFoundException(`Ruta de cobranza con ID ${id} no encontrada`);
    }

    return route;
  }

  async update(id: number, updateCollectionRouteDto: UpdateCollectionRouteDto) {
    // Verificar que la ruta existe
    await this.findOne(id);

    // Si se está actualizando el cobrador, verificar que existe
    if (updateCollectionRouteDto.collectorId) {
      const collector = await this.prisma.collector.findUnique({
        where: { id: updateCollectionRouteDto.collectorId }
      });

      if (!collector) {
        throw new NotFoundException(`Cobrador con ID ${updateCollectionRouteDto.collectorId} no encontrado`);
      }
    }

    // Si se está actualizando el nombre, verificar que no exista otro con el mismo nombre
    if (updateCollectionRouteDto.name) {
      const existingRoute = await this.prisma.collectionRoute.findFirst({
        where: {
          name: updateCollectionRouteDto.name,
          NOT: { id }
        }
      });

      if (existingRoute) {
        throw new BadRequestException(`Ya existe una ruta con el nombre "${updateCollectionRouteDto.name}"`);
      }
    }

    const updatedRoute = await this.prisma.collectionRoute.update({
      where: { id },
      data: updateCollectionRouteDto,
      include: {
        collector: updateCollectionRouteDto.collectorId || updateCollectionRouteDto.collectorId === undefined ? {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true
          }
        } : false
      }
    });

    return updatedRoute;
  }

  async changeStatus(id: number, isActive: boolean) {
    // Verificar que la ruta existe
    await this.findOne(id);

    const updatedRoute = await this.prisma.collectionRoute.update({
      where: { id },
      data: { isActive }
    });

    return {
      id: updatedRoute.id,
      isActive: updatedRoute.isActive,
      message: 'Estado de la ruta actualizado exitosamente'
    };
  }

  async findByCollector(collectorId: number) {
    // Verificar que el cobrador existe
    const collector = await this.prisma.collector.findUnique({
      where: { id: collectorId }
    });

    if (!collector) {
      throw new NotFoundException(`Cobrador con ID ${collectorId} no encontrado`);
    }

    const routes = await this.prisma.collectionRoute.findMany({
      where: { collectorId },
      include: {
        collector: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return routes;
  }

  async findUnassigned() {
    const routes = await this.prisma.collectionRoute.findMany({
      where: {
        collectorId: null,
        isActive: true
      },
      include: {
        collector: false
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return routes;
  }

  async assignCustomersToRoute(assignDto: AssignCustomersToRouteDto) {
    const { collectionRouteId, customerIds } = assignDto;

    // Verificar que la ruta de cobranza existe y está activa
    const route = await this.prisma.collectionRoute.findUnique({
      where: { id: collectionRouteId },
      include: {
        collector: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true
          }
        }
      }
    });

    if (!route) {
      throw new NotFoundException(`Ruta de cobranza con ID ${collectionRouteId} no encontrada`);
    }

    if (!route.isActive) {
      throw new BadRequestException(`La ruta de cobranza "${route.name}" está inactiva`);
    }

    // Verificar que todos los clientes existen y están activos
    const customers = await this.prisma.customer.findMany({
      where: {
        id: { in: customerIds },
        isActive: true
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        documentNumber: true,
        collectionRoute: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    // Verificar que se encontraron todos los clientes
    const foundCustomerIds = customers.map(c => c.id);
    const notFoundCustomerIds = customerIds.filter(id => !foundCustomerIds.includes(id));

    if (notFoundCustomerIds.length > 0) {
      throw new NotFoundException(
        `Los siguientes clientes no fueron encontrados o están inactivos: ${notFoundCustomerIds.join(', ')}`
      );
    }

    // Clasificar clientes según su estado actual de asignación
    const alreadyAssignedToThisRoute = customers.filter(c => c.collectionRoute?.id === collectionRouteId);
    const assignedToOtherRoutes = customers.filter(c => c.collectionRoute && c.collectionRoute.id !== collectionRouteId);
    const unassignedCustomers = customers.filter(c => !c.collectionRoute);

    // Solo procesar clientes que necesitan ser asignados o reasignados
    const customersToUpdate = customers.filter(c => c.collectionRoute?.id !== collectionRouteId);

    // Si todos los clientes ya están asignados a esta ruta
    if (alreadyAssignedToThisRoute.length === customers.length) {
      return {
        success: true,
        statusCode: 409, // Conflict - todos ya están asignados
        message: `Todos los clientes ya están asignados a la ruta "${route.name}"`,
        route: {
          id: route.id,
          name: route.name,
          collector: route.collector
        },
        summary: {
          totalProcessed: customerIds.length,
          totalAssigned: 0,
          totalReassigned: 0,
          totalNewAssignments: 0,
          alreadyAssigned: alreadyAssignedToThisRoute.length
        },
        assignedCustomers: alreadyAssignedToThisRoute.map(customer => ({
          id: customer.id,
          name: `${customer.firstName} ${customer.lastName}`,
          documentNumber: customer.documentNumber.toString(),
          previousRouteId: customer.collectionRoute?.id || null,
          newRouteId: customer.collectionRoute?.id || null,
          action: 'Ya asignado'
        })),
        warnings: []
      };
    }

    // Si no hay clientes para actualizar (este caso es redundante pero por seguridad)
    if (customersToUpdate.length === 0) {
      throw new BadRequestException('No se pudieron asignar los clientes a la ruta de cobro');
    }

    return this.prisma.$transaction(async (tx) => {
      // Actualizar solo los clientes que necesitan cambio
      const updatePromises = customersToUpdate.map(async (customer) => {
        return tx.customer.update({
          where: {
            id: customer.id,
            isActive: true
          },
          data: {
            collectionRoute: {
              connect: { id: collectionRouteId }
            }
          }
        });
      });

      // Ejecutar todas las actualizaciones
      const updateResults = await Promise.all(updatePromises);

      // Obtener los clientes actualizados con información completa
      const updatedCustomers = await tx.customer.findMany({
        where: {
          id: { in: customerIds }
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          documentNumber: true,
          collectionRoute: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });

      // Determinar el mensaje y código de estado según el resultado
      let statusCode = 200;
      let message = '';

      if (alreadyAssignedToThisRoute.length > 0 && updateResults.length > 0) {
        // Algunos se asignaron, otros ya se encontraban asignados
        statusCode = 200;
        message = `Se asignaron algunos clientes, otros ya se encontraban asignados a la ruta "${route.name}"`;
      } else if (updateResults.length > 0) {
        // Todos se asignaron correctamente
        statusCode = 200;
        message = `${updateResults.length} clientes asignados exitosamente a la ruta "${route.name}"`;
      } else {
        // No se asignó ninguno (este caso no debería ocurrir con la lógica actual)
        throw new BadRequestException('No se pudieron asignar los clientes a la ruta de cobro');
      }

      return {
        success: true,
        statusCode,
        message,
        route: {
          id: route.id,
          name: route.name,
          collector: route.collector
        },
        summary: {
          totalProcessed: customerIds.length,
          totalAssigned: updateResults.length,
          totalReassigned: assignedToOtherRoutes.length,
          totalNewAssignments: unassignedCustomers.length,
          alreadyAssigned: alreadyAssignedToThisRoute.length
        },
        assignedCustomers: updatedCustomers.map(customer => {
          const originalCustomer = customers.find(c => c.id === customer.id);
          const wasAlreadyAssigned = originalCustomer?.collectionRoute?.id === collectionRouteId;
          const wasReassigned = originalCustomer?.collectionRoute && originalCustomer.collectionRoute.id !== collectionRouteId;
          const wasUnassigned = !originalCustomer?.collectionRoute;

          let action = '';
          if (wasAlreadyAssigned) action = 'Ya asignado';
          else if (wasReassigned) action = 'Reasignado';
          else if (wasUnassigned) action = 'Nuevo';

          return {
            id: customer.id,
            name: `${customer.firstName} ${customer.lastName}`,
            documentNumber: customer.documentNumber.toString(),
            previousRouteId: originalCustomer?.collectionRoute?.id || null,
            newRouteId: customer.collectionRoute?.id || null,
            action
          };
        }),
        warnings: []
      };
    });
  }

  async assignCollectorToRoute(routeId: number, assignDto: AssignCollectorToRouteDto) {
    const { collectorId } = assignDto;

    // Verificar que la ruta existe y está activa
    const route = await this.prisma.collectionRoute.findUnique({
      where: { id: routeId },
      include: {
        collector: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true
          }
        }
      }
    });

    if (!route) {
      throw new NotFoundException(`Ruta de cobranza con ID ${routeId} no encontrada`);
    }

    if (!route.isActive) {
      throw new BadRequestException(`La ruta de cobranza "${route.name}" está inactiva`);
    }

    // Verificar que el cobrador existe y está activo
    const collector = await this.prisma.collector.findUnique({
      where: { id: collectorId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        phone: true,
        isActive: true
      }
    });

    if (!collector) {
      throw new NotFoundException(`Cobrador con ID ${collectorId} no encontrado`);
    }

    if (!collector.isActive) {
      throw new BadRequestException(`El cobrador "${collector.firstName} ${collector.lastName}" está inactivo`);
    }

    // Verificar si el cobrador ya está asignado a esta ruta
    if (route.collectorId === collectorId) {
      return {
        success: true,
        statusCode: 409,
        message: `El cobrador "${collector.firstName} ${collector.lastName}" ya está asignado a la ruta "${route.name}"`,
        route: {
          id: route.id,
          name: route.name,
          collectorId: route.collectorId,
          collector: route.collector
        },
        previousCollector: route.collector,
        newCollector: collector,
        action: 'Ya asignado'
      };
    }

    // Actualizar la ruta con el nuevo cobrador
    const updatedRoute = await this.prisma.collectionRoute.update({
      where: { id: routeId },
      data: { collectorId },
      include: {
        collector: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true
          }
        }
      }
    });

    // Determinar el mensaje según si había cobrador anterior o no
    let message = '';
    let action = '';

    if (route.collector) {
      message = `Cobrador reasignado exitosamente. La ruta "${route.name}" ahora está asignada a "${collector.firstName} ${collector.lastName}"`;
      action = 'Reasignado';
    } else {
      message = `Cobrador asignado exitosamente. La ruta "${route.name}" ahora está asignada a "${collector.firstName} ${collector.lastName}"`;
      action = 'Nuevo';
    }

    return {
      success: true,
      statusCode: 200,
      message,
      route: {
        id: updatedRoute.id,
        name: updatedRoute.name,
        collectorId: updatedRoute.collectorId,
        collector: updatedRoute.collector
      },
      previousCollector: route.collector,
      newCollector: collector,
      action
    };
  }

  async bulkAssignCollectors(assignDto: BulkAssignCollectorsDto) {
    const { routeIds, collectorIds, singleCollectorId } = assignDto;

    // Validar que se proporcionó una de las opciones
    if (!collectorIds && singleCollectorId === undefined) {
      throw new BadRequestException('Debe proporcionar collectorIds o singleCollectorId');
    }

    if (collectorIds && singleCollectorId !== undefined) {
      throw new BadRequestException('No puede proporcionar tanto collectorIds como singleCollectorId');
    }

    // Si se usa collectorIds, debe coincidir con routeIds
    if (collectorIds && collectorIds.length !== routeIds.length) {
      throw new BadRequestException('La cantidad de collectorIds debe coincidir con routeIds');
    }

    // Verificar que todas las rutas existen
    const routes = await this.prisma.collectionRoute.findMany({
      where: { id: { in: routeIds } },
      include: {
        collector: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true
          }
        }
      }
    });

    if (routes.length !== routeIds.length) {
      const foundIds = routes.map(r => r.id);
      const notFound = routeIds.filter(id => !foundIds.includes(id));
      throw new NotFoundException(`Rutas no encontradas: ${notFound.join(', ')}`);
    }

    // Obtener IDs únicos de cobradores para validar (excluyendo null)
    const uniqueCollectorIds = singleCollectorId !== undefined 
      ? [singleCollectorId].filter(id => id !== null)
      : [...new Set(collectorIds!.filter(id => id !== null))];

    // Verificar que todos los cobradores existen y están activos
    if (uniqueCollectorIds.length > 0) {
      const collectors = await this.prisma.collector.findMany({
        where: { 
          id: { in: uniqueCollectorIds },
          isActive: true 
        }
      });

      if (collectors.length !== uniqueCollectorIds.length) {
        const foundIds = collectors.map(c => c.id);
        const notFound = uniqueCollectorIds.filter(id => !foundIds.includes(id));
        throw new NotFoundException(`Cobradores no encontrados o inactivos: ${notFound.join(', ')}`);
      }
    }

    return this.prisma.$transaction(async (tx) => {
      const results: {
        routeId: number;
        routeName: string;
        previousCollectorId: number | null;
        newCollectorId: number | null;
        action: string;
        message: string;
      }[] = [];
      
      for (let i = 0; i < routeIds.length; i++) {
        const routeId = routeIds[i];
        const collectorId = singleCollectorId !== undefined ? singleCollectorId : collectorIds![i];
        
        const route = routes.find(r => r.id === routeId)!;
        
        // Determinar acción
        let action = '';
        let message = '';
        
        if (collectorId === null) {
          // Desasignar
          if (route.collectorId === null) {
            action = 'Sin cambios';
            message = `La ruta "${route.name}" ya no tenía cobrador asignado`;
          } else {
            action = 'Desasignado';
            message = `Cobrador desasignado de la ruta "${route.name}"`;
          }
        } else if (route.collectorId === collectorId) {
          action = 'Ya asignado';
          message = `El cobrador ya estaba asignado a la ruta "${route.name}"`;
        } else if (route.collectorId && route.collectorId !== collectorId) {
          action = 'Reasignado';
          message = `Cobrador reasignado en la ruta "${route.name}"`;
        } else {
          action = 'Nuevo';
          message = `Cobrador asignado a la ruta "${route.name}"`;
        }

        // Actualizar solo si hay cambio
        if (route.collectorId !== collectorId) {
          await tx.collectionRoute.update({
            where: { id: routeId },
            data: { collectorId }
          });
        }

        results.push({
          routeId,
          routeName: route.name,
          previousCollectorId: route.collectorId,
          newCollectorId: collectorId,
          action,
          message
        });
      }

      const summary = {
        totalProcessed: routeIds.length,
        assigned: results.filter(r => r.action === 'Nuevo').length,
        reassigned: results.filter(r => r.action === 'Reasignado').length,
        unassigned: results.filter(r => r.action === 'Desasignado').length,
        alreadyAssigned: results.filter(r => r.action === 'Ya asignado').length,
        noChanges: results.filter(r => r.action === 'Sin cambios').length
      };

      // Generar mensaje dinámico basado en resultados
      let mainMessage = '';
      let statusCode = 200;

      if (summary.totalProcessed === summary.noChanges + summary.alreadyAssigned) {
        // Todos ya estaban en el estado deseado
        if (summary.alreadyAssigned > 0) {
          mainMessage = `Todos los cobradores ya estaban asignados a sus rutas correspondientes`;
          statusCode = 409;
        } else {
          mainMessage = `Todas las rutas ya no tenían cobrador asignado`;
          statusCode = 409;
        }
      } else if (summary.assigned + summary.reassigned + summary.unassigned > 0) {
        // Se realizaron cambios
        if (summary.alreadyAssigned > 0 || summary.noChanges > 0) {
          // Algunos cambios, otros ya estaban bien
          const changeActions: string[] = [];
          if (summary.assigned > 0) changeActions.push(`${summary.assigned} asignados`);
          if (summary.reassigned > 0) changeActions.push(`${summary.reassigned} reasignados`);
          if (summary.unassigned > 0) changeActions.push(`${summary.unassigned} desasignados`);
          
          mainMessage = `Se procesaron algunas asignaciones (${changeActions.join(', ')}), otros ya se encontraban en el estado correcto`;
        } else {
          // Todos los cambios fueron exitosos
          const totalChanges = summary.assigned + summary.reassigned + summary.unassigned;
          mainMessage = `${totalChanges} asignaciones de cobradores procesadas exitosamente`;
        }
      } else {
        // No se pudo procesar nada
        throw new BadRequestException('No se pudieron procesar las asignaciones de cobradores');
      }

      return {
        success: true,
        statusCode,
        message: mainMessage,
        summary,
        results
      };
    });
  }

  async bulkAssignCustomers(assignDto: BulkAssignCustomersDto) {
    const { customerIds, routeIds, singleRouteId } = assignDto;

    // Validar que se proporcionó una de las opciones
    if (!routeIds && singleRouteId === undefined) {
      throw new BadRequestException('Debe proporcionar routeIds o singleRouteId');
    }

    if (routeIds && singleRouteId !== undefined) {
      throw new BadRequestException('No puede proporcionar tanto routeIds como singleRouteId');
    }

    // Si se usa routeIds, debe coincidir con customerIds
    if (routeIds && routeIds.length !== customerIds.length) {
      throw new BadRequestException('La cantidad de routeIds debe coincidir con customerIds');
    }

    // Verificar que todos los clientes existen
    const customers = await this.prisma.customer.findMany({
      where: { 
        id: { in: customerIds },
        isActive: true 
      },
      include: {
        collectionRoute: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    if (customers.length !== customerIds.length) {
      const foundIds = customers.map(c => c.id);
      const notFound = customerIds.filter(id => !foundIds.includes(id));
      throw new NotFoundException(`Clientes no encontrados o inactivos: ${notFound.join(', ')}`);
    }

    // Obtener IDs únicos de rutas para validar (excluyendo null)
    const uniqueRouteIds = singleRouteId !== undefined 
      ? [singleRouteId].filter(id => id !== null)
      : [...new Set(routeIds!.filter(id => id !== null))];

    // Verificar que todas las rutas existen y están activas
    if (uniqueRouteIds.length > 0) {
      const routes = await this.prisma.collectionRoute.findMany({
        where: { 
          id: { in: uniqueRouteIds },
          isActive: true 
        }
      });

      if (routes.length !== uniqueRouteIds.length) {
        const foundIds = routes.map(r => r.id);
        const notFound = uniqueRouteIds.filter(id => !foundIds.includes(id));
        throw new NotFoundException(`Rutas no encontradas o inactivas: ${notFound.join(', ')}`);
      }
    }

    return this.prisma.$transaction(async (tx) => {
      const results: {
        customerId: number;
        customerName: string;
        previousRouteId: number | null;
        newRouteId: number | null;
        action: string;
        message: string;
      }[] = [];
      
      for (let i = 0; i < customerIds.length; i++) {
        const customerId = customerIds[i];
        const routeId = singleRouteId !== undefined ? singleRouteId : routeIds![i];
        
        const customer = customers.find(c => c.id === customerId)!;
        
        // Determinar acción
        let action = '';
        let message = '';
        
        if (routeId === null) {
          // Desasignar
          if (customer.collectionRoute === null) {
            action = 'Sin cambios';
            message = `El cliente "${customer.firstName} ${customer.lastName}" ya no tenía ruta asignada`;
          } else {
            action = 'Desasignado';
            message = `Cliente "${customer.firstName} ${customer.lastName}" desasignado de ruta`;
          }
        } else if (customer.collectionRoute?.id === routeId) {
          action = 'Ya asignado';
          message = `El cliente "${customer.firstName} ${customer.lastName}" ya estaba asignado a esta ruta`;
        } else if (customer.collectionRoute && customer.collectionRoute.id !== routeId) {
          action = 'Reasignado';
          message = `Cliente "${customer.firstName} ${customer.lastName}" reasignado de ruta`;
        } else {
          action = 'Nuevo';
          message = `Cliente "${customer.firstName} ${customer.lastName}" asignado a ruta`;
        }

        // Actualizar solo si hay cambio
        if (customer.collectionRoute?.id !== routeId) {
          if (routeId === null) {
            await tx.customer.update({
              where: { id: customerId },
              data: { collectionRoute: { disconnect: true } }
            });
          } else {
            await tx.customer.update({
              where: { id: customerId },
              data: { collectionRoute: { connect: { id: routeId } } }
            });
          }
        }

        results.push({
          customerId,
          customerName: `${customer.firstName} ${customer.lastName}`,
          previousRouteId: customer.collectionRoute?.id || null,
          newRouteId: routeId,
          action,
          message
        });
      }

      const summary = {
        totalProcessed: customerIds.length,
        assigned: results.filter(r => r.action === 'Nuevo').length,
        reassigned: results.filter(r => r.action === 'Reasignado').length,
        unassigned: results.filter(r => r.action === 'Desasignado').length,
        alreadyAssigned: results.filter(r => r.action === 'Ya asignado').length,
        noChanges: results.filter(r => r.action === 'Sin cambios').length
      };

      // Generar mensaje dinámico basado en resultados
      let mainMessage = '';
      let statusCode = 200;

      if (summary.totalProcessed === summary.noChanges + summary.alreadyAssigned) {
        // Todos ya estaban en el estado deseado
        if (summary.alreadyAssigned > 0) {
          mainMessage = `Todos los clientes ya estaban asignados a sus rutas correspondientes`;
          statusCode = 409;
        } else {
          mainMessage = `Todos los clientes ya no tenían ruta asignada`;
          statusCode = 409;
        }
      } else if (summary.assigned + summary.reassigned + summary.unassigned > 0) {
        // Se realizaron cambios
        if (summary.alreadyAssigned > 0 || summary.noChanges > 0) {
          // Algunos cambios, otros ya estaban bien
          const changeActions: string[] = [];
          if (summary.assigned > 0) changeActions.push(`${summary.assigned} asignados`);
          if (summary.reassigned > 0) changeActions.push(`${summary.reassigned} reasignados`);
          if (summary.unassigned > 0) changeActions.push(`${summary.unassigned} desasignados`);
          
          mainMessage = `Se procesaron algunas asignaciones (${changeActions.join(', ')}), otros ya se encontraban en el estado correcto`;
        } else {
          // Todos los cambios fueron exitosos
          const totalChanges = summary.assigned + summary.reassigned + summary.unassigned;
          mainMessage = `${totalChanges} asignaciones de clientes procesadas exitosamente`;
        }
      } else {
        // No se pudo procesar nada
        throw new BadRequestException('No se pudieron procesar las asignaciones de clientes');
      }

      return {
        success: true,
        statusCode,
        message: mainMessage,
        summary,
        results
      };
    });
  }
}