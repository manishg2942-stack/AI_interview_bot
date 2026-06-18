import os
from pathlib import Path

from config.envpath import envpath


def google_credentials_kwargs() -> dict[str, str]:
    credentials_file = os.getenv("GOOGLE_APPLICATION_CREDENTIALS") or os.getenv(
        "GOOGLE_CREDENTIALS_FILE"
    )
    if not credentials_file:
        return {}

    credentials_path = Path(credentials_file).expanduser()
    if not credentials_path.is_absolute():
        credentials_path = Path(envpath).parent / credentials_path
    credentials_path = credentials_path.resolve()

    if not credentials_path.is_file():
        raise RuntimeError(
            "Google credentials file was configured but not found: "
            f"{credentials_path}"
        )

    os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = str(credentials_path)
    return {"credentials_file": str(credentials_path)}
