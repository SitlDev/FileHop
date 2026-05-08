#!/usr/bin/env python3
"""
Test database connectivity and schema
Run with: python test_db_connection.py
"""
import os
import sys
import logging
from sqlalchemy import text, inspect

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def test_database():
    """Test database connectivity and show schema info"""
    
    # Import after logging is configured
    from app.database import engine, SessionLocal
    from app.config import settings
    
    print("\n" + "="*60)
    print("DATABASE CONNECTIVITY TEST")
    print("="*60)
    
    # Show configuration (mask sensitive info)
    db_url = settings.DATABASE_URL
    masked_url = db_url.replace(db_url.split("@")[0].split("://")[1], "***:***") if "@" in db_url else db_url
    print(f"\n📋 Configuration:")
    print(f"  DATABASE_URL: {masked_url}")
    print(f"  Type: {'MySQL' if 'mysql' in db_url.lower() else 'SQLite'}")
    print(f"  SECRET_KEY: {'SET' if settings.SECRET_KEY and settings.SECRET_KEY != 'dev-secret-key-change-in-production' else 'DEFAULT/NOT SET'}")
    
    try:
        # Test connection
        print(f"\n🔌 Testing connection...")
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1"))
            print(f"  ✅ Connection successful")
            
        # Get tables
        print(f"\n📊 Inspecting database schema...")
        inspector = inspect(engine)
        tables = inspector.get_table_names()
        
        if not tables:
            print(f"  ⚠️  No tables found in database!")
            print(f"     You need to run migrations:")
            print(f"     cd starpath-backend && alembic upgrade head")
        else:
            print(f"  ✅ Found {len(tables)} tables:")
            for table in sorted(tables):
                columns = inspector.get_columns(table)
                print(f"     - {table} ({len(columns)} columns)")
                
        # Test a query
        print(f"\n🧪 Running test query...")
        db = SessionLocal()
        try:
            if "mysql" in settings.DATABASE_URL.lower():
                result = db.execute(text("SELECT DATABASE() as current_db"))
                row = result.fetchone()
                db_name = row[0] if row else "unknown"
                print(f"  ✅ Query successful - Connected to: {db_name}")
            else:
                result = db.execute(text("SELECT 'SQLite' as current_db"))
                row = result.fetchone()
                print(f"  ✅ Query successful - Using SQLite")
        finally:
            db.close()
            
        print(f"\n✅ All tests passed!")
        return True
        
    except Exception as e:
        print(f"\n❌ Database test failed:")
        print(f"  Error: {str(e)}")
        print(f"\n💡 Troubleshooting:")
        print(f"  1. Verify DATABASE_URL is set in Railway environment")
        print(f"  2. For MySQL: mysql+mysqlconnector://user:pass@host:port/db")
        print(f"  3. Ensure MySQL service is linked on Railway")
        print(f"  4. Check network connectivity to database")
        print(f"  5. Verify credentials are correct")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = test_database()
    sys.exit(0 if success else 1)
