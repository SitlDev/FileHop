package com.soiwasthinking.app.di

import com.google.gson.Gson
import com.soiwasthinking.app.BuildConfig
import com.soiwasthinking.app.data.api.ApiService
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import java.util.concurrent.TimeUnit
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object NetworkModule {

    @Provides @Singleton
    fun provideGson(): Gson = Gson()

    @Provides @Singleton
    fun provideOkHttp(): OkHttpClient = OkHttpClient.Builder()
        .connectTimeout(30, TimeUnit.SECONDS)
        .readTimeout(60, TimeUnit.SECONDS)
        .addInterceptor(HttpLoggingInterceptor().apply {
            level = HttpLoggingInterceptor.Level.BODY
        })
        .build()

    @Provides @Singleton
    fun provideRetrofit(okHttp: OkHttpClient, gson: Gson): Retrofit = Retrofit.Builder()
        .baseUrl(BuildConfig.BACKEND_BASE_URL + "/")
        .client(okHttp)
        .addConverterFactory(GsonConverterFactory.create(gson))
        .build()

    @Provides @Singleton
    fun provideApiService(retrofit: Retrofit): ApiService =
        retrofit.create(ApiService::class.java)
}
