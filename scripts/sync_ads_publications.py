#!/usr/bin/env python3
"""Fetch each TSST member's three most-cited refereed papers from NASA ADS."""

import json
import os
import sys
import time
from datetime import datetime, timezone
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
AUTHORS_PATH = ROOT / "data" / "team-authors.json"
OUTPUT_PATH = ROOT / "data" / "publications.json"
ADS_ENDPOINT = "https://api.adsabs.harvard.edu/v1/search/query"


def fetch_papers(token, query):
    parameters = urlencode({
        "q": query,
        "fl": "bibcode,title,year,pub,citation_count,author",
        "rows": 3,
        "sort": "citation_count desc",
    })
    request = Request(
        f"{ADS_ENDPOINT}?{parameters}",
        headers={"Authorization": f"Bearer {token}", "User-Agent": "TSST-publications/1.0"},
    )
    with urlopen(request, timeout=30) as response:
        payload = json.load(response)

    papers = []
    for document in payload.get("response", {}).get("docs", []):
        title = document.get("title", ["Untitled"])
        papers.append({
            "bibcode": document["bibcode"],
            "title": title[0] if isinstance(title, list) else title,
            "year": document.get("year", "—"),
            "publication": document.get("pub", ""),
            "citation_count": document.get("citation_count", 0),
            "url": f"https://ui.adsabs.harvard.edu/abs/{document['bibcode']}/abstract",
        })
    return papers


def main():
    token = os.environ.get("ADS_API_TOKEN")
    if not token:
        print("ADS_API_TOKEN is required", file=sys.stderr)
        return 1

    members = json.loads(AUTHORS_PATH.read_text(encoding="utf-8"))
    output = []
    for index, member in enumerate(members):
        try:
            papers = fetch_papers(token, member["query"])
        except (HTTPError, URLError, TimeoutError) as error:
            print(f"ADS request failed for {member['name']}: {error}", file=sys.stderr)
            return 1
        output.append({
            "name": member["name"],
            "group": member["group"],
            "photo": member["photo"],
            "papers": papers,
        })
        if index < len(members) - 1:
            time.sleep(0.25)

    document = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "source": "NASA ADS",
        "members": output,
    }
    OUTPUT_PATH.write_text(json.dumps(document, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"Updated {OUTPUT_PATH} for {len(output)} team members")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
