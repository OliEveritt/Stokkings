import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { RateRepository } from "@/repositories/rate.repository";
import { RateService } from "@/services/rate.service";
import * as sarbClient from "@/lib/sarb-client";

export async function GET() {
  try {
    const repository = new RateRepository(prisma);
    const service = new RateService(repository, sarbClient);
    const rates = await service.getLatestRates();
    return NextResponse.json(rates);
  } catch {
    return NextResponse.json(
      { error: "Failed to retrieve rates" },
      { status: 500 }
    );
  }
}
