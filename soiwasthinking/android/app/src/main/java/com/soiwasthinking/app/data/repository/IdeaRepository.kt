package com.soiwasthinking.app.data.repository

import com.google.gson.Gson
import com.soiwasthinking.app.data.api.*
import com.soiwasthinking.app.data.db.IdeaDao
import com.soiwasthinking.app.data.model.*
import kotlinx.coroutines.flow.Flow
import java.util.UUID
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class IdeaRepository @Inject constructor(
    private val dao: IdeaDao,
    private val api: ApiService,
    private val gson: Gson,
) {
    val activeIdeas: Flow<List<Idea>> = dao.observeActive()
    val buriedIdeas: Flow<List<Idea>> = dao.observeBuried()

    fun observeIdea(id: String): Flow<Idea?> = dao.observeById(id)

    suspend fun save(
        rawText: String, context: String, mood: String, rating: Int,
    ): Idea {
        val idea = Idea(
            id = UUID.randomUUID().toString(),
            rawText = rawText,
            title = rawText.take(55),
            context = context,
            mood = mood,
            rating = rating,
            createdAt = System.currentTimeMillis(),
        )
        dao.upsert(idea)
        return idea
    }

    suspend fun delete(id: String) = dao.deleteById(id)
    suspend fun bury(id: String) = dao.bury(id, System.currentTimeMillis())
    suspend fun unbury(id: String) = dao.unbury(id)

    suspend fun toggleTask(idea: Idea, taskId: String) {
        val map = gson.fromJson<Map<String, Boolean>>(
            idea.checkedTasksJson,
            object : com.google.gson.reflect.TypeToken<Map<String, Boolean>>() {}.type
        ).toMutableMap()
        map[taskId] = !(map[taskId] ?: false)
        dao.updateCheckedTasks(idea.id, gson.toJson(map))
    }

    // ─── AI enrichment calls ─────────────────────────────────────────────────

    suspend fun seedIdea(idea: Idea): AiData {
        val aiData = api.seed(SeedRequest(idea.rawText, idea.context, idea.mood))
        dao.updateAiData(idea.id, gson.toJson(aiData), aiData.title.ifBlank { idea.title })
        return aiData
    }

    suspend fun fetchExecutionPlan(idea: Idea, hoursPerWeek: Int = 10): ExecutionPlan {
        val ai = idea.aiDataJson?.let { gson.fromJson(it, AiData::class.java) } ?: AiData()
        val plan = api.executionPlan(
            ExecutionPlanRequest(
                idea = IdeaSummary(idea.title, ai.summary, ai.problem, ai.solution, ai.uniqueAngle),
                hoursPerWeek = hoursPerWeek,
            )
        )
        dao.updateExecutionPlan(idea.id, gson.toJson(plan))
        return plan
    }

    suspend fun fetchRevenuePlan(idea: Idea): RevenuePlan {
        val ai = idea.aiDataJson?.let { gson.fromJson(it, AiData::class.java) } ?: AiData()
        val plan = api.revenuePlan(
            RevenuePlanRequest(IdeaSummary(idea.title, ai.summary, ai.problem, ai.solution, ai.uniqueAngle))
        )
        dao.updateRevenuePlan(idea.id, gson.toJson(plan))
        return plan
    }

    suspend fun fetchCompScan(idea: Idea): CompScan {
        val ai = idea.aiDataJson?.let { gson.fromJson(it, AiData::class.java) } ?: AiData()
        val scan = api.compScan(
            CompScanRequest(IdeaSummary(idea.title, ai.summary, ai.problem, ai.solution, ai.uniqueAngle))
        )
        dao.updateCompScan(idea.id, gson.toJson(scan))
        return scan
    }

    suspend fun fetchRevival(idea: Idea): Revival {
        val ai = idea.aiDataJson?.let { gson.fromJson(it, AiData::class.java) }
        val daysSince = if (idea.buriedAt != null)
            (System.currentTimeMillis() - idea.buriedAt) / 86_400_000L else 0L
        val revival = api.revival(
            RevivalRequest(
                idea = RevivalIdeaSummary(idea.rawText, idea.title, idea.rating, ai),
                daysSince = daysSince,
            )
        )
        dao.updateRevival(idea.id, gson.toJson(revival))
        return revival
    }

    suspend fun fetchPatterns(ideas: List<Idea>): Patterns {
        val items = ideas.map { i ->
            val ai = i.aiDataJson?.let { gson.fromJson(it, AiData::class.java) }
            IdeaListItem(i.context, i.mood, i.createdAt, i.rating, ai?.tags, i.title)
        }
        return api.patterns(PatternsRequest(items))
    }

    // ─── Convenience parsers ─────────────────────────────────────────────────

    fun parseAiData(idea: Idea): AiData? =
        idea.aiDataJson?.let { gson.fromJson(it, AiData::class.java) }

    fun parseExecutionPlan(idea: Idea): ExecutionPlan? =
        idea.executionPlanJson?.let { gson.fromJson(it, ExecutionPlan::class.java) }

    fun parseRevenuePlan(idea: Idea): RevenuePlan? =
        idea.revenuePlanJson?.let { gson.fromJson(it, RevenuePlan::class.java) }

    fun parseCompScan(idea: Idea): CompScan? =
        idea.compScanJson?.let { gson.fromJson(it, CompScan::class.java) }

    fun parseRevival(idea: Idea): Revival? =
        idea.revivalJson?.let { gson.fromJson(it, Revival::class.java) }

    fun parseCheckedTasks(idea: Idea): Map<String, Boolean> =
        gson.fromJson(
            idea.checkedTasksJson,
            object : com.google.gson.reflect.TypeToken<Map<String, Boolean>>() {}.type
        ) ?: emptyMap()
}
