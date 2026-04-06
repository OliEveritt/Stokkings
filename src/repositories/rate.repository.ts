import type { PrismaClient, Rate } from "@prisma/client";

export class RateRepository {
  constructor(private prisma: PrismaClient) {}

  async save(data: { repo: number; prime: number }): Promise<Rate> {
    return this.prisma.rate.create({ data });
  }

  async findLatest(): Promise<Rate | null> {
    return this.prisma.rate.findFirst({
      orderBy: { createdAt: "desc" },
    });
  }
}
