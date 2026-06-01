"""
Centralized module for handling embeddings and vector operations.
Uses ChromaDB as vector database and OpenAI/Gemini as embedding providers.
"""

import os
from typing import List, Dict, Any, Optional
from dotenv import load_dotenv
import chromadb
from chromadb.config import Settings
from langchain_openai import OpenAIEmbeddings
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_core.documents import Document
import logging

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class EmbeddingsManager:

    def __init__(self, provider: str = "openai", persist_directory: str = "./chroma_db"):

        self.provider = provider.lower()
        self.persist_directory = persist_directory
        self._init_embeddings()
        self._init_chromadb()

    def _init_embeddings(self):
        if self.provider == "openai":
            api_key = os.getenv("OPENAI_API_KEY")
            if not api_key:
                raise ValueError("OPENAI_API_KEY not configured in .env")
            self.embeddings = OpenAIEmbeddings(
                api_key=api_key,
                model="text-embedding-3-small"
            )
            logger.info("OpenAI embeddings initialized")

        elif self.provider == "gemini":
            api_key = os.getenv("GOOGLE_API_KEY")
            if not api_key:
                raise ValueError("GOOGLE_API_KEY not configured in .env")
            self.embeddings = GoogleGenerativeAIEmbeddings(
                google_api_key=api_key,
                model="models/embedding-001"
            )
            logger.info("Gemini embeddings initialized")
        else:
            raise ValueError(f"Provider '{self.provider}' is not supported")

    def _init_chromadb(self):
        # Create directory if it doesn't exist
        os.makedirs(self.persist_directory, exist_ok=True)

        # Configure ChromaDB with persistence
        settings = Settings(
            chroma_db_impl="duckdb+parquet",
            persist_directory=self.persist_directory,
            anonymized_telemetry=False
        )

        self.client = chromadb.Client(settings)
        logger.info(f"ChromaDB initialized in {self.persist_directory}")

    def create_collection(self, collection_name: str, metadata: Optional[Dict[str, str]] = None) -> Any:

        try:
            collection = self.client.create_collection(
                name=collection_name,
                metadata=metadata or {"source": "langchain"}
            )
            logger.info(f"Collection '{collection_name}' created successfully")
            return collection
        except Exception as e:
            logger.error(f"Error creating collection: {e}")
            raise

    def get_or_create_collection(self, collection_name: str) -> Any:


    def add_documents(self, collection_name: str, documents: List[Document], 
                     metadata_field: str = "source") -> Dict[str, Any]:

    def search(self, collection_name: str, query: str, 
               n_results: int = 5) -> List[Dict[str, Any]]:


    def global_search(self, query: str, n_results: int = 10) -> Dict[str, List[Dict[str, Any]]]:


    def delete_collection(self, collection_name: str) -> Dict[str, Any]:


    def list_collections(self) -> List[str]:
