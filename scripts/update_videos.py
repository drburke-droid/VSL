#!/usr/bin/env python3
"""Refresh vsl-retro/tv/videos.json, the tape list for the waiting-room TV (vsl-retro/tv/).

Reads the channel's public YouTube feed (no API key), applies vsl-retro/tv/config.json, and writes
the list the page loads. Run by .github/workflows/pages.yml before every deploy and on a timer;
run it by hand with:  python3 scripts/update_videos.py

The feed only carries the 15 newest uploads, so tapes already on the live shelf are kept until
"max" pushes them off, they are listed under "hidden", or YouTube says they are gone.
If YouTube cannot be reached, the list that is already live is kept. Standard library only.
"""
import json
import re
import sys
import time
import urllib.error
import urllib.request
import xml.etree.ElementTree as ET
from pathlib import Path

TV = Path(__file__).resolve().parent.parent / "vsl-retro" / "tv"
CONFIG = TV / "config.json"
OUT = TV / "videos.json"
NS = {
    "a": "http://www.w3.org/2005/Atom",
    "yt": "http://www.youtube.com/xml/schemas/2015",
    "media": "http://search.yahoo.com/mrss/",
}
UA = {"User-Agent": "Mozilla/5.0 (compatible; tv-shelf-updater)"}
ID = re.compile(r"^[A-Za-z0-9_-]{11}$")


def get(url, tries=3):
    last = None
    for n in range(tries):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=20) as r:
                return r.read()
        except urllib.error.HTTPError as e:
            last = e
            if e.code in (400, 401, 403, 404):
                break
        except Exception as e:  # timeouts, resets
            last = e
        time.sleep(2 * (n + 1))
    raise last


def feed(cfg):
    """The newest uploads (or a playlist's videos), newest first."""
    if cfg.get("playlistId"):
        url = "https://www.youtube.com/feeds/videos.xml?playlist_id=" + cfg["playlistId"]
    else:
        url = "https://www.youtube.com/feeds/videos.xml?channel_id=" + cfg["channelId"]
    root = ET.fromstring(get(url))
    out = []
    for e in root.findall("a:entry", NS):
        vid = (e.findtext("yt:videoId", "", NS) or "").strip()
        if not ID.match(vid):
            continue
        link = e.find("a:link[@rel='alternate']", NS)
        href = link.get("href", "") if link is not None else ""
        stats = e.find("media:group/media:community/media:statistics", NS)
        out.append({
            "id": vid,
            "title": re.sub(r"\s*#shorts\b", "", (e.findtext("a:title", "", NS) or "").strip(), flags=re.I),
            "date": (e.findtext("a:published", "", NS) or "")[:10],
            "views": int(stats.get("views", 0)) if stats is not None else 0,
            "short": "/shorts/" in href,
        })
    return out


def previous(cfg):
    """The list that is live now, else the copy in the repo."""
    if cfg.get("liveUrl"):
        try:
            return json.loads(get(cfg["liveUrl"], tries=2))["videos"]
        except Exception as e:
            print("live list not readable (%s); using the repo copy" % e)
    try:
        return json.loads(OUT.read_text(encoding="utf-8"))["videos"]
    except Exception:
        return []


def still_up(vid):
    """False only when YouTube says the video is gone or private; True when unsure."""
    try:
        get("https://www.youtube.com/oembed?format=json&url=https://www.youtube.com/watch?v=" + vid, tries=1)
        return True
    except urllib.error.HTTPError as e:
        return e.code not in (401, 403, 404)
    except Exception:
        return True


def main():
    cfg = json.loads(CONFIG.read_text(encoding="utf-8"))
    hidden = set(cfg.get("hidden", []))
    pinned = [v for v in cfg.get("pinned", []) if v not in hidden]
    old = [v for v in previous(cfg) if isinstance(v, dict) and ID.match(str(v.get("id", "")))]
    try:
        new = feed(cfg)
    except Exception as e:
        print("YouTube feed not readable (%s)" % e)
        if not old:
            print("and no earlier list to fall back on; leaving videos.json alone")
            return 0
        new = None

    if new is None:
        videos = old
    else:
        seen = {v["id"] for v in new}
        kept = [dict(v, short=bool(v.get("short"))) for v in old if v["id"] not in seen and still_up(v["id"])]
        videos = new + kept
    videos = [v for v in videos if v["id"] not in hidden and (cfg.get("includeShorts") or not v.get("short"))]
    videos.sort(key=lambda v: v.get("date", ""), reverse=True)
    videos.sort(key=lambda v: pinned.index(v["id"]) if v["id"] in pinned else len(pinned))  # stable: pinned first
    videos = videos[: int(cfg.get("max", 12))]
    for v in videos:
        if not cfg.get("includeShorts"):
            v.pop("short", None)

    data = {
        "updated": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "channelUrl": cfg.get("channelUrl", ""),
        "videos": videos,
    }
    OUT.write_text(json.dumps(data, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    print("wrote %d tapes to %s" % (len(videos), OUT))
    for v in videos:
        print("  %s  %s  %7d  %s" % (v["id"], v["date"], v["views"], v["title"]))
    return 0


if __name__ == "__main__":
    sys.exit(main())
