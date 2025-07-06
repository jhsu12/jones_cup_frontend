# Firestore 模組

簡易封裝 Google Firestore 資料存取功能。
未來可視使用情況將其抽出成獨立模組或套件（支援 pip 安裝）。

## 📦 目前功能

- `get_firestore_client`：取得 Firestore 連線物件
- `FirestoreDB`：文件 CRUD、條件查詢等操作

## 🛠 安裝套件

```bash
pip install google-cloud-firestore
# 如果使用服務帳戶金鑰登入
pip install google-auth
```

## 🧪 使用範例

```python
from db.firebase import FirestoreDB

# client
db = FirestoreDB()
db = FirestoreDB(
    credentials_path="path/to/service-account.json",
    project_id="your-project-id"
)

# 查詢範例
user = db.get_document("users", "user_001")
print(user)
```
