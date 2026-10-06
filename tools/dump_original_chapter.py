#!/usr/bin/env python3
"""Dump readable chapter data from an original Reko 3 installation.

The upstream research parser expects an already-unpacked SNRxD container.
The retail game compresses that single section, so this utility accepts an
equivalent unpacked container separately while keeping all character/item
data tied to the user's original game directory.
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("game_dir", type=Path)
    parser.add_argument("unpacked_snrd", type=Path)
    parser.add_argument("output", type=Path)
    parser.add_argument("--chapter", type=int, default=0)
    args = parser.parse_args()

    backend = Path(__file__).resolve().parent / "research" / "reko3editor-src" / "reko3editor-master" / "backend"
    sys.path.insert(0, str(backend))
    from libs import Reko3Data  # type: ignore

    data = Reko3Data(str(args.game_dir), args.chapter)
    data.snrm_file = str(args.game_dir / f"SNR{args.chapter}M.R3")
    data.snrd_file = str(args.unpacked_snrd)
    messages = data.read_snrm()
    script = data.read_snrd()

    result = {
        "source_game_dir": str(args.game_dir.resolve()),
        "chapter": args.chapter,
        "troop_types": data.bingzhong_list,
        "strategies": data.celve_list,
        "items": data.daoju_list,
        "characters": data.avatar_list,
        "initial_characters": data.avatar_first,
        "messages": messages,
        "script": script,
    }
    args.output.parent.mkdir(parents=True, exist_ok=True)
    def json_default(value: object) -> str:
        if isinstance(value, bytes):
            return value.decode("ascii")
        raise TypeError(f"cannot serialize {type(value).__name__}")

    args.output.write_text(
        json.dumps(result, ensure_ascii=False, indent=2, default=json_default),
        encoding="utf-8",
    )
    print(json.dumps({"output": str(args.output), "pages": len(script), "message_pages": len(messages)}, ensure_ascii=False))


if __name__ == "__main__":
    main()
