package com.soiwasthinking.app.data.model

/** All AI-enrichment data classes (stored as JSON in Room). */

data class AiData(
    val title: String = "",
    val summary: String = "",
    val problem: String = "",
    val solution: String = "",
    val uniqueAngle: String = "",
    val tags: List<String> = emptyList(),
    val excitement: Int = 5,
)

data class Task(
    val id: String = "",
    val label: String = "",
    val owner: String = "you",   // you | hire | outsource | tool
    val skill: String = "",
    val effort: String = "medium", // low | medium | high
    val blocker: String = "",
)

data class Phase(
    val id: String = "",
    val name: String = "",
    val emoji: String = "",
    val duration: String = "",
    val costRange: String = "",
    val goal: String = "",
    val tasks: List<Task> = emptyList(),
)

data class ExecutionPlan(
    val nextAction: String = "",
    val totalTimeMonths: Int = 0,
    val totalCostLow: Int = 0,
    val totalCostHigh: Int = 0,
    val criticalRisk: String = "",
    val phases: List<Phase> = emptyList(),
)

data class MoneyRange(val low: Long = 0, val mid: Long = 0, val high: Long = 0)

data class MonetizationStrategy(
    val name: String = "",
    val description: String = "",
    val avgRevPerUser: String = "",
)

data class RevenuePlan(
    val model: String = "",
    val year1: MoneyRange = MoneyRange(),
    val year3: MoneyRange = MoneyRange(),
    val assumptions: List<String> = emptyList(),
    val monetizationStrategies: List<MonetizationStrategy> = emptyList(),
    val timeToFirstRevenue: String = "",
)

data class Competitor(
    val name: String = "",
    val url: String = "",
    val description: String = "",
    val fundingStage: String = "",
    val weakness: String = "",
    val similarityScore: Int = 0,
)

data class CompScan(
    val differentiationScore: Int = 0,
    val verdict: String = "",
    val crowdedness: String = "",
    val competitors: List<Competitor> = emptyList(),
    val whitespace: String = "",
    val yourEdge: String = "",
    val threat: String = "",
    val recommendation: String = "",
)

data class Revival(
    val hook: String = "",
    val newAngle: String = "",
    val quickWin: String = "",
    val verdict: String = "",
)

data class Patterns(
    val bestTimeOfDay: String = "",
    val bestContext: String = "",
    val recurringThemes: List<String> = emptyList(),
    val subconsciousPatterns: List<String> = emptyList(),
    val cognitiveStyle: String = "",
    val recommendation: String = "",
)
