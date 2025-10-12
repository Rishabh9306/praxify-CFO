import pandas as pd
import os
from aiml_engine.core.data_ingestion import DataIngestion

# Create a dummy CSV for testing
DUMMY_CSV_CONTENT = "Date,Sales,Costs\n2024-01-01,1000,600\n2024-02-01,1100,650"
DUMMY_CSV_PATH = "dummy_test_data.csv"

def setup_module(module):
    """Create the dummy csv file before tests run."""
    with open(DUMMY_CSV_PATH, "w") as f:
        f.write(DUMMY_CSV_CONTENT)

def teardown_module(module):
    """Remove the dummy csv file after tests run."""
    os.remove(DUMMY_CSV_PATH)

def test_ingest_and_normalize_columns():
    """Tests if column renaming and normalization works as expected."""
    ingestion = DataIngestion()
    normalized_df, header_mappings = ingestion.ingest_and_normalize(DUMMY_CSV_PATH)

    assert 'revenue' in normalized_df.columns
    assert 'expenses' in normalized_df.columns
    assert 'date' in normalized_df.columns
    assert 'Sales' not in normalized_df.columns
    assert header_mappings['Sales'] == 'revenue'
    assert header_mappings['Costs'] == 'expenses'

def test_date_parsing():
    """Tests if the date column is correctly parsed to datetime objects."""
    ingestion = DataIngestion()
    normalized_df, _ = ingestion.ingest_and_normalize(DUMMY_CSV_PATH)
    
    assert pd.api.types.is_datetime64_any_dtype(normalized_df['date'])