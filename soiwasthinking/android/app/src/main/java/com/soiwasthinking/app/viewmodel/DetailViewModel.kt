package com.soiwasthinking.app.viewmodel

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.soiwasthinking.app.data.model.*
import com.soiwasthinking.app.data.repository.IdeaRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import javax.inject.Inject

sealed class AiState<out T> {
    object Idle : AiState<Nothing>()
    object Loading : AiState<Nothing>()
    data class Success<T>(val data: T) : AiState<T>()
    data class Error(val message: String) : AiState<Nothing>()
}

@HiltViewModel
class DetailViewModel @Inject constructor(
    private val repo: IdeaRepository,
    savedStateHandle: SavedStateHandle,
) : ViewModel() {

    private val ideaId: String = checkNotNull(savedStateHandle["ideaId"])

    val idea: StateFlow<Idea?> = repo.observeIdea(ideaId)
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), null)

    private val _executionState = MutableStateFlow<AiState<ExecutionPlan>>(AiState.Idle)
    val executionState: StateFlow<AiState<ExecutionPlan>> = _executionState

    private val _revenueState = MutableStateFlow<AiState<RevenuePlan>>(AiState.Idle)
    val revenueState: StateFlow<AiState<RevenuePlan>> = _revenueState

    private val _compState = MutableStateFlow<AiState<CompScan>>(AiState.Idle)
    val compState: StateFlow<AiState<CompScan>> = _compState

    fun fetchExecutionPlan(hoursPerWeek: Int = 10) {
        val current = idea.value ?: return
        if (current.executionPlanJson != null) {
            _executionState.value = AiState.Success(repo.parseExecutionPlan(current)!!)
            return
        }
        viewModelScope.launch {
            _executionState.value = AiState.Loading
            try {
                _executionState.value = AiState.Success(repo.fetchExecutionPlan(current, hoursPerWeek))
            } catch (e: Exception) {
                _executionState.value = AiState.Error(e.message ?: "Unknown error")
            }
        }
    }

    fun fetchRevenuePlan() {
        val current = idea.value ?: return
        if (current.revenuePlanJson != null) {
            _revenueState.value = AiState.Success(repo.parseRevenuePlan(current)!!)
            return
        }
        viewModelScope.launch {
            _revenueState.value = AiState.Loading
            try {
                _revenueState.value = AiState.Success(repo.fetchRevenuePlan(current))
            } catch (e: Exception) {
                _revenueState.value = AiState.Error(e.message ?: "Unknown error")
            }
        }
    }

    fun fetchCompScan() {
        val current = idea.value ?: return
        if (current.compScanJson != null) {
            _compState.value = AiState.Success(repo.parseCompScan(current)!!)
            return
        }
        viewModelScope.launch {
            _compState.value = AiState.Loading
            try {
                _compState.value = AiState.Success(repo.fetchCompScan(current))
            } catch (e: Exception) {
                _compState.value = AiState.Error(e.message ?: "Unknown error")
            }
        }
    }

    fun toggleTask(taskId: String) {
        val current = idea.value ?: return
        viewModelScope.launch { repo.toggleTask(current, taskId) }
    }

    fun parseAiData(): AiData? = idea.value?.let { repo.parseAiData(it) }
    fun parseExecutionPlan(): ExecutionPlan? = idea.value?.let { repo.parseExecutionPlan(it) }
    fun parseCheckedTasks(): Map<String, Boolean> = idea.value?.let { repo.parseCheckedTasks(it) } ?: emptyMap()
}
