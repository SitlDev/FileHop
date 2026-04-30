package com.soiwasthinking.app.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.soiwasthinking.app.ui.components.CaptureBottomSheet
import com.soiwasthinking.app.ui.components.IdeaCard
import com.soiwasthinking.app.ui.theme.*
import com.soiwasthinking.app.viewmodel.IdeasViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun IdeasListScreen(
    innerPadding: PaddingValues,
    onIdeaClick: (String) -> Unit,
    viewModel: IdeasViewModel,
) {
    val ideas by viewModel.ideas.collectAsState()
    val captureOpen by viewModel.captureOpen.collectAsState()
    val error by viewModel.error.collectAsState()
    var filter by remember { mutableStateOf("all") }

    val filtered = when (filter) {
        "top"     -> ideas.filter { it.rating >= 8 }
        "planned" -> ideas.filter { it.executionPlanJson != null }
        else      -> ideas
    }

    Scaffold(
        modifier = Modifier.padding(innerPadding),
        floatingActionButton = {
            FloatingActionButton(
                onClick = { viewModel.openCapture() },
                containerColor = Accent,
                contentColor = androidx.compose.ui.graphics.Color.White,
            ) {
                Icon(Icons.Default.Add, contentDescription = "Capture idea")
            }
        },
    ) { scaffoldPadding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(scaffoldPadding)
                .padding(horizontal = 16.dp),
            contentPadding = PaddingValues(bottom = 80.dp),
        ) {
            item {
                Spacer(Modifier.height(16.dp))
                Text(
                    "So I Was Thinking 💡",
                    style = MaterialTheme.typography.titleLarge,
                    fontWeight = FontWeight.ExtraBold,
                )
                Text(
                    "${ideas.size} idea${if (ideas.size != 1) "s" else ""} saved",
                    style = MaterialTheme.typography.bodyMedium,
                    color = TextMid,
                )
                Spacer(Modifier.height(12.dp))

                // Filter chips
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    listOf("all" to "All", "top" to "⭐ Top", "planned" to "✓ Planned").forEach { (v, l) ->
                        FilterChip(
                            selected = filter == v,
                            onClick = { filter = v },
                            label = { Text(l, fontSize = 13.sp) },
                            colors = FilterChipDefaults.filterChipColors(
                                selectedContainerColor = AccentBg,
                                selectedLabelColor = Accent,
                            )
                        )
                    }
                }
                Spacer(Modifier.height(8.dp))
            }

            if (filtered.isEmpty()) {
                item {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 80.dp),
                        contentAlignment = Alignment.Center,
                    ) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Text("🌱", fontSize = 52.sp)
                            Spacer(Modifier.height(12.dp))
                            Text(
                                if (filter == "all") "No ideas yet!" else "Nothing here yet.",
                                style = MaterialTheme.typography.titleSmall,
                                color = TextMid,
                            )
                            Text(
                                if (filter == "all") "Tap + to capture your first one." else "Keep capturing ideas!",
                                style = MaterialTheme.typography.bodyMedium,
                                color = TextSoft,
                            )
                        }
                    }
                }
            } else {
                items(filtered, key = { it.id }) { idea ->
                    IdeaCard(
                        idea = idea,
                        onClick = { onIdeaClick(idea.id) },
                        onBury = { viewModel.bury(idea) },
                    )
                    Spacer(Modifier.height(8.dp))
                }
            }
        }
    }

    if (captureOpen) {
        CaptureBottomSheet(
            onDismiss = { viewModel.closeCapture() },
            onSave = { text, context, mood, rating ->
                viewModel.saveIdea(text, context, mood, rating)
            },
        )
    }

    error?.let {
        Snackbar(
            modifier = Modifier.padding(16.dp),
            action = { TextButton(onClick = { viewModel.clearError() }) { Text("OK") } },
        ) { Text(it) }
    }
}
