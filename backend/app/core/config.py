from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Smart Cairo Transportation"
    API_PREFIX: str = "/api"
    VERSION: str = "1.0.0"
    ENVIRONMENT: str = "development"

    class config: 
        env_file = ".venv"


setting = Settings()
DATA_DIR = 'app/data'
