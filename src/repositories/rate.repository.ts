import type { PrismaClient } from "@prisma/client";

export interface RateRecord {
  repo: number;
  prime: number;
  updatedAt: Date;
}

export class RateRepository {
  constructor(private prisma: PrismaClient) {}

  async save(data: { repo: number; prime: number }): Promise<RateRecord> {
    const now = new Date();

    await this.prisma.$transaction([
      this.prisma.saRate.create({
        data: { rateType: "repo", rate: data.repo, updatedAt: now },
      }),
      this.prisma.saRate.create({
        data: { rateType: "prime", rate: data.prime, updatedAt: now },
      }),
    ]);

    return { repo: data.repo, prime: data.prime, updatedAt: now };
  }

  async findLatest(): Promise<RateRecord | null> {
    const [repoRow, primeRow] = await Promise.all([
      this.prisma.saRate.findFirst({
        where: { rateType: "repo" },
        orderBy: { updatedAt: "desc" },
      }),
      this.prisma.saRate.findFirst({
        where: { rateType: "prime" },
        orderBy: { updatedAt: "desc" },
      }),
    ]);

    if (!repoRow || !primeRow) return null;

    const repoUpdated = repoRow.updatedAt ?? new Date();
    const primeUpdated = primeRow.updatedAt ?? new Date();

    return {
      repo: Number(repoRow.rate),
      prime: Number(primeRow.rate),
      updatedAt: repoUpdated > primeUpdated ? repoUpdated : primeUpdated,
    };
  }
}
