package com.soiwasthinking.app.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.soiwasthinking.app.data.model.*
import com.soiwasthinking.app.ui.theme.*
import com.soiwasthinking.app.viewmodel.AiState
import com.soiwasthinking.app.viewmodel.DetailViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun IdeaDetailScreen(onBack: () -> Unit, viewModel: DetailViewModel) {
    val idea by viewModel.idea.collectAsState()
    val executionState by viewModel.executionState.collectAsState()
    val revenueState by viewModel.revenueState.collectAsState()
    val compState by viewModel.compState.collectAsState()

    var selectedTab by remember { mutableIntStateOf(0) }
    val tabs = listOf("Brief", "Plan", "Revenue", "Competitors")

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        idea?.let { viewModel.parseAiData()?.title ?: it.title } ?: "Loading…",
                        maxLines = 1,
                        style = MaterialTheme.typography.titleSmall,
                    )
                },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = SurfaceColor),
            )
        }
    ) { padding ->
        idea?.let { currentIdea ->
            val aiData = viewModel.parseAiData()
            Column(modifier = Modifier.padding(padding)) {
                TabRow(selectedTabIndex = selectedTab, containerColor = SurfaceColor) {
                    tabs.forEachIndexed { i, title ->
                        Tab(
                            selected = selectedTab == i,
                            onClick = {
                                selectedTab = i
                                when (i) {
                                    1 -> viewModel.fetchExecutionPlan()
                                    2 -> viewModel.fetchRevenuePlan()
                                    3 -> viewModel.fetchCompScan()
                                }
                            },
                            text = { Text(title, fontSize = 13.sp) },
                            selectedContentColor = Accent,
                            unselectedContentColor = TextMid,
                        )
                    }
                }

                when (selectedTab) {
                    0 -> BriefTab(currentIdea, aiData)
                    1 -> PlanTab(executionState, viewModel)
                    2 -> RevenueTab(revenueState)
                    3 -> CompTab(compState)
                }
            }
        } ?: Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
            CircularProgressIndicator(color = Accent)
        }
    }
}

