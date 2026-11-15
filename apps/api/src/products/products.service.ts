import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { InventoryService } from '../inventory/inventory.service.js';

@Injectable()
export class ProductsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly inventory: InventoryService,
  ) {}

  private async withAvailability<T extends { sizes: { id: string }[] }>(
    product: T,
  ) {
    const sizeIds = product.sizes.map((size) => size.id);
    if (!sizeIds.length) return { ...product, sizes: [], stockQuantity: 0 };

    // Batch both lookups. Previously every size caused one inventory recipe
    // query, one stock query per ingredient and one policy query.
    const [availability, policies] = await Promise.all([
      this.inventory.availabilityMany(
        sizeIds.map((productSizeId) => ({ productSizeId, quantity: 1 })),
      ),
      this.prisma.customizationPolicy.findMany({
        where: { productSizeId: { in: sizeIds } },
      }),
    ]);
    const policiesBySize = new Map<string, typeof policies>();
    for (const policy of policies) {
      const existing = policiesBySize.get(policy.productSizeId) ?? [];
      existing.push(policy);
      policiesBySize.set(policy.productSizeId, existing);
    }
    const sizes = product.sizes.map((size) => ({
      ...size,
      stockQuantity: availability.get(size.id) ?? 0,
      customizationPolicies: policiesBySize.get(size.id) ?? [],
    }));
    return {
      ...product,
      sizes,
      stockQuantity: Math.max(0, ...sizes.map((s) => s.stockQuantity)),
    };
  }

  // Lấy danh sách sản phẩm đang kinh doanh
  async findAll() {
    const products = await this.prisma.product.findMany({
      where: {
        isActive: true,
        category: { isActive: true },
      },
      select: {
        id: true,
        name: true,
        description: true,
        basePrice: true,
        imageUrl: true,
        stockQuantity: true,
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        sizes: {
          where: { isActive: true },
          select: {
            id: true,
            size: true,
            priceAdjustment: true,
          },
          orderBy: { size: 'asc' },
        },
      },
      orderBy: { name: 'asc' },
    });
    return Promise.all(
      products.map((product) => this.withAvailability(product)),
    );
  }

  // Lấy chi tiết sản phẩm theo ID
  async findOne(id: string) {
    const product = await this.prisma.product.findFirst({
      where: {
        id,
        isActive: true,
        category: { isActive: true },
      },
      include: {
        category: true,
        sizes: {
          where: { isActive: true },
          orderBy: { size: 'asc' },
        },
      },
    });

    if (!product) {
      throw new NotFoundException('Không tìm thấy sản phẩm');
    }

    return this.withAvailability(product);
  }
}
