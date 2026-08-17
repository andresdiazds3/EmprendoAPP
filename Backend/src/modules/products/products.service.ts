import { productsRepository } from "./products.repository";
import { CreateProductDto } from "./dtos/create-product.dto";
import { UpdateProductDto } from "./dtos/update-product.dto";
import { ListProductsDto } from "./dtos/list-products.dto";
import { NotFoundError } from "../../core/errors";
import { buildPaginatedResult } from "../../shared/utils/pagination";

export class ProductsService {
  // Crea un producto
  async create(userId: string, dto: CreateProductDto) {
    return productsRepository.create(userId, dto);
  }

  // Lista y pagina los productos del usuario
  async list(userId: string, query: ListProductsDto) {
    const { items, total, page, pageSize } = await productsRepository.findMany(userId, query);
    return buildPaginatedResult(items, total, page, pageSize);
  }

  // Obtiene un producto por su ID, validando pertenencia
  async getById(userId: string, productId: string) {
    const product = await productsRepository.findById(userId, productId);
    if (!product) {
      throw new NotFoundError("Producto");
    }
    return product;
  }

  // Actualiza un producto validando pertenencia
  async update(userId: string, productId: string, dto: UpdateProductDto) {
    await this.getById(userId, productId);
    return productsRepository.update(productId, dto);
  }

  // Realiza el borrado lógico del producto validando pertenencia
  async delete(userId: string, productId: string) {
    await this.getById(userId, productId);
    return productsRepository.softDelete(productId);
  }
}

export const productsService = new ProductsService();
