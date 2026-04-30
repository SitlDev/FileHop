package com.soiwasthinking.app.data.api

import com.soiwasthinking.app.data.model.*

// ─── Request bodies ───────────────────────────────────────────────────────────

data class SeedRequest(val rawText: String, val context: String, val mood: String)

data class IdeaSummary(
    val title: String,
    val summary: String,
    val problem: String,
    val solution: String,
    val uniqueAngle: String,
)

data class ExecutionPlanRequest(val idea: IdeaSummary, val hoursPerWeek: Int = 10)

data class RevenuePlanRequest(val idea: IdeaSummary)

data class CompScanRequest(val idea: IdeaSummary)

data class IdeaListItem(
    val context: String,
    val mood: String,
    val createdAt: Long,
    val rating: Int,
    val tags: List<String>?,
    val title: String,
)

data class PatternsRequest(val ideas: List<IdeaListItem>)

data class RevivalIdeaSummary(
    val rawText: String,
    val title: String,
    val rating: Int,
    val aiData: AiData?,
)

data class RevivalRequest(val idea: RevivalIdeaSummary, val daysSince: Long)
