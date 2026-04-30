package com.soiwasthinking.app.ui.theme

import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

private val AppColorScheme = lightColorScheme(
    primary          = Accent,
    onPrimary        = Color.White,
    primaryContainer = AccentBg,
    secondary        = AppBlue,
    onSecondary      = Color.White,
    background       = BgColor,
    surface          = SurfaceColor,
    onBackground     = TextColor,
    onSurface        = TextColor,
    outline          = BorderColor,
    surfaceVariant   = BgColor,
    onSurfaceVariant = TextMid,
)

@Composable
fun SoIWasThinkingTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = AppColorScheme,
        typography  = AppTypography,
        content     = content,
    )
}
