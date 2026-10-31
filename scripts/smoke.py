#!/usr/bin/env python3
"""Unauthenticated smoke check over loopback/SSM or HTTPS; does not provision resources."""

import argparse
import json
import urllib.request
import urllib.error
from urllib.parse import urlparse

parser = argparse.ArgumentParser()
parser.add_argument("base_url", nargs="?", default="http://127.0.0.1:8000")
args = parser.parse_args()
url = args.base_url.rstrip("/")
parsed = urlparse(url)
if parsed.scheme != "https" and parsed.hostname not in ("127.0.0.1", "localhost"):
    raise SystemExit("Use HTTPS or an SSM loopback tunnel")
with urllib.request.urlopen(url + "/api/health", timeout=10) as r:
    assert json.load(r)["status"] == "ok"
with urllib.request.urlopen(url + "/", timeout=10) as r:
    html = r.read().decode()
    assert '<div id="root">' in html
import re

asset = re.search(r'src="(/static/assets/[^\"]+\.js)"', html).group(1)
with urllib.request.urlopen(url + asset, timeout=10) as r:
    assert r.status == 200 and "javascript" in r.headers["Content-Type"]
try:
    urllib.request.urlopen(url + "/api/alerts", timeout=10)
except urllib.error.HTTPError as e:
    assert e.code == 401
else:
    raise AssertionError("Unauthenticated alert access was allowed")
print(
    json.dumps(
        {
            "base_url": url,
            "health": "passed",
            "spa": "passed",
            "static_asset": "passed",
            "auth_boundary": "passed",
        }
    )
)
