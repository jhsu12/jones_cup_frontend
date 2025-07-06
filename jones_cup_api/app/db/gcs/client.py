import json

from google.cloud import storage


def upload_json(bucket_name: str, destination_blob_name: str, data: dict) -> None:
    """Uploads a dictionary to a bucket as a JSON string."""
    storage_client = storage.Client()
    bucket = storage_client.bucket(bucket_name)
    blob = bucket.blob(destination_blob_name)
    blob.upload_from_string(json.dumps(data, indent=4), content_type="application/json")
    print(f"JSON file {destination_blob_name} uploaded to {bucket_name}.")


def download_json(bucket_name: str, source_blob_name: str) -> dict | None:
    """Downloads a JSON file from the bucket and returns it as a dictionary."""
    storage_client = storage.Client()
    bucket = storage_client.bucket(bucket_name)
    blob = bucket.blob(source_blob_name)
    try:
        data = blob.download_as_string()
        return json.loads(data)
    except Exception as e:
        print(f"Failed to download {source_blob_name}: {e}")
        return None


def list_blobs(bucket_name: str, prefix: str) -> list[str]:
    """Lists all the blobs in the bucket that begin with the prefix."""
    storage_client = storage.Client()
    blobs = storage_client.list_blobs(bucket_name, prefix=prefix)
    return [blob.name for blob in blobs]
