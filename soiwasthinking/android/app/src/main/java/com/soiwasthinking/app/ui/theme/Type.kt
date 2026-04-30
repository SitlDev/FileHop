package com.soiwasthinking.app.ui.theme

import androidx.compose.material3.Typography
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.googlefonts.Font
import androidx.compose.ui.text.googlefonts.GoogleFont
import androidx.compose.ui.unit.sp
import com.soiwasthinking.app.R

val provider = GoogleFont.Provider(
    providerAuthority = "com.google.android.gms.fonts",
    providerPackage = "com.google.android.gms",
    certificates = R.array.com_google_android_gms_fonts_certs,
)

val Poppins = FontFamily(
    Font(googleFont = GoogleFont("Poppins"), fontProvider = provider, weight = FontWeight.Normal),
    Font(googleFont = GoogleFont("Poppins"), fontProvider = provider, weight = FontWeight.Medium),
    Font(googleFont = GoogleFont("Poppins"), fontProvider = provider, weight = FontWeight.SemiBold),
    Font(googleFont = GoogleFont("Poppins"), fontProvider = provider, weight = FontWeight.Bold),
    Font(googleFont = GoogleFont("Poppins"), fontProvider = provider, weight = FontWeight.ExtraBold),
)

val AppTypography = Typography(
    displayLarge  = TextStyle(fontFamily = Poppins, fontWeight = FontWeight.ExtraBold, fontSize = 30.sp, lineHeight = 36.sp),
    titleLarge    = TextStyle(fontFamily = Poppins, fontWeight = FontWeight.Bold, fontSize = 22.sp, lineHeight = 28.sp),
    titleMedium   = TextStyle(fontFamily = Poppins, fontWeight = FontWeight.SemiBold, fontSize = 18.sp, lineHeight = 24.sp),
    titleSmall    = TextStyle(fontFamily = Poppins, fontWeight = FontWeight.SemiBold, fontSize = 15.sp, lineHeight = 20.sp),
    bodyLarge     = TextStyle(fontFamily = Poppins, fontWeight = FontWeight.Normal, fontSize = 15.sp, lineHeight = 24.sp),
    bodyMedium    = TextStyle(fontFamily = Poppins, fontWeight = FontWeight.Normal, fontSize = 13.sp, lineHeight = 20.sp),
    bodySmall     = TextStyle(fontFamily = Poppins, fontWeight = FontWeight.Normal, fontSize = 12.sp, lineHeight = 18.sp),
    labelSmall    = TextStyle(fontFamily = Poppins, fontWeight = FontWeight.SemiBold, fontSize = 11.sp, letterSpacing = 0.06.sp),
)
