import logging

logger = logging.getLogger("time_manager")
logger.setLevel(logging.INFO)

if not logger.handlers:
    formatter = logging.Formatter(
        "%(asctime)s - %(levelname)s - %(name)s - %(message)s"
    )

    stream_handler = logging.StreamHandler()
    stream_handler.setFormatter(formatter)
    logger.addHandler(stream_handler)

    file_handler = logging.FileHandler("log.txt")
    file_handler.setFormatter(formatter)
    logger.addHandler(file_handler)

logger.propagate = False
