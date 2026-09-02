import { productsRepository } from "./products.repository";
import { CreateProductDto } from "./dtos/create-product.dto";
import { UpdateProductDto } from "./dtos/update-product.dto";
import { ListProductsDto } from "./dtos/list-products.dto";
import { NotFoundError } from "../../core/errors";
import { buildPaginatedResult } from "../../shared/utils/pagination";

function formatProduct<T extends { price: any; cost: any }>(product: T) {
  const priceNum = Number(product.price);
  const costNum = Number(product.cost);
  return {
    ...product,
    ventaBajoCosto: priceNum < costNum,
  };
}

export class ProductsService {
  // Crea un producto
  async create(userId: string, dto: CreateProductDto) {
    const product = await productsRepository.create(userId, dto);
    return formatProduct(product);
  }

  // Lista y pagina los productos del usuario
  async list(userId: string, query: ListProductsDto) {
    const { items, total, page, pageSize } = await productsRepository.findMany(userId, query);
    const formattedItems = items.map(formatProduct);
    return buildPaginatedResult(formattedItems, total, page, pageSize);
  }

  // Obtiene un producto por su ID, validando pertenencia (opcionalmente incluye eliminados)
  async getById(userId: string, productId: string, includeDeleted = false) {
    const product = includeDeleted
      ? await productsRepository.findByIdIncludingDeleted(userId, productId)
      : await productsRepository.findById(userId, productId);
    if (!product) {
      throw new NotFoundError("Producto");
    }
    return formatProduct(product);
  }

  // Actualiza un producto validando pertenencia
  async update(userId: string, productId: string, dto: UpdateProductDto) {
    await this.getById(userId, productId);
    const updated = await productsRepository.update(productId, dto);
    return formatProduct(updated);
  }

  // Realiza el borrado lógico del producto validando pertenencia
  async delete(userId: string, productId: string) {
    await this.getById(userId, productId);
    return productsRepository.softDelete(productId);
  }

  // Restaura un producto borrado lógicamente de la papelera
  async restore(userId: string, productId: string) {
    await this.getById(userId, productId, true);
    const restored = await productsRepository.restore(productId);
    return formatProduct(restored);
  }
}

export const productsService = new ProductsService();
