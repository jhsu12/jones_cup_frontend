from typing import Optional

from google.cloud import firestore


def get_firestore_client(
    credentials_path: Optional[str] = None, project_id: Optional[str] = None
) -> firestore.Client:
    """
    初始化並取得 Firestore Client 實例。

    若提供 credentials_path 與 project_id，會使用服務帳戶認證登入。
    否則使用環境預設認證。
    """
    if credentials_path and project_id:
        from google.oauth2 import service_account

        credentials = service_account.Credentials.from_service_account_file(
            credentials_path
        )
        return firestore.Client(project=project_id, credentials=credentials)

    return firestore.Client()
