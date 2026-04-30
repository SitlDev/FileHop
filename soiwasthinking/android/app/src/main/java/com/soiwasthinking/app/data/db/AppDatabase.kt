package com.soiwasthinking.app.data.db

import androidx.room.Database
import androidx.room.RoomDatabase
import com.soiwasthinking.app.data.model.Idea

@Database(entities = [Idea::class], version = 1, exportSchema = false)
abstract class AppDatabase : RoomDatabase() {
    abstract fun ideaDao(): IdeaDao
}
