package com.soiwasthinking.app.ui.navigation

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.EmojiObjects
import androidx.compose.material.icons.filled.Insights
import androidx.compose.material.icons.filled.NightShelter
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavDestination.Companion.hierarchy
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.compose.*
import com.soiwasthinking.app.ui.screens.*
import com.soiwasthinking.app.ui.theme.Accent
import com.soiwasthinking.app.ui.theme.TextMid

sealed class Screen(val route: String, val label: String, val icon: ImageVector) {
    object Ideas    : Screen("ideas", "Ideas", Icons.Default.EmojiObjects)
    object Graveyard: Screen("graveyard", "Graveyard", Icons.Default.NightShelter)
    object Insights : Screen("insights", "Insights", Icons.Default.Insights)
}

private val bottomScreens = listOf(Screen.Ideas, Screen.Graveyard, Screen.Insights)

@Composable
fun AppNavigation(showWelcome: Boolean, onWelcomeDone: () -> Unit) {
    val navController = rememberNavController()

    if (showWelcome) {
        WelcomeScreen(onStart = onWelcomeDone)
        return
    }

    Scaffold(
        bottomBar = {
            val navBackStackEntry by navController.currentBackStackEntryAsState()
            val currentDestination = navBackStackEntry?.destination
            // Hide bottom bar on detail screen
            val showBar = currentDestination?.route?.startsWith("detail/") == false
            if (showBar) {
                NavigationBar(containerColor = androidx.compose.ui.graphics.Color.White) {
                    bottomScreens.forEach { screen ->
                        val selected = currentDestination?.hierarchy?.any { it.route == screen.route } == true
                        NavigationBarItem(
                            icon = { Icon(screen.icon, contentDescription = screen.label) },
                            label = { Text(screen.label) },
                            selected = selected,
                            onClick = {
                                navController.navigate(screen.route) {
                                    popUpTo(navController.graph.findStartDestination().id) { saveState = true }
                                    launchSingleTop = true
                                    restoreState = true
                                }
                            },
                            colors = NavigationBarItemDefaults.colors(
                                selectedIconColor = Accent,
                                selectedTextColor = Accent,
                                unselectedIconColor = TextMid,
                                unselectedTextColor = TextMid,
                                indicatorColor = androidx.compose.ui.graphics.Color(0xFFFFF0F0),
                            )
                        )
                    }
                }
            }
        }
    ) { padding ->
        NavHost(navController, startDestination = Screen.Ideas.route) {
            composable(Screen.Ideas.route) {
                IdeasListScreen(
                    innerPadding = padding,
                    onIdeaClick = { ideaId -> navController.navigate("detail/$ideaId") },
                    viewModel = hiltViewModel(),
                )
            }
            composable(Screen.Graveyard.route) {
                GraveyardScreen(
                    innerPadding = padding,
                    onIdeaClick = { ideaId -> navController.navigate("detail/$ideaId") },
                    viewModel = hiltViewModel(),
                )
            }
            composable(Screen.Insights.route) {
                InsightsScreen(innerPadding = padding)
            }
            composable("detail/{ideaId}") {
                IdeaDetailScreen(
                    onBack = { navController.popBackStack() },
                    viewModel = hiltViewModel(),
                )
            }
        }
    }
}
