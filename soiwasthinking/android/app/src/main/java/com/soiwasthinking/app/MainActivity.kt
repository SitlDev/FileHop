package com.soiwasthinking.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.runtime.*
import androidx.core.view.WindowCompat
import com.soiwasthinking.app.ui.navigation.AppNavigation
import com.soiwasthinking.app.ui.theme.SoIWasThinkingTheme
import dagger.hilt.android.AndroidEntryPoint

private const val PREFS_NAME  = "siwt_prefs"
private const val KEY_WELCOME  = "welcome_seen"

@AndroidEntryPoint
class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        WindowCompat.setDecorFitsSystemWindows(window, false)

        val prefs = getSharedPreferences(PREFS_NAME, MODE_PRIVATE)

        setContent {
            SoIWasThinkingTheme {
                var welcomeSeen by remember {
                    mutableStateOf(prefs.getBoolean(KEY_WELCOME, false))
                }
                AppNavigation(
                    showWelcome = !welcomeSeen,
                    onWelcomeDone = {
                        prefs.edit().putBoolean(KEY_WELCOME, true).apply()
                        welcomeSeen = true
                    },
                )
            }
        }
    }
}
