package com.soiwasthinking.app.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.soiwasthinking.app.data.model.*
import com.soiwasthinking.app.data.repository.IdeaRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import javax.inject.Inject

private const val RESURFACE_AFTER_DAYS = 7L

@HiltViewModel
class GraveyardViewModel @Inject constructor(
    private val repo: IdeaRepository,
) : ViewModel() {

    val buriedIdeas: StateFlow<List<Idea>> = repo.buriedIdeas
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    private val _revivalState = MutableStateFlow<Map<String, AiState<Revival>>>(emptyMap())
    val revivalState: StateFlow<Map<String, AiState<Revival>>> = _revivalState

    /** Ideas buried ≥ 7 days ago that haven't had a revival yet. */
    val resurfaceQueue: StateFlow<List<Idea>> = buriedIdeas.map { list ->
        val nowDays = System.currentTimeMillis() / 86_400_000L
        list.filter { idea ->
            val buriedDays = (idea.buriedAt ?: 0L) / 86_400_000L
            (nowDays - buriedDays) >= RESURFACE_AFTER_DAYS && idea.revivalJson == null
        }
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    fun unbury(idea: Idea) { viewModelScope.launch { repo.unbury(idea.id) } }
    fun delete(idea: Idea) { viewModelScope.launch { repo.delete(idea.id) } }

    fun fetchRevival(idea: Idea) {
        if (idea.revivalJson != null) {
            val revival = repo.parseRevival(idea) ?: return
            updateRevivalState(idea.id, AiState.Success(revival))
            return
        }
        viewModelScope.launch {
            updateRevivalState(idea.id, AiState.Loading)
            try {
                val revival = repo.fetchRevival(idea)
                updateRevivalState(idea.id, AiState.Success(revival))
            } catch (e: Exception) {
                updateRevivalState(idea.id, AiState.Error(e.message ?: "Error"))
            }
        }
    }

    private fun updateRevivalState(id: String, state: AiState<Revival>) {
        _revivalState.value = _revivalState.value.toMutableMap().apply { put(id, state) }
    }

    fun parseRevival(idea: Idea): Revival? = repo.parseRevival(idea)
    fun daysSinceBuried(idea: Idea): Long =
        if (idea.buriedAt != null) (System.currentTimeMillis() - idea.buriedAt) / 86_400_000L else 0L
}
