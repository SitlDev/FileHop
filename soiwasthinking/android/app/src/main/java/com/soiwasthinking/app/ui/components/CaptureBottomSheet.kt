package com.soiwasthinking.app.ui.components

import android.Manifest
import android.content.Intent
import android.os.Bundle
import android.speech.RecognitionListener
import android.speech.RecognizerIntent
import android.speech.SpeechRecognizer
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.animation.core.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Mic
import androidx.compose.material.icons.filled.Stop
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.soiwasthinking.app.ui.theme.*
import kotlinx.coroutines.delay

private val CONTEXTS = listOf(
    "scrolling" to "📱 Scrolling", "talking" to "💬 Talking", "working" to "💼 Working",
    "sleepy" to "😴 Falling Asleep", "driving" to "🚗 Driving", "moving" to "🏃 Moving",
    "reading" to "📖 Reading", "shower" to "🚿 Shower", "eating" to "🍽️ Eating",
    "random" to "✨ Nowhere Specific",
)

private val MOODS = listOf(
    "pumped" to "🔥 Pumped", "thinking" to "🧠 Thinking", "calm" to "😌 Calm",
    "buzzing" to "⚡ Buzzing", "fuzzy" to "🌀 Fuzzy",
)

enum class VoiceState { IDLE, REQUESTING, LISTENING, ERROR }

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CaptureBottomSheet(onDismiss: () -> Unit, onSave: (String, String, String, Int) -> Unit) {
    var text by remember { mutableStateOf("") }
    var context by remember { mutableStateOf("random") }
    var mood by remember { mutableStateOf("pumped") }
    var rating by remember { mutableIntStateOf(7) }
    var voiceState by remember { mutableStateOf(VoiceState.IDLE) }
    var voiceError by remember { mutableStateOf<String?>(null) }
    var rmsLevel by remember { mutableFloatStateOf(0f) }

    val ctx = LocalContext.current
    val speechRecognizer = remember { SpeechRecognizer.createSpeechRecognizer(ctx) }

    val micPulse by rememberInfiniteTransition(label = "mic").animateFloat(
        initialValue = 1f, targetValue = 1.15f,
        animationSpec = infiniteRepeatable(tween(700, easing = EaseInOutSine), RepeatMode.Reverse),
        label = "pulse",
    )

    val permissionLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { granted ->
        if (granted) startSpeechRecognition(speechRecognizer, { voiceState = it }, { partial -> text = text.trimEnd() + if (text.isNotEmpty()) " $partial" else partial }, { result -> text = text.trimEnd() + if (text.isNotEmpty()) " $result" else result; voiceState = VoiceState.IDLE }, { err -> voiceError = err; voiceState = VoiceState.ERROR }, { rms -> rmsLevel = rms })
        else { voiceError = "Microphone permission denied."; voiceState = VoiceState.ERROR }
    }

    DisposableEffect(Unit) {
        onDispose { speechRecognizer.destroy() }
    }

    ModalBottomSheet(
        onDismissRequest = onDismiss,
        containerColor = SurfaceColor,
        dragHandle = { BottomSheetDefaults.DragHandle() },
    ) {
        Column(
            modifier = Modifier
                .padding(horizontal = 20.dp)
                .padding(bottom = 32.dp)
                .verticalScroll(rememberScrollState()),
        ) {
            Text("What's the idea? ✨", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.ExtraBold)
            Spacer(Modifier.height(14.dp))

            // Text area
            OutlinedTextField(
                value = text,
                onValueChange = { text = it },
                modifier = Modifier.fillMaxWidth().heightIn(min = 100.dp),
                placeholder = { Text(if (voiceState == VoiceState.LISTENING) "Recording… speak your idea" else "Type or tap the mic…", color = TextSoft) },
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = if (voiceState == VoiceState.LISTENING) Accent else MaterialTheme.colorScheme.outline,
                    unfocusedBorderColor = BorderColor,
                ),
                shape = MaterialTheme.shapes.medium,
            )

            // Voice error
            voiceError?.let {
                Spacer(Modifier.height(6.dp))
                Text("⚠️ $it", color = Color(0xFFDC2626), style = MaterialTheme.typography.bodySmall)
            }

            Spacer(Modifier.height(10.dp))

            // Mic button
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.Center) {
                val isListening = voiceState == VoiceState.LISTENING
                FilledIconButton(
                    onClick = {
                        if (isListening) {
                            speechRecognizer.stopListening()
                            voiceState = VoiceState.IDLE
                        } else {
                            voiceError = null
                            permissionLauncher.launch(Manifest.permission.RECORD_AUDIO)
                        }
                    },
                    modifier = Modifier
                        .size(56.dp)
                        .scale(if (isListening) micPulse else 1f),
                    colors = IconButtonDefaults.filledIconButtonColors(
                        containerColor = if (isListening) Accent else MaterialTheme.colorScheme.surfaceVariant,
                        contentColor = if (isListening) Color.White else TextMid,
                    ),
                ) {
                    Icon(if (isListening) Icons.Default.Stop else Icons.Default.Mic, "Microphone", Modifier.size(26.dp))
                }
            }
            if (voiceState == VoiceState.LISTENING) {
                Spacer(Modifier.height(4.dp))
                Text("Tap ■ to stop", style = MaterialTheme.typography.bodySmall, color = Accent, modifier = Modifier.align(Alignment.CenterHorizontally))
            }

            Spacer(Modifier.height(16.dp))

            // Context chips
            Text("WHERE WERE YOU?", style = MaterialTheme.typography.labelSmall, color = TextMid)
            Spacer(Modifier.height(8.dp))
            LazyHorizontalRow(items = CONTEXTS, selected = context, onSelect = { context = it })

            Spacer(Modifier.height(14.dp))

            // Mood
            Text("HOW DO YOU FEEL ABOUT IT?", style = MaterialTheme.typography.labelSmall, color = TextMid)
            Spacer(Modifier.height(8.dp))
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                MOODS.forEach { (id, label) ->
                    val selected = mood == id
                    FilterChip(
                        modifier = Modifier.weight(1f),
                        selected = selected,
                        onClick = { mood = id },
                        label = { Text(label, fontSize = 11.sp, maxLines = 1) },
                        colors = FilterChipDefaults.filterChipColors(
                            selectedContainerColor = AccentBg,
                            selectedLabelColor = Accent,
                        ),
                    )
                }
            }

            Spacer(Modifier.height(14.dp))

            // Rating
            val ratingColor = when { rating >= 8 -> AppGreen; rating >= 5 -> Accent; else -> TextMid }
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text("GUT FEELING", style = MaterialTheme.typography.labelSmall, color = TextMid, modifier = Modifier.weight(1f))
                Text("$rating", fontWeight = FontWeight.ExtraBold, color = ratingColor, fontSize = 24.sp)
                Text("/10", color = TextSoft, fontSize = 13.sp)
            }
            Slider(
                value = rating.toFloat(),
                onValueChange = { rating = it.toInt() },
                valueRange = 1f..10f,
                steps = 8,
                colors = SliderDefaults.colors(thumbColor = Accent, activeTrackColor = Accent),
            )

            Spacer(Modifier.height(20.dp))

            Button(
                onClick = { if (text.isNotBlank()) onSave(text, context, mood, rating) },
                enabled = text.isNotBlank(),
                modifier = Modifier.fillMaxWidth().height(54.dp),
                colors = ButtonDefaults.buttonColors(containerColor = Accent),
                shape = MaterialTheme.shapes.extraLarge,
            ) { Text("Save it →", fontWeight = FontWeight.Bold, fontSize = 16.sp) }
        }
    }
}

