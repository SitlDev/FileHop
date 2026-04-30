package com.soiwasthinking.app.data.model

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "ideas")
data class Idea(
    @PrimaryKey val id: String,
    val rawText: String,
    val title: String,
    val context: String,       // scrolling | talking | working | sleepy | driving | moving | reading | shower | eating | random
    val mood: String,          // pumped | thinking | calm | buzzing | fuzzy
    val rating: Int,           // 1-10
    val createdAt: Long,

    // AI-enriched blobs stored as JSON strings (null = not yet fetched)
    val aiDataJson: String? = null,
    val executionPlanJson: String? = null,
    val revenuePlanJson: String? = null,
    val compScanJson: String? = null,
    val revivalJson: String? = null,

    // Task completion map stored as JSON: {"taskId": true/false}
    val checkedTasksJson: String = "{}",

    val buried: Boolean = false,
    val buriedAt: Long? = null,
)