@Composable
private fun BriefTab(idea: Idea, aiData: AiData?) {
    LazyColumn(modifier = Modifier.fillMaxSize(), contentPadding = PaddingValues(16.dp)) {
        item {
            if (aiData == null) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    CircularProgressIndicator(modifier = Modifier.size(16.dp), color = Accent, strokeWidth = 2.dp)
                    Spacer(Modifier.width(8.dp))
                    Text("AI is building your brief…", color = TextMid, style = MaterialTheme.typography.bodyMedium)
                }
                Spacer(Modifier.height(12.dp))
            }

            Card(modifier = Modifier.fillMaxWidth(), colors = CardDefaults.cardColors(containerColor = SurfaceColor)) {
                Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    SectionRow("🧩", "Problem", aiData?.problem ?: idea.rawText)
                    Divider(color = BorderColor)
                    SectionRow("💡", "Solution", aiData?.solution ?: "—")
                    Divider(color = BorderColor)
                    SectionRow("⚡", "Unique Angle", aiData?.uniqueAngle ?: "—")
                    if (aiData != null) {
                        Divider(color = BorderColor)
                        Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                            aiData.tags.forEach { tag ->
                                SuggestionChip(onClick = {}, label = { Text("#$tag", fontSize = 12.sp) })
                            }
                        }
                        Divider(color = BorderColor)
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text("Excitement", style = MaterialTheme.typography.labelSmall, color = TextMid, modifier = Modifier.weight(1f))
                            Text("${aiData.excitement}/10", fontWeight = FontWeight.Bold, color = Accent, fontSize = 18.sp)
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun SectionRow(emoji: String, label: String, value: String) {
    Column {
        Text("$emoji $label", style = MaterialTheme.typography.labelSmall, color = TextMid)
        Spacer(Modifier.height(4.dp))
        Text(value, style = MaterialTheme.typography.bodyMedium, color = TextColor)
    }
}

@Composable
private fun PlanTab(state: AiState<ExecutionPlan>, vm: DetailViewModel) {
    when (state) {
        is AiState.Idle, AiState.Loading -> AiLoadingPlaceholder(if (state is AiState.Loading) "Building your roadmap…" else "Tap to generate execution plan")
        is AiState.Error -> ErrorCard(state.message)
        is AiState.Success -> {
            val plan = state.data
            val checked = vm.parseCheckedTasks()
            LazyColumn(contentPadding = PaddingValues(16.dp)) {
                item {
                    Card(colors = CardDefaults.cardColors(containerColor = AppBlue.copy(alpha = 0.08f))) {
                        Column(Modifier.padding(14.dp)) {
                            Text("⚡ Next Action", style = MaterialTheme.typography.labelSmall, color = AppBlue)
                            Spacer(Modifier.height(4.dp))
                            Text(plan.nextAction, style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.SemiBold)
                        }
                    }
                    Spacer(Modifier.height(12.dp))
                    Text("⚠️ Critical Risk: ${plan.criticalRisk}", style = MaterialTheme.typography.bodySmall, color = AppWarn)
                    Spacer(Modifier.height(16.dp))
                }
                items(plan.phases) { phase ->
                    Text("${phase.emoji} ${phase.name}", style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.Bold)
                    Text("${phase.duration} · ${phase.costRange}", style = MaterialTheme.typography.bodySmall, color = TextMid)
                    Spacer(Modifier.height(8.dp))
                    phase.tasks.forEach { task ->
                        Row(
                            modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp),
                            verticalAlignment = Alignment.CenterVertically,
                        ) {
                            Checkbox(
                                checked = checked[task.id] == true,
                                onCheckedChange = { vm.toggleTask(task.id) },
                                colors = CheckboxDefaults.colors(checkedColor = Accent),
                            )
                            Column(Modifier.weight(1f)) {
                                Text(task.label, style = MaterialTheme.typography.bodyMedium, color = if (checked[task.id] == true) TextSoft else TextColor)
                                Text("${task.owner} · ${task.effort}", style = MaterialTheme.typography.bodySmall, color = TextSoft)
                            }
                        }
                    }
                    Spacer(Modifier.height(12.dp))
                    Divider(color = BorderColor)
                    Spacer(Modifier.height(12.dp))
                }
            }
        }
    }
}

@Composable
private fun RevenueTab(state: AiState<RevenuePlan>) {
    when (state) {
        is AiState.Idle, AiState.Loading -> AiLoadingPlaceholder(if (state is AiState.Loading) "Modeling your revenue…" else "Tap Plan tab to unlock revenue model")
        is AiState.Error -> ErrorCard(state.message)
        is AiState.Success -> {
            val plan = state.data
            LazyColumn(contentPadding = PaddingValues(16.dp)) {
                item {
                    Text("📈 Revenue Model · ${plan.model}", style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.Bold)
                    Spacer(Modifier.height(12.dp))
                    RevenueRow("Year 1", plan.year1)
                    Spacer(Modifier.height(8.dp))
                    RevenueRow("Year 3", plan.year3)
                    Spacer(Modifier.height(12.dp))
                    Text("Time to first revenue: ${plan.timeToFirstRevenue}", style = MaterialTheme.typography.bodySmall, color = TextMid)
                    Spacer(Modifier.height(16.dp))
                    Text("Assumptions", style = MaterialTheme.typography.labelSmall, color = TextMid)
                    plan.assumptions.forEach { Text("• $it", style = MaterialTheme.typography.bodySmall) }
                    Spacer(Modifier.height(16.dp))
                    Text("Monetization Strategies", style = MaterialTheme.typography.labelSmall, color = TextMid)
                    plan.monetizationStrategies.forEach { s ->
                        Card(modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp), colors = CardDefaults.cardColors(containerColor = WarnBg)) {
                            Column(Modifier.padding(12.dp)) {
                                Text(s.name, fontWeight = FontWeight.SemiBold, style = MaterialTheme.typography.bodyMedium)
                                Text(s.description, style = MaterialTheme.typography.bodySmall, color = TextMid)
                                Text(s.avgRevPerUser, color = AppWarn, fontWeight = FontWeight.Bold, style = MaterialTheme.typography.bodySmall)
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun RevenueRow(label: String, range: com.soiwasthinking.app.data.model.MoneyRange) {
    Card(colors = CardDefaults.cardColors(containerColor = GreenBg), modifier = Modifier.fillMaxWidth()) {
        Row(Modifier.padding(14.dp), horizontalArrangement = Arrangement.SpaceBetween) {
            Text(label, fontWeight = FontWeight.SemiBold)
            Text("\$${range.low / 1000}K – \$${range.high / 1000}K", color = AppGreen, fontWeight = FontWeight.Bold)
        }
    }
}

@Composable
private fun CompTab(state: AiState<CompScan>) {
    when (state) {
        is AiState.Idle, AiState.Loading -> AiLoadingPlaceholder(if (state is AiState.Loading) "Scanning competitors…" else "Tap to scan the competitive landscape")
        is AiState.Error -> ErrorCard(state.message)
        is AiState.Success -> {
            val scan = state.data
            LazyColumn(contentPadding = PaddingValues(16.dp)) {
                item {
                    Card(colors = CardDefaults.cardColors(containerColor = BlueBg), modifier = Modifier.fillMaxWidth()) {
                        Column(Modifier.padding(14.dp)) {
                            Row {
                                Text("Differentiation Score", Modifier.weight(1f), style = MaterialTheme.typography.labelSmall, color = AppBlue)
                                Text("${scan.differentiationScore}/10", fontWeight = FontWeight.ExtraBold, color = AppBlue, fontSize = 20.sp)
                            }
                            Spacer(Modifier.height(4.dp))
                            Text(scan.verdict, style = MaterialTheme.typography.bodySmall)
                        }
                    }
                    Spacer(Modifier.height(12.dp))
                    Text("Competitors (${scan.crowdedness})", style = MaterialTheme.typography.labelSmall, color = TextMid)
                    Spacer(Modifier.height(8.dp))
                }
                items(scan.competitors) { c ->
                    Card(modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp), colors = CardDefaults.cardColors(containerColor = SurfaceColor)) {
                        Column(Modifier.padding(12.dp)) {
                            Row {
                                Column(Modifier.weight(1f)) {
                                    Text(c.name, fontWeight = FontWeight.Bold, style = MaterialTheme.typography.bodyMedium)
                                    Text(c.url, color = AppBlue, style = MaterialTheme.typography.bodySmall)
                                }
                                Text("${c.similarityScore}/10", color = AppWarn, fontWeight = FontWeight.Bold)
                            }
                            Spacer(Modifier.height(4.dp))
                            Text(c.description, style = MaterialTheme.typography.bodySmall, color = TextMid)
                            Text("Gap: ${c.weakness}", style = MaterialTheme.typography.bodySmall, color = AppGreen)
                        }
                    }
                }
                item {
                    Spacer(Modifier.height(12.dp))
                    Card(colors = CardDefaults.cardColors(containerColor = GreenBg), modifier = Modifier.fillMaxWidth()) {
                        Column(Modifier.padding(14.dp)) {
                            Text("Your Edge", style = MaterialTheme.typography.labelSmall, color = AppGreen)
                            Text(scan.yourEdge, style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.SemiBold)
                            Spacer(Modifier.height(8.dp))
                            Text("Recommendation: ${scan.recommendation}", style = MaterialTheme.typography.bodySmall, color = TextMid)
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun AiLoadingPlaceholder(msg: String) {
    Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            CircularProgressIndicator(color = Accent)
            Spacer(Modifier.height(12.dp))
            Text(msg, color = TextMid, style = MaterialTheme.typography.bodyMedium)
        }
    }
}

@Composable
private fun ErrorCard(msg: String) {
    Box(Modifier.fillMaxSize().padding(16.dp), contentAlignment = Alignment.Center) {
        Card(colors = CardDefaults.cardColors(containerColor = Color(0xFFFEF2F2))) {
            Text("⚠️ $msg", Modifier.padding(16.dp), color = Color(0xFFDC2626), style = MaterialTheme.typography.bodyMedium)
        }
    }
}
