# /aiml_engine/core/agent.py
import google.generativeai as genai
import os
from typing import Dict, List, Any
from dotenv import load_dotenv

load_dotenv()

# --- SECURITY BEST PRACTICE: Get API key from environment variables ---
# You should set this in your terminal before running the server:
# export GOOGLE_API_KEY="your_api_key_here"
#
# If the environment variable is not found, it will raise an error.
try:
    genai.configure(api_key=os.environ["GOOGLE_API_KEY"])
except KeyError:
    raise EnvironmentError(
        "GOOGLE_API_KEY environment variable not found. "
        "Please set it to your Google AI API key."
    )

class Agent:
    """
    The production-ready, contextually aware AI agent brain.
    It uses a Generative LLM to understand and respond to user queries.
    """
    def __init__(self, system_prompt: str):
        # We use a system prompt to define the AI's persona and rules.
        self.model = genai.GenerativeModel('gemini-2.5-pro', system_instruction=system_prompt)
        # We start a chat session to maintain context within the model itself
        self.chat = self.model.start_chat(history=[])

    def generate_response(self, user_query: str, data_context: Dict) -> str:
        """
        Generates an intelligent response using the user's query and the
        current financial data context.

        Args:
            user_query (str): The user's natural language question.
            data_context (Dict): The JSON data from the main financial analysis.

        Returns:
            A string containing the AI's generated response.
        """
        # We construct a detailed prompt for the LLM, giving it all the information it needs.
        prompt = f"""
        User Query: "{user_query}"

        Here is the relevant financial data context for the query:
        
        Key KPIs: {data_context.get('kpis')}
        Forecast Summary: {data_context.get('forecast_chart')}
        Anomalies Detected: {data_context.get('anomalies_table')}
        Key Profit Drivers: {data_context.get('profit_drivers')}
        Narrative Summary: {data_context.get('narratives')}

        Based on the User Query and the provided data context, generate a concise, professional, and helpful response.
        
        --- FINAL INSTRUCTION ---
        If the user asks for a recommendation, you are allowed to synthesize a new, actionable recommendation based on the KPIs and Profit Drivers, even if it is not listed in the "Narrative Summary" recommendations.
        --- END OF INSTRUCTION ---
        
        If the query cannot be answered by the data, state that clearly.
        Do not make up information. Base your answer strictly on the provided context.
        """

        try:
            # Send the prompt to the model and get the response
            response = self.chat.send_message(prompt)
            return response.text
        except Exception as e:
            print(f"Error during LLM call: {e}")
            return "I'm sorry, I encountered an error trying to process that request."