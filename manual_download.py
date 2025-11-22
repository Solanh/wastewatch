import json
import os
import re
import urllib.parse

import requests

META_PATH = "waste-watch-server\datasets\meta.json"
OUT_DIR = "dataset-ninja"  # same as your original script

os.makedirs(OUT_DIR, exist_ok=True)


def collect_urls(obj, urls):
    """Recursively collect all http(s) URLs from a nested JSON structure."""
    if isinstance(obj, dict):
        for v in obj.values():
            collect_urls(v, urls)
    elif isinstance(obj, list):
        for v in obj:
            collect_urls(v, urls)
    elif isinstance(obj, str):
        if obj.startswith("http://") or obj.startswith("https://"):
            urls.add(obj)


def infer_filename(url: str) -> str:
    """Guess a reasonable filename from a URL."""
    parsed = urllib.parse.urlparse(url)
    name = os.path.basename(parsed.path)

    if not name:
        # fall back to some hash of the URL
        name = re.sub(r"[^a-zA-Z0-9_.-]", "_", url)

    return name


def download_file(url: str, out_dir: str):
    filename = infer_filename(url)
    out_path = os.path.join(out_dir, filename)

    if os.path.exists(out_path):
        print(f"[skip] {filename} already exists")
        return

    print(f"[downloading] {url}")
    resp = requests.get(url, stream=True)
    resp.raise_for_status()

    total = int(resp.headers.get("content-length", 0))
    downloaded = 0
    chunk_size = 8192

    with open(out_path, "wb") as f:
        for chunk in resp.iter_content(chunk_size=chunk_size):
            if not chunk:
                continue
            f.write(chunk)
            downloaded += len(chunk)
            if total:
                pct = downloaded * 100 // total
                print(f"\r  {filename}: {pct}%", end="", flush=True)

    print(f"\r  {filename}: done ({downloaded/1_000_000:.2f} MB)")


def main():
    with open(META_PATH, "r", encoding="utf-8") as f:
        meta = json.load(f)

    urls = set()
    collect_urls(meta, urls)

    # keep only likely archive files
    archive_exts = (".tar", ".tar.gz", ".tgz", ".zip")
    archive_urls = [
        u for u in urls
        if any(u.lower().endswith(ext) for ext in archive_exts)
    ]

    if not archive_urls:
        print("No archive URLs found in meta.json. You may need to inspect it manually.")
        print("Look for any 'url' fields that point to .tar/.zip files.")
        return

    print("Found archive URLs:")
    for u in archive_urls:
        print(" -", u)

    for u in archive_urls:
        download_file(u, OUT_DIR)


if __name__ == "__main__":
    main()
