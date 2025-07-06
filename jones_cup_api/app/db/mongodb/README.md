# MongoDB 模組（中繼封裝階段）

本模組提供 MongoDB 的 Python 連線與操作封裝，支援：

- 連線建立與連線測試
- 資料庫存取
- 支援時區感知（tz-aware）的 Collection 取得

---

## 📦 功能一覽

- `get_mongo_client(uri)`  
  建立 MongoDB 連線並測試是否成功

- `get_mongo_database(client, db_name)`  
  從 MongoClient 取得指定資料庫實例

- `get_tz_aware_collection(db, collection_name, tz_name="Asia/Taipei")`  
  取得具時區感知的 Collection 物件

---

## 🛠 套件安裝

請先安裝以下必要套件：

```bash
pip install pymongo pytz
```

## 🧪 使用範例

```python
from db.mongodb import get_mongo_client, get_mongo_database, get_tz_aware_collection

# 建立連線
client = get_mongo_client("mongodb://localhost:27017")

# 存取資料庫
db = get_mongo_database(client, "my_database")

# 存取 tz-aware 的 collection（預設 Asia/Taipei）
collection = get_tz_aware_collection(db, "users")

# 查詢範例
user = collection.find_one({"name": "Alice"})
print(user)
```