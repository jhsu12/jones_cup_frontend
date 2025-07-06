# BigQuery 模組

提供 Google BigQuery 的用戶端初始化工具。  
未來可自由擴充常用操作。

## 📦 目前功能

- `get_bigquery_client()`：建立 BigQuery 的 Python Client 實例

## 🛠 安裝套件

```bash
pip install google-cloud-bigquery
# 如果使用服務帳戶金鑰登入
pip install google-auth
```

## 🧪 使用範例

```python
from db.bigquery import get_bigquery_client

client = get_bigquery_client()
```