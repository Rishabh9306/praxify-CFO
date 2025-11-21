# /aiml_engine/core/memory.py
import redis
import json
from typing import Dict, List, Any
from aiml_engine.utils.helpers import CustomJSONEncoder

class ConversationalMemory:
    """
    A production-ready memory store backed by a Redis database.
    This allows memory to be persistent and shared across multiple servers/processes,
    making the agent truly scalable and stateful.
    """
    def __init__(self, host: str, port: int):
        """
        Initializes and tests the connection to the Redis server.

        Args:
            host (str): The hostname of the Redis server.
            port (int): The port number of the Redis server.
        """
        try:
            self._redis_client = redis.Redis(host=host, port=port, db=0, decode_responses=True)
            # The 'ping' command is the standard way to check if a Redis connection is live.
            self._redis_client.ping()
            print("✅ Successfully connected to Redis.")
        except redis.exceptions.ConnectionError as e:
            # If the connection fails, the application should not start.
            print(f"❌ FATAL: Could not connect to Redis at {host}:{port}. Please ensure Redis is running (e.g., via Docker).")
            raise e

    def update_context(self, session_id: str, query_id: str, analysis_summary: Dict):
        """
        Appends the latest analysis turn to a list stored under the session_id key in Redis.
        """
        key = f"session:{session_id}"
        # Convert the Python dictionary into a JSON string before storing.
        value = json.dumps(
            {"query_id": query_id, "summary": analysis_summary},
            cls=CustomJSONEncoder
        )
        
        # `rpush` is the Redis command to "right-push" an item onto the end of a list.
        self._redis_client.rpush(key, value)
        
        # Best Practice: Set an expiration time on the session data.
        # This automatically cleans up old conversations after 24 hours (86400 seconds).
        self._redis_client.expire(key, 86400)

    def recall_related_history(self, session_id: str) -> List[Dict]:
        """
        Retrieves the complete list of historical queries for a given session from Redis.
        """
        key = f"session:{session_id}"
        
        # `lrange 0 -1` is the Redis command to get all items from a list (from the first to the last).
        # It returns a list of JSON strings from Redis.
        history_json_strings = self._redis_client.lrange(key, 0, -1)
        
        # We must convert each JSON string in the list back into a Python dictionary.
        history = [json.loads(item) for item in history_json_strings]
        return history