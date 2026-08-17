import { Response } from "express";
import { productsService } from "./products.service";
import { createProductSchema } from "./dtos/create-product.dto";
import { updateProductSchema } from "./dtos/update-product.dto";
import { listProductsSchema } from "./dtos/list-products.dto";
import { created, ok, noContent } from "../../shared/utils/http-response";
import { AuthenticatedRequest } from "../../core/types";

export class ProductsController {
  // Crea un producto
  async create(req: AuthenticatedRequest, res: Response) {
    const validatedData = createProductSchema.parse(req.body);
    const userId = req.user!.id;
    const result = await productsService.create(userId, validatedData);
    return created(res, result, "Producto creado exitosamente");
  }

  // Obtiene los productos paginados y filtrados
  async list(req: AuthenticatedRequest, res: Response) {
    const validatedQuery = listProductsSchema.parse(req.query);
    const userId = req.user!.id;
    const result = await productsService.list(userId, validatedQuery);
    return ok(res, result, "Productos obtenidos exitosamente");
  }

  // Obtiene un producto por ID
  async getById(req: AuthenticatedRequest, res: Response) {
    const productId = req.params.id;
    const userId = req.user!.id;
    const result = await productsService.getById(userId, productId);
    return ok(res, result, "Producto obtenido exitosamente");
  }

  // Actualiza un producto por ID
  async update(req: AuthenticatedRequest, res: Response) {
    const validatedData = updateProductSchema.parse(req.body);
    const productId = req.params.id;
    const userId = req.user!.id;
    const result = await productsService.update(userId, productId, validatedData);
    return ok(res, result, "Producto actualizado exitosamente");
  }

  // Borrado lógico de un producto por ID
  async delete(req: AuthenticatedRequest, res: Response) {
    const productId = req.params.id;
    const userId = req.user!.id;
    await productsService.delete(userId, productId);
    return noContent(res);
  }
}

export const productsController = new ProductsController();