@Composable
private fun LazyHorizontalRow(items: List<Pair<String, String>>, selected: String, onSelect: (String) -> Unit) {
    Row(modifier = Modifier.fillMaxWidth().padding(bottom = 4.dp), horizontalArrangement = Arrangement.spacedBy(6.dp)) {
        // Simplified — wrapping row (horizontal scroll would be ideal; using wrap for simplicity)
        // In a real build, use a horizontally scrolling LazyRow here
        items.take(5).forEach { (id, label) ->
            FilterChip(
                selected = selected == id, onClick = { onSelect(id) },
                label = { Text(label, fontSize = 11.sp) },
                colors = FilterChipDefaults.filterChipColors(selectedContainerColor = AccentBg, selectedLabelColor = Accent),
            )
        }
    }
    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(6.dp)) {
        items.drop(5).forEach { (id, label) ->
            FilterChip(
                selected = selected == id, onClick = { onSelect(id) },
                label = { Text(label, fontSize = 11.sp) },
                colors = FilterChipDefaults.filterChipColors(selectedContainerColor = AccentBg, selectedLabelColor = Accent),
            )
        }
    }
}

private fun startSpeechRecognition(
    recognizer: SpeechRecognizer,
    onState: (VoiceState) -> Unit,
    onPartial: (String) -> Unit,
    onResult: (String) -> Unit,
    onError: (String) -> Unit,
    onRms: (Float) -> Unit,
) {
    recognizer.setRecognitionListener(object : RecognitionListener {
        override fun onReadyForSpeech(params: Bundle?) { onState(VoiceState.LISTENING) }
        override fun onBeginningOfSpeech() {}
        override fun onRmsChanged(rmsdB: Float) { onRms(rmsdB) }
        override fun onBufferReceived(buffer: ByteArray?) {}
        override fun onEndOfSpeech() {}
        override fun onError(error: Int) {
            val msg = when (error) {
                SpeechRecognizer.ERROR_NO_MATCH       -> "Couldn't hear you. Try again."
                SpeechRecognizer.ERROR_SPEECH_TIMEOUT -> "No speech detected."
                SpeechRecognizer.ERROR_AUDIO          -> "Audio error. Try again."
                else                                  -> "Recognition failed (code $error)."
            }
            onError(msg)
        }
        override fun onResults(results: Bundle?) {
            val r = results?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)?.firstOrNull() ?: ""
            onResult(r)
        }
        override fun onPartialResults(partial: Bundle?) {
            val p = partial?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)?.firstOrNull() ?: ""
            if (p.isNotBlank()) onPartial(p)
        }
        override fun onEvent(eventType: Int, params: Bundle?) {}
    })
    val intent = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
        putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
        putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, true)
        putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 1)
    }
    recognizer.startListening(intent)
    onState(VoiceState.REQUESTING)
}
