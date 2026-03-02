import json
import random
import os
from typing import List, Dict, Any
from app.core.config import Config

def load_writers() -> List[Dict[str, Any]]:
    """Load writer personalities from the local JSON library."""
    if os.path.exists(Config.WRITERS_FILE):
        try:
            with open(Config.WRITERS_FILE, 'r') as f:
                return json.load(f).get('writers', [])
        except:
            pass
    return [{"id": 0, "name": "The Editor", "title": "Editor-in-Chief", "bio": "Leading the team at KnotStranded."}]

def select_random_writer() -> Dict[str, Any]:
    """Selects a random writer personality."""
    writers = load_writers()
    return random.choice(writers)

def get_writer_by_id(writer_id: int) -> Dict[str, Any]:
    """Retrieves a specific writer by their ID."""
    writers = load_writers()
    for w in writers:
        if w.get('id') == writer_id:
            return w
    return writers[0]
