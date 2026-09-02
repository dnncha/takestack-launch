#!/usr/bin/env python3
"""Validate public TakeStack copy, routes, canonicals, and local links."""
from html.parser import HTMLParser
from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
PUBLIC_PAGES = {"index.html":"https://dnncha.github.io/takestack-launch/","support/index.html":"https://dnncha.github.io/takestack-launch/support","privacy/index.html":"https://dnncha.github.io/takestack-launch/privacy"}
FORBIDDEN = re.compile(r"\b(mac|macos|studio|companion|pairing|founder|stripe|desktop|beta)\b", re.I)
STALE_ROUTES = ("buy","download","founder-download","after-purchase","concierge","done-for-you","launch-sprint","team-pack","teachers","choir","creators","creator-seed","demo")

class PageParser(HTMLParser):
    def __init__(self):
        super().__init__(); self.links=[]; self.canonical=[]; self.h1_count=0; self.images_without_alt=0; self.mail_links=[]
    def handle_starttag(self, tag, attrs):
        values=dict(attrs)
        if tag == "a" and "href" in values:
            self.links.append(values["href"])
            if values["href"].startswith("mailto:"): self.mail_links.append(values["href"])
        if tag in {"img","script","link"}:
            value=values.get("src") or values.get("href")
            if value: self.links.append(value)
        if tag == "link" and values.get("rel") == "canonical": self.canonical.append(values.get("href"))
        if tag == "h1": self.h1_count += 1
        if tag == "img" and "alt" not in values: self.images_without_alt += 1

def local_target(link):
    clean=link.split("#",1)[0].split("?",1)[0]
    if not clean or clean.startswith(("http://","https://","mailto:","tel:")): return None
    if clean.startswith("/takestack-launch/"): clean=clean.removeprefix("/takestack-launch/")
    elif clean == "/takestack-launch": clean=""
    else: return None
    target=ROOT/clean
    if clean.endswith("/") or target.is_dir() or not target.suffix: target=target/"index.html"
    return target

def main():
    errors=[]
    for relative, expected in PUBLIC_PAGES.items():
        path=ROOT/relative
        if not path.is_file(): errors.append(f"missing public page: {relative}"); continue
        source=path.read_text(encoding="utf-8"); match=FORBIDDEN.search(source)
        if match: errors.append(f"{relative}: forbidden public term: {match.group(0)!r}")
        parser=PageParser(); parser.feed(source)
        if parser.canonical != [expected]: errors.append(f"{relative}: canonical {parser.canonical!r}, expected {expected!r}")
        if parser.h1_count != 1: errors.append(f"{relative}: expected one h1, found {parser.h1_count}")
        if parser.images_without_alt: errors.append(f"{relative}: {parser.images_without_alt} image(s) missing alt text")
        for link in parser.links:
            target=local_target(link)
            if target is not None and not target.exists(): errors.append(f"{relative}: broken local link {link!r} -> {target.relative_to(ROOT)}")
    support=PageParser(); support.feed((ROOT/"support/index.html").read_text(encoding="utf-8"))
    if not any("subject=TakeStack%20support" in link for link in support.mail_links): errors.append("support page: missing TakeStack support email subject")
    for stale in STALE_ROUTES:
        if (ROOT/stale).exists() or (ROOT/f"{stale}.html").exists(): errors.append(f"stale public route remains: {stale}")
    sitemap=(ROOT/"sitemap.xml").read_text(encoding="utf-8")
    for canonical in PUBLIC_PAGES.values():
        if canonical not in sitemap: errors.append(f"sitemap missing {canonical}")
    if errors:
        print("Public-site validation failed:", file=sys.stderr)
        for error in errors: print(f"- {error}", file=sys.stderr)
        return 1
    print(f"Public-site validation passed: {len(PUBLIC_PAGES)} pages, consistent canonicals, links, language, headings, alt text, and support subject.")
    return 0

if __name__ == "__main__": raise SystemExit(main())
