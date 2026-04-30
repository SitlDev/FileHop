package com.soiwasthinking.app.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.soiwasthinking.app.data.model.Patterns
import com.soiwasthinking.app.data.repository.IdeaRepository
import com.soiwasthinking.app.ui.theme.*
import com.soiwasthinking.app.viewmodel.IdeasViewModel
import kotlinx.coroutines.launch
import javax.inject.Inject
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*

// ─── Insights ViewModel (scoped locally to avoid polluting main ViewModels) ──
@HiltViewModel
class InsightsViewModel @Inject constructor(private val repo: IdeaRepository) : ViewModel() {
    val ideas = repo.activeIdeas.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())
    private val _patterns = MutableStateFlow<Patterns?>(null)
    val patterns: StateFlow<Patterns?> = _patterns
    private val _loading = MutableStateFlow(false)
    val loading: StateFlow<Boolean> = _loading
    private val _error = MutableStateFlow<String?>(null)
    val error: StateFlow<String?> = _error

    fun analyze() {
        val list = ideas.value
        if (list.size < 3) { _error.value = "Capture at least 3 ideas to unlock insights."; return }
        viewModelScope.launch {
            _loading.value = true
            _error.value = null
            try { _patterns.value = repo.fetchPatterns(list) }
            catch (e: Exception) { _error.value = e.message }
            finally { _loading.value = false }
        }
    }
}

@Composable
fun InsightsScreen(innerPadding: PaddingValues) {
    val viewModel: InsightsViewModel = hiltViewModel()
    val patterns by viewModel.patterns.collectAsState()
    val loading by viewModel.loading.collectAsState()
    val error by viewModel.error.collectAsState()
    val ideas by viewModel.ideas.collectAsState()

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(innerPadding)
            .padding(horizontal = 16.dp),
        contentPadding = PaddingValues(bottom = 80.dp),
    ) {
        item {
            Spacer(Modifier.height(16.dp))
            Text("🧠 Your Idea Patterns", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.ExtraBold)
            Text("${ideas.size} ideas analyzed", style = MaterialTheme.typography.bodyMedium, color = TextMid)
            Spacer(Modifier.height(16.dp))

            if (patterns == null && !loading) {
                Button(
                    onClick = { viewModel.analyze() },
                    modifier = Modifier.fillMaxWidth().height(52.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = Accent),
                    shape = MaterialTheme.shapes.extraLarge,
                ) { Text("Analyze My Patterns →", fontWeight = FontWeight.Bold) }
            }
            if (loading) {
                Box(Modifier.fillMaxWidth().height(120.dp), contentAlignment = Alignment.Center) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        CircularProgressIndicator(color = Accent)
                        Spacer(Modifier.height(8.dp))
                        Text("Analyzing your pattern…", color = TextMid, style = MaterialTheme.typography.bodySmall)
                    }
                }
            }
            error?.let {
                Card(colors = CardDefaults.cardColors(containerColor = AccentBg), modifier = Modifier.fillMaxWidth()) {
                    Text("⚠️ $it", Modifier.padding(14.dp), color = Accent, style = MaterialTheme.typography.bodySmall)
                }
            }
            patterns?.let { p ->
                Spacer(Modifier.height(12.dp))
                InsightCard("🕐 Best time of day", p.bestTimeOfDay)
                InsightCard("📍 Best context", p.bestContext)
                InsightCard("🧬 Cognitive style", p.cognitiveStyle)
                InsightCard("💡 Recommendation", p.recommendation)
                Spacer(Modifier.height(12.dp))
                Text("Recurring Themes", style = MaterialTheme.typography.labelSmall, color = TextMid)
                Spacer(Modifier.height(6.dp))
                p.recurringThemes.forEach {
                    Text("• $it", style = MaterialTheme.typography.bodySmall, color = TextColor)
                }
                Spacer(Modifier.height(12.dp))
                Text("Subconscious Patterns", style = MaterialTheme.typography.labelSmall, color = TextMid)
                Spacer(Modifier.height(6.dp))
                p.subconsciousPatterns.forEach {
                    Text("• $it", style = MaterialTheme.typography.bodySmall, color = TextColor)
                }
                Spacer(Modifier.height(16.dp))
                OutlinedButton(onClick = { viewModel.analyze() }, modifier = Modifier.fillMaxWidth()) {
                    Text("Re-analyze")
                }
            }
        }
    }
}

@Composable
private fun InsightCard(label: String, value: String) {
    Card(
        modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp),
        colors = CardDefaults.cardColors(containerColor = SurfaceColor),
    ) {
        Column(Modifier.padding(14.dp)) {
            Text(label, style = MaterialTheme.typography.labelSmall, color = TextMid)
            Spacer(Modifier.height(4.dp))
            Text(value, style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.SemiBold)
        }
    }
}
