package com.soiwasthinking.app.data.db

import androidx.room.*
import com.soiwasthinking.app.data.model.Idea
import kotlinx.coroutines.flow.Flow

@Dao
interface IdeaDao {

    @Query("SELECT * FROM ideas WHERE buried = 0 ORDER BY createdAt DESC")
    fun observeActive(): Flow<List<Idea>>

    @Query("SELECT * FROM ideas WHERE buried = 1 ORDER BY buriedAt DESC")
    fun observeBuried(): Flow<List<Idea>>

    @Query("SELECT * FROM ideas ORDER BY createdAt DESC")
    fun observeAll(): Flow<List<Idea>>

    @Query("SELECT * FROM ideas WHERE id = :id")
    fun observeById(id: String): Flow<Idea?>

    @Query("SELECT * FROM ideas WHERE id = :id")
    suspend fun getById(id: String): Idea?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsert(idea: Idea)

    @Delete
    suspend fun delete(idea: Idea)

    @Query("DELETE FROM ideas WHERE id = :id")
    suspend fun deleteById(id: String)

    @Query("""
        UPDATE ideas SET
            aiDataJson = :aiDataJson,
            title = :title
        WHERE id = :id
    """)
    suspend fun updateAiData(id: String, aiDataJson: String, title: String)

    @Query("UPDATE ideas SET executionPlanJson = :json WHERE id = :id")
    suspend fun updateExecutionPlan(id: String, json: String)

    @Query("UPDATE ideas SET revenuePlanJson = :json WHERE id = :id")
    suspend fun updateRevenuePlan(id: String, json: String)

    @Query("UPDATE ideas SET compScanJson = :json WHERE id = :id")
    suspend fun updateCompScan(id: String, json: String)

    @Query("UPDATE ideas SET revivalJson = :json WHERE id = :id")
    suspend fun updateRevival(id: String, json: String)

    @Query("UPDATE ideas SET checkedTasksJson = :json WHERE id = :id")
    suspend fun updateCheckedTasks(id: String, json: String)

    @Query("UPDATE ideas SET buried = 1, buriedAt = :at WHERE id = :id")
    suspend fun bury(id: String, at: Long)

    @Query("UPDATE ideas SET buried = 0, buriedAt = NULL WHERE id = :id")
    suspend fun unbury(id: String)
}
