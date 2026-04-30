package com.soiwasthinking.app.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.DeleteForever
import androidx.compose.material.icons.filled.Restore
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.soiwasthinking.app.ui.theme.*
import com.soiwasthinking.app.viewmodel.AiState
import com.soiwasthinking.app.viewmodel.GraveyardViewModel

@Composable
fun GraveyardScreen(
    innerPadding: PaddingValues,
    onIdeaClick: (String) -> Unit,
    viewModel: GraveyardViewModel,
) {
    val ideas by viewModel.buriedIdeas.collectAsState()
    val revivalStates by viewModel.revivalState.collectAsState()
    val resurfaceQueue by viewModel.resurfaceQueue.collectAsState()

    // Auto-fetch revivals for ready ideas
    LaunchedEffect(resurfaceQueue) {
        resurfaceQueue.forEach { viewModel.fetchRevival(it) }
    }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(innerPadding)
            .padding(horizontal = 16.dp),
        contentPadding = PaddingValues(bottom = 80.dp),
    ) {
        item {
            Spacer(Modifier.height(16.dp))
            Text("💀 Graveyard", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.ExtraBold)
            Text("${ideas.size} buried idea${if (ideas.size != 1) "s" else ""}", style = MaterialTheme.typography.bodyMedium, color = TextMid)
            Spacer(Modifier.height(12.dp))
        }

        if (ideas.isEmpty()) {
            item {
                Box(Modifier.fillMaxWidth().padding(vertical = 80.dp), contentAlignment = Alignment.Center) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text("🌿", fontSize = 52.sp)
                        Spacer(Modifier.height(12.dp))
                        Text("No buried ideas yet.", style = MaterialTheme.typography.titleSmall, color = TextMid)
                        Text("Bury ideas you're not sure about.", style = MaterialTheme.typography.bodySmall, color = TextSoft)
                    }
                }
            }
        } else {
            items(ideas, key = { it.id }) { idea ->
                val daysSince = viewModel.daysSinceBuried(idea)
                val revivalState = revivalStates[idea.id]
                val revival = viewModel.parseRevival(idea)

                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = SurfaceColor),
                    onClick = { onIdeaClick(idea.id) },
                ) {
                    Column(Modifier.padding(14.dp)) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Column(Modifier.weight(1f)) {
                                Text(idea.title, style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.Bold)
                                Text("Buried ${daysSince}d ago · rating ${idea.rating}/10", style = MaterialTheme.typography.bodySmall, color = TextSoft)
                            }
                        }

                        // Revival badge
                        if (daysSince >= 7) {
                            Spacer(Modifier.height(8.dp))
                            when {
                                revivalState is AiState.Loading -> Row(verticalAlignment = Alignment.CenterVertically) {
                                    CircularProgressIndicator(Modifier.size(12.dp), color = Accent, strokeWidth = 2.dp)
                                    Spacer(Modifier.width(6.dp))
                                    Text("Analyzing…", style = MaterialTheme.typography.bodySmall, color = TextMid)
                                }
                                revival != null -> {
                                    val badge = when (revival.verdict) {
                                        "actually pretty good" -> "🔥 Actually pretty good"
                                        "worth a second look"  -> "👀 Worth a second look"
                                        else                   -> "💀 Still buried"
                                    }
                                    Surface(color = AccentBg, shape = MaterialTheme.shapes.small) {
                                        Text(badge, Modifier.padding(horizontal = 8.dp, vertical = 4.dp), style = MaterialTheme.typography.bodySmall, color = Accent, fontWeight = FontWeight.SemiBold)
                                    }
                                    Spacer(Modifier.height(4.dp))
                                    Text(revival.hook, style = MaterialTheme.typography.bodySmall, color = TextMid)
                                }
                            }
                        }

                        Spacer(Modifier.height(10.dp))
                        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            OutlinedButton(
                                onClick = { viewModel.unbury(idea) },
                                modifier = Modifier.weight(1f),
                                colors = ButtonDefaults.outlinedButtonColors(contentColor = AppGreen),
                            ) {
                                Icon(Icons.Default.Restore, null, Modifier.size(16.dp))
                                Spacer(Modifier.width(4.dp))
                                Text("Restore", fontSize = 12.sp)
                            }
                            OutlinedButton(
                                onClick = { viewModel.delete(idea) },
                                modifier = Modifier.weight(1f),
                                colors = ButtonDefaults.outlinedButtonColors(contentColor = AppWarn),
                            ) {
                                Icon(Icons.Default.DeleteForever, null, Modifier.size(16.dp))
                                Spacer(Modifier.width(4.dp))
                                Text("Delete", fontSize = 12.sp)
                            }
                        }
                    }
                }
                Spacer(Modifier.height(8.dp))
            }
        }
    }
}
