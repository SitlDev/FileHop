package com.soiwasthinking.app.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.soiwasthinking.app.data.model.*
import com.soiwasthinking.app.data.repository.IdeaRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class IdeasViewModel @Inject constructor(
    private val repo: IdeaRepository,
) : ViewModel() {

    val ideas: StateFlow<List<Idea>> = repo.activeIdeas
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    private val _captureOpen = MutableStateFlow(false)
    val captureOpen: StateFlow<Boolean> = _captureOpen

    private val _saving = MutableStateFlow(false)
    val saving: StateFlow<Boolean> = _saving

    private val _error = MutableStateFlow<String?>(null)
    val error: StateFlow<String?> = _error

    fun openCapture()  { _captureOpen.value = true }
    fun closeCapture() { _captureOpen.value = false }

    fun saveIdea(rawText: String, context: String, mood: String, rating: Int) {
        viewModelScope.launch {
            _saving.value = true
            _captureOpen.value = false
            try {
                val idea = repo.save(rawText, context, mood, rating)
                // Enrich in the background — user can already see the card
                repo.seedIdea(idea)
            } catch (e: Exception) {
                _error.value = "AI enrichment failed — idea saved without brief. ${e.message}"
            } finally {
                _saving.value = false
            }
        }
    }

    fun bury(idea: Idea) { viewModelScope.launch { repo.bury(idea.id) } }
    fun delete(idea: Idea) { viewModelScope.launch { repo.delete(idea.id) } }
    fun clearError() { _error.value = null }
}
