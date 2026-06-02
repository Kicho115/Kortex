import os
import asyncio
from typing import Any, Self

import chromadb
from langchain_community.embeddings import HuggingFaceEmbeddings

# Default configs
DEFAULT_PROVIDER = "local"
DEFAULT_PERSIST_DIRECTORY = "./chroma_db"
DEFAULT_EMBEDDING_MODEL = "all-MiniLM-L6-v2"


def resolve_config(config: dict[str, Any] | None = None) -> dict[str, Any]:
    config = config or {}

    return {
        "provider": (config.get("provider") or DEFAULT_PROVIDER).lower(),
        "persist_directory": config.get("persist_directory") or DEFAULT_PERSIST_DIRECTORY,
        "embedding_model": config.get("embedding_model") or DEFAULT_EMBEDDING_MODEL,
    }


class EmbeddingsManager:
    def __init__(
            self,
            client: chromadb.PersistentClient,
            embeddings: Any,
            config: dict[str, Any] | None = None,
    ) -> None:
        self.client = client
        self.embeddings = embeddings
        self.config = resolve_config(config)

    def get_or_create_collection(self, collection_name: str) -> Any:
        return self.client.get_or_create_collection(
            name=collection_name,
            metadata={"source": "chat_history"}
        )

    def search(self, collection_name: str, query: str, n_results: int = 5) -> list[dict[str, Any]]:
        collection = self.client.get_collection(name=collection_name)
        results = collection.query(
            query_texts=[query],
            n_results=n_results
        )

        formatted_results = []
        if results and results.get('documents'):
            for i, doc in enumerate(results['documents'][0]):
                formatted_results.append({
                    "content": doc,
                    "metadata": results['metadatas'][0][i] if results.get('metadatas') else {},
                    "distance": results['distances'][0][i] if results.get('distances') else 0
                })
        return formatted_results

    def list_collections(self) -> list[str]:
        return [col.name for col in self.client.list_collections()]

    @classmethod
    def from_config(cls, config: dict[str, Any] | None = None) -> Self:
        resolved_config = resolve_config(config)

        persist_dir = resolved_config["persist_directory"]
        os.makedirs(persist_dir, exist_ok=True)

        print("Initializing ChromaDB...")
        client = chromadb.PersistentClient(path=persist_dir)
        print(f"  Connected to database at {persist_dir}")

        print(f"Initializing Local Embeddings ({resolved_config['embedding_model']})...")
        embeddings = HuggingFaceEmbeddings(model_name=resolved_config["embedding_model"])

        print("Embeddings Manager Ready!\n")
        return cls(client, embeddings, resolved_config)


class MessageStore:

    def __init__(self, manager: EmbeddingsManager | None = None, provider: str = "local") -> None:
        self.manager = manager or EmbeddingsManager.from_config({"provider": provider})

    async def add_message(
            self,
            chat_id: int,
            sender_id: int,
            sender_name: str,
            content: str,
            message_id: int
    ) -> dict[str, Any]:

        def _add():
            collection_name = f"chat_{chat_id}"
            collection = self.manager.get_or_create_collection(collection_name)

            metadata = {
                "chat_id": str(chat_id),
                "sender_id": str(sender_id),
                "sender_name": sender_name,
                "message_id": str(message_id)
            }

            collection.add(
                documents=[content],
                metadatas=[metadata],
                ids=[f"message_{message_id}"]
            )
            return {"status": "success", "message_id": message_id}

        return await asyncio.to_thread(_add)

    def search_in_chat(self, chat_id: int, query: str, n_results: int = 5) -> list[dict[str, Any]]:
        collection_name = f"chat_{chat_id}"
        return self.manager.search(collection_name, query, n_results)

    def search_all_chats(self, query: str, n_results: int = 10) -> dict[int, list[dict[str, Any]]]:
        all_results = {}
        collections = self.manager.list_collections()

        chat_collections = [c for c in collections if c.startswith("chat_")]

        for collection_name in chat_collections:
            chat_id = int(collection_name.replace("chat_", ""))
            # We can use the manager's search directly instead of a redundant wrapper
            results = self.manager.search(collection_name, query, n_results)
            if results:
                all_results[chat_id] = results

        return all_results