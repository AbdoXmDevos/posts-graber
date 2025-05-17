import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Simulate a delay to test loading state
  await new Promise(resolve => setTimeout(resolve, 500));

  // Mock response data
  const mockResponse = {
    data: {
      monthlyUsageCycle: {
        startAt: "2025-05-10T00:00:00.000Z",
        endAt: "2025-06-09T23:59:59.999Z"
      },
      limits: {
        maxMonthlyUsageUsd: 5,
        maxMonthlyActorComputeUnits: 625,
        maxMonthlyExternalDataTransferGbytes: 1000,
        maxMonthlyProxySerps: 50000,
        maxMonthlyResidentialProxyGbytes: 20,
        maxActorMemoryGbytes: 8,
        maxActorCount: 500,
        maxActorTaskCount: 5000,
        maxScheduleCount: 100,
        maxConcurrentActorJobs: 25,
        maxTeamAccountSeatCount: 9,
        dataRetentionDays: 7
      },
      current: {
        monthlyUsageUsd: 0.34594592086290554,
        monthlyActorComputeUnits: 0,
        monthlyExternalDataTransferGbytes: 0.0007149744778871536,
        monthlyProxySerps: 0,
        monthlyResidentialProxyGbytes: 0,
        actorMemoryGbytes: 0,
        actorCount: 0,
        actorTaskCount: 0,
        scheduleCount: 0,
        activeActorJobCount: 0,
        teamAccountSeatCount: 1
      }
    }
  };

  return NextResponse.json(mockResponse);
}
