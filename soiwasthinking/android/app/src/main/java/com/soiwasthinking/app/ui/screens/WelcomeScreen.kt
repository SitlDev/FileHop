package com.soiwasthinking.app.ui.screens

import androidx.compose.animation.core.*
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.scale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.soiwasthinking.app.ui.theme.*

@Composable
fun WelcomeScreen(onStart: () -> Unit) {
    val infiniteTransition = rememberInfiniteTransition(label = "float")
    val offsetY by infiniteTransition.animateFloat(
        initialValue = 0f, targetValue = -12f,
        animationSpec = infiniteRepeatable(
            animation = tween(1600, easing = EaseInOutSine),
            repeatMode = RepeatMode.Reverse,
        ),
        label = "bulb_float",
    )

    Box(
        modifier = Modifier.fillMaxSize(),
        contentAlignment = Alignment.Center,
    ) {
        Column(
            modifier = Modifier.padding(horizontal = 32.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            Text(
                "💡",
                fontSize = 72.sp,
                modifier = Modifier
                    .offset(y = offsetY.dp)
                    .padding(bottom = 24.dp),
            )
            Text(
                "So I Was Thinking…",
                style = MaterialTheme.typography.displayLarge,
                textAlign = TextAlign.Center,
                color = TextColor,
            )
            Spacer(Modifier.height(8.dp))
            Text(
                "Catch it before it's gone.",
                style = MaterialTheme.typography.titleSmall,
                color = Accent,
                textAlign = TextAlign.Center,
            )
            Spacer(Modifier.height(12.dp))
            Text(
                "Capture sparks from anywhere — driving, showering, half-asleep — and let AI turn them into real plans.",
                style = MaterialTheme.typography.bodyLarge,
                color = TextMid,
                textAlign = TextAlign.Center,
                lineHeight = 26.sp,
            )
            Spacer(Modifier.height(48.dp))
            Button(
                onClick = onStart,
                modifier = Modifier
                    .fillMaxWidth()
                    .height(58.dp),
                shape = MaterialTheme.shapes.extraLarge,
                colors = ButtonDefaults.buttonColors(containerColor = Accent),
            ) {
                Text(
                    "Capture my first idea →",
                    fontWeight = FontWeight.Bold,
                    fontSize = 17.sp,
                )
            }
            Spacer(Modifier.height(16.dp))
            Text(
                "No sign-up. No email. Just ideas.",
                style = MaterialTheme.typography.bodySmall,
                color = TextSoft,
            )
        }
    }
}
