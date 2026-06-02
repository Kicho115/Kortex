"""
embeddings.py
Centralized module for handling embeddings and vector operations.
Uses ChromaDB as vector database and OpenAI/Gemini as embedding providers.
"""

import os
from typing import List, Dict, Any, Optional
from dotenv import load_dotenv
import chromadb
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
                model="text-embedding-3-small"  # Faster and more economical
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

        # Initialize ChromaDB PersistentClient (new API)
        self.client = chromadb.PersistentClient(path=self.persist_directory)
        logger.info(f"ChromaDB initialized at {self.persist_directory}")

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

class DocumentProcessor:

    def __init__(self, chunk_size: int = 1000, chunk_overlap: int = 200):

        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap,
            separators=["\n\n", "\n", " ", ""]
        )
        logger.info(f"Document processor initialized with chunk_size={chunk_size}, chunk_overlap={chunk_overlap}")

    def load_pdf(self, file_path: str) -> List[Document]:

        try:
            loader = PyPDFLoader(file_path)
            documents = loader.load()
            chunks = self.text_splitter.split_documents(documents)
            logger.info(f"PDF '{file_path}' loaded: {len(chunks)} chunks")
            return chunks
        except Exception as e:
            logger.error(f"Error loading PDF: {e}")
            raise

    def load_text(self, file_path: str) -> List[Document]:

        try:
            loader = TextLoader(file_path)
            documents = loader.load()
            chunks = self.text_splitter.split_documents(documents)
            logger.info(f"Text file '{file_path}' loaded: {len(chunks)} chunks")
            return chunks
        except Exception as e:
            logger.error(f"Error loading text file: {e}")
            raise

    def load_document(self, file_path: str) -> List[Document]:

        if file_path.endswith('.pdf'):
            return self.load_pdf(file_path)
        elif file_path.endswith('.txt'):
            return self.load_text(file_path)
        else:
            raise ValueError(f"File type not supported: {file_path}")


class MessageStore:

    def __init__(self, embeddings_manager: EmbeddingsManager = None, provider: str = "openai"):

        if embeddings_manager:
            self.embeddings_manager = embeddings_manager
        else:
            self.embeddings_manager = EmbeddingsManager(provider=provider)
        
        logger.info("MessageStore initialized")

    def add_message(self, chat_id: int, sender_id: int, sender_name: str, 
                   content: str, message_id: int) -> Dict[str, Any]:

        try:
            # Create or get collection for this chat room
            collection_name = f"chat_{chat_id}"
            collection = self.embeddings_manager.get_or_create_collection(collection_name)

            # Create document for this message
            metadata = {
                "chat_id": str(chat_id),
                "sender_id": str(sender_id),
                "sender_name": sender_name,
                "message_id": str(message_id)
            }

            # Add message to collection with embeddings
            collection.add(
                documents=[content],
                metadatas=[metadata],
                ids=[f"message_{message_id}"]
            )

            logger.info(f"Message {message_id} from user {sender_name} added to chat {chat_id}")
            return {"status": "success", "message_id": message_id}

        except Exception as e:
            logger.error(f"Error adding message to vector store: {e}")
            raise

    def search_in_chat(self, chat_id: int, query: str, n_results: int = 5) -> List[Dict[str, Any]]:

        try:
            collection_name = f"chat_{chat_id}"
            results = self.embeddings_manager.search(collection_name, query, n_results)
            
            logger.info(f"Found {len(results)} messages in chat {chat_id} matching query")
            return results

        except Exception as e:
            logger.error(f"Error searching messages in chat {chat_id}: {e}")
            raise

    def search_all_chats(self, query: str, n_results: int = 10) -> Dict[int, List[Dict[str, Any]]]:

        try:
            all_results = {}
            collections = self.embeddings_manager.list_collections()

            # Filter only collections that are chat rooms
            chat_collections = [c for c in collections if c.startswith("chat_")]

            for collection_name in chat_collections:
                try:
                    chat_id = int(collection_name.replace("chat_", ""))
                    results = self.search_in_chat(chat_id, query, n_results)
                    if results:
                        all_results[chat_id] = results
                except (ValueError, Exception) as e:
                    logger.warning(f"Error searching in {collection_name}: {e}")

            logger.info(f"Global search found results in {len(all_results)} chat rooms")
            return all_results

        except Exception as e:
            logger.error(f"Error during global message search: {e}")
            raise

    def get_chat_messages_context(self, chat_id: int, limit: int = 20) -> str:

        try:
            collection_name = f"chat_{chat_id}"
            collection = self.embeddings_manager.client.get_collection(name=collection_name)
            
            # Get all messages with their metadata (limited to recent ones)
            results = collection.get(limit=limit, order_by="data")
            
            context_parts = []
            if results and results['documents']:
                for i, doc in enumerate(results['documents']):
                    metadata = results['metadatas'][i] if results['metadatas'] else {}
                    sender_name = metadata.get('sender_name', 'Unknown')
                    context_parts.append(f"{sender_name}: {doc}")
            
            context = "\n".join(context_parts)
            logger.info(f"Retrieved context from chat {chat_id} with {len(context_parts)} messages")
            return context

        except Exception as e:
            logger.error(f"Error getting chat context: {e}")
            return ""

    def delete_message(self, chat_id: int, message_id: int) -> Dict[str, Any]:

        try:
            collection_name = f"chat_{chat_id}"
            collection = self.embeddings_manager.client.get_collection(name=collection_name)
            collection.delete(ids=[f"message_{message_id}"])

            logger.info(f"Message {message_id} deleted from chat {chat_id}")
            return {"status": "success", "message": f"Message {message_id} deleted"}

        except Exception as e:
            logger.error(f"Error deleting message: {e}")
            raise
