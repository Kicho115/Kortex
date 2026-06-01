"""
embeddings.py
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
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.document_loaders import PyPDFLoader, TextLoader
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

        try:
            return self.client.get_or_create_collection(
                name=collection_name,
                metadata={"source": "langchain"}
            )
        except Exception as e:
            logger.error(f"Error getting/creating collection: {e}")
            raise

    def add_documents(self, collection_name: str, documents: List[Document], 
                     metadata_field: str = "source") -> Dict[str, Any]:

        try:
            collection = self.get_or_create_collection(collection_name)

            # Generate embeddings and add documents
            texts = [doc.page_content for doc in documents]
            metadatas = [doc.metadata for doc in documents]
            ids = [f"{doc.metadata.get(metadata_field, 'doc')}_{i}"
                   for i, doc in enumerate(documents)]

            collection.add(
                documents=texts,
                metadatas=metadatas,
                ids=ids
            )

            logger.info(f"{len(documents)} documents added to '{collection_name}'")
            return {"status": "success", "documents_added": len(documents)}

        except Exception as e:
            logger.error(f"Error adding documents: {e}")
            raise

    def search(self, collection_name: str, query: str, 
               n_results: int = 5) -> List[Dict[str, Any]]:

        try:
            collection = self.client.get_collection(name=collection_name)
            results = collection.query(
                query_texts=[query],
                n_results=n_results
            )

            # Format results
            formatted_results = []
            if results and results['documents']:
                for i, doc in enumerate(results['documents'][0]):
                    formatted_results.append({
                        "content": doc,
                        "metadata": results['metadatas'][0][i] if results['metadatas'] else {},
                        "distance": results['distances'][0][i] if results['distances'] else 0
                    })

            logger.info(f"Search found {len(formatted_results)} results in '{collection_name}'")
            return formatted_results

        except Exception as e:
            logger.error(f"Error during search: {e}")
            raise

    def global_search(self, query: str, n_results: int = 10) -> Dict[str, List[Dict[str, Any]]]:

        try:
            all_results = {}
            collections = self.client.list_collections()

            for collection in collections:
                try:
                    results = self.search(collection.name, query, n_results)
                    if results:
                        all_results[collection.name] = results
                except Exception as e:
                    logger.warning(f"Error searching in collection {collection.name}: {e}")

            logger.info(f"Global search found results in {len(all_results)} collections")
            return all_results

        except Exception as e:
            logger.error(f"Error during global search: {e}")
            raise

    def delete_collection(self, collection_name: str) -> Dict[str, Any]:

        try:
            self.client.delete_collection(name=collection_name)
            logger.info(f"Collection '{collection_name}' deleted")
            return {"status": "success", "message": f"Collection '{collection_name}' deleted"}
        except Exception as e:
            logger.error(f"Error deleting collection: {e}")
            raise

    def list_collections(self) -> List[str]:

        try:
            collections = self.client.list_collections()
            collection_names = [col.name for col in collections]
            logger.info(f"Found {len(collection_names)} collections")
            return collection_names
        except Exception as e:
            logger.error(f"Error listing collections: {e}")
            raise
