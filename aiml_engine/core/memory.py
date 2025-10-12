from typing import Dict, List, Any

class ConversationalMemory:
    """
    A simple in-memory store for maintaining short-term and long-term
    conversational context. In a production system, this would be backed
    by a database like Redis or a vector DB.
    """
    def __init__(self):
        self.short_term_memory: Dict[str, Any] = {}
        self.session_history: Dict[str, List[Dict]] = {}

    def update_context(self, session_id: str, query_id: str, analysis_summary: Dict):
        """Adds the latest analysis to the session history."""
        if session_id not in self.session_history:
            self.session_history[session_id] = []
        
        self.session_history[session_id].append({
            "query_id": query_id,
            "summary": analysis_summary
        })
        self.short_term_memory = analysis_summary # Keep latest in short-term memory

    def recall_related_history(self, session_id: str) -> List[Dict]:
        """Retrieves historical queries for the current session."""
        return self.session_history.get(session_id, [])

    def generate_contextual_response(self, session_id: str, new_text: str) -> Dict:
        """
        Generates a response that references past interactions within the session.
        This is a simplified example.
        """
        history = self.recall_related_history(session_id)
        
        # Simple rule: if history exists, reference it.
        if history:
            last_query = history[-1]
            response_text = f"As we saw with '{last_query['summary']['type']}', {new_text}"
        else:
            response_text = new_text

        return {
            "text": response_text,
            "session_context_id": session_id,
            "related_history": history
        }