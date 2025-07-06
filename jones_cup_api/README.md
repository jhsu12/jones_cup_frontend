# template-fast-api-python

這是 Python FastAPI 的開發範本。

## Poetry 安裝與使用

本專案使用 [Poetry](https://python-poetry.org/) 作為相依管理與封裝工具。

### 安裝 Poetry（官方推薦）

```bash
curl -sSL https://install.python-poetry.org | python3 -
```

安裝完成後，請確保 poetry 已加入 PATH：

```bash
poetry --version
```

安裝相依套件

```bash
poetry install
```

新增套件
```bash
poetry add <套件名稱>
```

## Unit Test

執行測試：

```bash
pytest
```

## Deploy

- Prod 環境：推送 v* 標籤時觸發（例：v1.0.0）

- Stage 環境：推送 s* 標籤時觸發（例：s1.0.0）

## 本機運行
啟動本機開發伺服器：

```bash
# --reload 選項會在原始碼變更時自動重新啟動伺服器，方便開發。
poetry run uvicorn app.main:app --reload
```

啟動後可透過以下網址存取 API 文件：

[http://localhost:8000/docs](http://localhost:8000/docs)
