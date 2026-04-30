package com.soiwasthinking.app.ui.components

import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.MoreVert
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.soiwasthinking.app.data.model.Idea
import com.soiwasthinking.app.ui.theme.*
import com.google.gson.Gson
import com.soiwasthinking.app.data.model.AiData
import androidx.compose.ui.graphics.Color

private val gsonRef = Gson()

private fun formatAgo(ts: Long): String {
    val s = System.currentTimeMillis() - ts
    return when {
        s < 60_000    -> "just now"
        s < 3_600_000 -> "${s / 60_000}m ago"
        s < 86_400_000 -> "${s / 3_600_000}h ago"
        else -> "${s / 86_400_000}d ago"
    }
}

private val CONTEXT_EMOJI = mapOf(
    "scrolling" to "📱", "talking" to "💬", "working" to "💼", "sleepy" to "😴",
    "driving" to "🚗", "moving" to "🏃", "reading" to "📖", "shower" to "🚿",
    "eating" to "🍽️", "random" to "✨",
)

@Composable
fun IdeaCard(idea: Idea, onClick: () -> Unit, onBury: () -> Unit) {
    val aiData = remember(idea.aiDataJson) {
        idea.aiDataJson?.let { gsonRef.fromJson(it, AiData::class.java) }
    }
    val checkedTasks = remember(idea.checkedTasksJson) {
        gsonRef.fromJson<Map<String, Boolean>>(
            idea.checkedTasksJson,
            object : com.google.gson.reflect.TypeToken<Map<String, Boolean>>() {}.type
        ) ?: emptyMap()
    }
    var menuExpanded by remember { mutableStateOf(false) }

    val allTasks = idea.executionPlanJson
        ?.let { gsonRef.fromJson(it, com.soiwasthinking.app.data.model.ExecutionPlan::class.java) }
        ?.phases?.flatMap { it.tasks } ?: emptyList()
    val donePct = if (allTasks.isNotEmpty()) checkedTasks.values.count { it } * 100 / allTasks.size else 0

    Card(
        onClick = onClick,
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = SurfaceColor),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
        shape = MaterialTheme.shapes.large,
    ) {
        Column(Modifier.padding(16.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(
                    "${CONTEXT_EMOJI[idea.context] ?: "✨"} ${formatAgo(idea.createdAt)}",
                    style = MaterialTheme.typography.bodySmall,
                    color = TextSoft,
                    modifier = Modifier.weight(1f),
                )
                // Rating dots
                Row(horizontalArrangement = Arrangement.spacedBy(2.dp)) {
                    (1..10).forEach { d ->
                        Surface(
                            modifier = Modifier.size(5.dp),
                            shape = MaterialTheme.shapes.extraSmall,
                            color = if (d <= idea.rating) Accent else BorderColor,
                        ) {}
                    }
                }
                Spacer(Modifier.width(8.dp))
                Box {
                    IconButton(onClick = { menuExpanded = true }, modifier = Modifier.size(20.dp)) {
                        Icon(Icons.Default.MoreVert, "Options", tint = TextSoft, modifier = Modifier.size(16.dp))
                    }
                    DropdownMenu(expanded = menuExpanded, onDismissRequest = { menuExpanded = false }) {
                        DropdownMenuItem(text = { Text("Bury idea 💀") }, onClick = { menuExpanded = false; onBury() })
                    }
                }
            }

            Spacer(Modifier.height(8.dp))
            Text(
                aiData?.title ?: idea.title,
                style = MaterialTheme.typography.titleSmall,
                fontWeight = FontWeight.Bold,
                color = TextColor,
            )

            aiData?.summary?.let { summary ->
                Spacer(Modifier.height(4.dp))
                Text(
                    if (summary.length > 90) summary.take(90) + "…" else summary,
                    style = MaterialTheme.typography.bodySmall,
                    color = TextMid,
                )
            }

            if (aiData == null) {
                Spacer(Modifier.height(6.dp))
                Row(verticalAlignment = Alignment.CenterVertically) {
                    CircularProgressIndicator(modifier = Modifier.size(10.dp), color = TextSoft, strokeWidth = 1.5.dp)
                    Spacer(Modifier.width(5.dp))
                    Text("AI thinking…", style = MaterialTheme.typography.bodySmall, color = TextSoft)
                }
            }

            Spacer(Modifier.height(8.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(5.dp), verticalAlignment = Alignment.CenterVertically) {
                aiData?.tags?.take(3)?.forEach { tag ->
                    Surface(color = BlueBg, shape = MaterialTheme.shapes.extraSmall) {
                        Text("#$tag", Modifier.padding(horizontal = 6.dp, vertical = 2.dp), color = AppBlue, fontSize = 11.sp, fontWeight = FontWeight.SemiBold)
                    }
                }
                if (allTasks.isNotEmpty()) {
                    Surface(color = if (donePct == 100) GreenBg else BlueBg, shape = MaterialTheme.shapes.extraSmall) {
                        Text(
                            if (donePct == 100) "✓ Done" else "$donePct% done",
                            Modifier.padding(horizontal = 6.dp, vertical = 2.dp),
                            color = if (donePct == 100) AppGreen else AppBlue,
                            fontSize = 11.sp, fontWeight = FontWeight.SemiBold,
                        )
                    }
                }
                if (idea.revenuePlanJson != null) {
                    Surface(color = WarnBg, shape = MaterialTheme.shapes.extraSmall) {
                        Text("$ Modeled", Modifier.padding(horizontal = 6.dp, vertical = 2.dp), color = AppWarn, fontSize = 11.sp, fontWeight = FontWeight.SemiBold)
                    }
                }
            }
        }
    }
}
