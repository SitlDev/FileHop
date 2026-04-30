package com.soiwasthinking.app.data.api

import com.soiwasthinking.app.data.model.*
import retrofit2.http.Body
import retrofit2.http.POST

interface ApiService {

    @POST("api/seed")
    suspend fun seed(@Body body: SeedRequest): AiData

    @POST("api/execution-plan")
    suspend fun executionPlan(@Body body: ExecutionPlanRequest): ExecutionPlan

    @POST("api/revenue-plan")
    suspend fun revenuePlan(@Body body: RevenuePlanRequest): RevenuePlan

    @POST("api/comp-scan")
    suspend fun compScan(@Body body: CompScanRequest): CompScan

    @POST("api/patterns")
    suspend fun patterns(@Body body: PatternsRequest): Patterns

    @POST("api/revival")
    suspend fun revival(@Body body: RevivalRequest): Revival
}
