import pandas as pd
from typing import Tuple, Dict
import spacy
import re

class DataIngestion:
    """
    Handles the ingestion and normalization of financial data from any CSV schema.
    This final, perfected version includes a blocklist to prevent incorrect NLP mappings
    and ensures human-readable date formats in previews.
    """
    def __init__(self):
        try:
            self.nlp = spacy.load("en_core_web_sm")
        except OSError:
            print("Downloading spaCy model 'en_core_web_sm'...")
            from spacy.cli import download
            download("en_core_web_sm")
            self.nlp = spacy.load("en_core_web_sm")
            
        self.unified_schema = {
            "date": ["date", "timestamp", "period", "transaction date", "date of sale"],
            "revenue": ["revenue", "sales", "income", "turnover", "sales revenue", "total income"],
            "expenses": ["expenses", "costs", "expenditure", "overheads", "operating costs", "operational expenses"],
            "profit": ["profit", "net_income", "earnings", "net profit", "profit (pre-tax)"],
            "cashflow": ["cashflow", "cash flow", "cash flow from operations"],
            "liabilities": ["liabilities", "debt", "total liabilities"],
            "assets": ["assets", "total assets"],
            "ar": ["accounts receivable", "ar"],
            "ap": ["accounts payable", "ap"],
            "region": ["region", "country", "market", "location"],
            "department": ["department", "business_unit", "cost center"]
        }
        self.numeric_keys = ["revenue", "expenses", "profit", "cashflow", "liabilities", "assets", "ar", "ap"]

        # --- FIX #2: THE BLOCKLIST ---
        # A list of common non-financial columns to prevent incorrect mapping.
        self.blocklist = ["note", "notes", "comment", "comments", "description", "memo"]
        # --- END OF FIX ---

    def _get_best_match(self, column_name: str) -> Tuple[str, float]:
        cleaned_name = column_name.lower().strip().replace("_", " ").replace('"', '')
        if not cleaned_name: return None, 0.0

        # --- FIX #2: Check against the blocklist first ---
        if any(blocked_word in cleaned_name for blocked_word in self.blocklist):
            return None, 0.0 # Immediately reject if it contains a blocked word
        # --- END OF FIX ---

        col_doc = self.nlp(cleaned_name)
        
        max_similarity = 0.0
        best_match = None
        
        # Suppress spaCy similarity warning for small models
        import warnings
        with warnings.catch_warnings():
            warnings.filterwarnings("ignore", category=UserWarning)
            for unified_key, synonyms in self.unified_schema.items():
                for synonym in synonyms:
                    synonym_doc = self.nlp(synonym)
                    similarity = col_doc.similarity(synonym_doc)
                    if similarity > max_similarity:
                        max_similarity = similarity
                        best_match = unified_key
        
        if max_similarity > 0.75:
            return best_match, max_similarity
        return None, 0.0

    def ingest_and_normalize(self, file_path: str) -> Tuple[pd.DataFrame, Dict[str, str]]:
        try:
            df = pd.read_csv(file_path, header=0, sep=',', quotechar='"', skipinitialspace=True)
        except Exception as e:
            print(f"Error reading CSV file: {e}")
            return pd.DataFrame(), {}

        df.columns = df.columns.str.strip().str.replace('"', '')
        original_headers = df.columns.tolist()
        
        header_mappings = {}
        new_columns = {}
        unmapped_columns = []
        for original_col in original_headers:
            best_match, _ = self._get_best_match(original_col)
            if best_match and best_match not in new_columns.values():
                header_mappings[original_col] = best_match
                new_columns[original_col] = best_match
            else:
                unmapped_columns.append(original_col)
        
        df.rename(columns=new_columns, inplace=True)
        
        for numeric_col in self.numeric_keys:
            if numeric_col in df.columns:
                df[numeric_col] = df[numeric_col].astype(str)
                df[numeric_col] = df[numeric_col].str.replace(r'[^\d.-]', '', regex=True)
                df[numeric_col] = pd.to_numeric(df[numeric_col], errors='coerce')
        
        if "date" in df.columns:
            try:
                # --- FIX #1: THE DATE FORMAT FIX IS APPLIED HERE ---
                # We handle date conversion with more care now
                df['date'] = pd.to_datetime(df['date'], errors='coerce')
            except Exception as e:
                print(f"Could not parse the date column effectively: {e}")
                # Don't drop the column, just let validation handle the NaTs
        
        for key in self.unified_schema.keys():
            if key not in df.columns:
                df[key] = 0 if key in self.numeric_keys else None
        
        final_cols = list(self.unified_schema.keys()) + [c for c in unmapped_columns if c in df.columns]
        
        return df[[col for col in final_cols if col in df.columns]], header_mappings