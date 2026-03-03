import os

def read_secret_file(path: str) -> str:
    if not path:
        raise ValueError('secret file path is empty')
    p = os.path.expanduser(path)
    with open(p, 'r', encoding='utf-8') as f:
        return f.read().strip()
