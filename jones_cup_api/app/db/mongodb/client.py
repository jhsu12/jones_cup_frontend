from typing import Optional

import pytz
from bson.codec_options import CodecOptions
from pymongo import MongoClient
from pymongo.collection import Collection
from pymongo.database import Database


def get_mongo_client(uri: str) -> MongoClient:
    """
    建立 MongoClient 並進行連線測試。

    參數:
        uri (str): MongoDB 的連線字串，例如：
            mongodb://localhost:27017
            mongodb+srv://user:pass@cluster.mongodb.net/dbname

    回傳:
        MongoClient 實例
    """
    client = MongoClient(uri)
    try:
        client.admin.command("ping")
        print("✅ 成功連線 MongoDB")
    except Exception as e:
        print("❌ MongoDB 連線錯誤：", e)
        raise
    return client


def get_mongo_database(client: MongoClient, db_name: str) -> Database:
    """
    從 MongoClient 取得指定的資料庫。

    參數:
        client (MongoClient): 已建立的 Mongo 用戶端
        db_name (str): 資料庫名稱

    回傳:
        Database 實例
    """
    return client[db_name]


def get_tz_aware_collection(
    db: Database, name: str, tz_name: str = "Asia/Taipei"
) -> Collection:
    """
    取得具時區感知的 Collection 實例。

    參數:
        db (Database): Mongo 資料庫實例
        name (str): Collection 名稱
        tz_name (str): 時區名稱（預設 Asia/Taipei）

    回傳:
        Collection（含 tz-aware 設定）
    """
    tzinfo = pytz.timezone(tz_name)
    codec = CodecOptions(tz_aware=True, tzinfo=tzinfo)
    return db.get_collection(name, codec_options=codec)
