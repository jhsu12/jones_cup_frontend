import os

API_V1_STR = "/api/v1"

bucket_name = "jones_cup"
women_team_info = {
    11374: {
        "name": "ROC-A",
        "logoUrl": "https://storage.googleapis.com/p-xc-m/event/417/squads/cdd5dbcf6e4e40d3c6fa1dc556ec4b78e4cabfbb4dfddd80a05990bdaea9b42b",
    },
    11375: {
        "name": "ROC-WUG",
        "logoUrl": "https://storage.googleapis.com/p-xc-m/event/417/squads/b019ed4e5a15db79c49f8d623fb12ad14693377560235f54366a214ef16ec7b5",
    },
    11376: {
        "name": "Japan",
        "logoUrl": "https://storage.googleapis.com/p-xc-m/event/417/squads/9e78de903e7fdb8b2458011575cdd087b600fcac61ac94dbca3642f7b4f7f8e9",
    },
    11377: {
        "name": "South Korea",
        "logoUrl": "https://storage.googleapis.com/p-xc-m/event/417/squads/d8c35320ae26ede7e2650a0796fff6d6953f9ade0248f611c83026ffc279a25d",
    },
    11378: {
        "name": "Philippines",
        "logoUrl": "https://storage.googleapis.com/p-xc-m/event/417/squads/59445c05ff185a165e70069300f442992b97e84dc2f0ecb3ba1e99c186be8640",
    },
    11379: {
        "name": "Thailand",
        "logoUrl": "https://storage.googleapis.com/p-xc-m/event/417/squads/66c8691d2debaaeabd22fe90dd73ca5da9033778ad0e98048e366118bae57ba2",
    },
}


class Config:
    DEBUG = False
    TESTING = False


class DevelopmentConfig(Config):
    DEBUG = True


class TestingConfig(Config):
    DEBUG = True
    TESTING = True


def get_config():
    env = os.getenv("ENV", "dev")
    if env == "prod":
        return Config()
    elif env == "test":
        return TestingConfig()
    else:
        return DevelopmentConfig()
