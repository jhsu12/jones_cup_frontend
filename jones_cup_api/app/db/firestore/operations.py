from typing import Any, List, Optional

from .client import get_firestore_client


class FirestoreDB:
    def __init__(
        self, credentials_path: Optional[str] = None, project_id: Optional[str] = None
    ):
        """
        初始化 FirestoreDB 實例，建立與 Firestore 的連線。
        """
        self.db = get_firestore_client(credentials_path, project_id)

    def get_document(self, collection: str, doc_id: str) -> Optional[dict]:
        """
        取得指定集合中指定 ID 的文件內容。
        """
        doc = self.db.collection(collection).document(doc_id).get()
        return doc.to_dict() if doc.exists else None

    def set_document(self, collection: str, doc_id: str, data: dict):
        """
        新增或覆蓋指定文件的內容。
        """
        self.db.collection(collection).document(doc_id).set(data)

    def update_document(self, collection: str, doc_id: str, updates: dict):
        """
        更新指定文件的部分欄位資料。

        參數:
            updates (dict): 欲更新的欄位與值。
        """
        self.db.collection(collection).document(doc_id).update(updates)

    def delete_document(self, collection: str, doc_id: str):
        """
        刪除指定集合中的文件。
        """
        self.db.collection(collection).document(doc_id).delete()

    def document_exists(self, collection: str, doc_id: str) -> bool:
        """
        檢查指定文件是否存在。
        """
        doc = self.db.collection(collection).document(doc_id).get()
        return doc.exists

    def get_all_documents(self, collection: str) -> List[dict]:
        """
        取得指定集合中所有文件資料。

        回傳:
            List[dict]: 所有文件的內容清單。
        """
        docs = self.db.collection(collection).stream()
        return [doc.to_dict() for doc in docs]

    def query_documents(
        self, collection: str, field: str, operator: str, value: Any
    ) -> List[dict]:
        """
        查詢集合中符合條件的文件。

        參數:
            field (str): 欲比對的欄位名稱。
            operator (str): 運算子（例如 "==", ">", "<=", 等）。
            value (Any): 比對值。

        回傳:
            List[dict]: 符合條件的文件內容。
        """
        query = self.db.collection(collection).where(field, operator, value).stream()
        return [doc.to_dict() for doc in query]
