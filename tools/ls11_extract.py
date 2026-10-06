#!/usr/bin/env python3
"""Read-only extractor for KOEI LS11 resource containers.

The DOS release stores a 16-byte LS11 header, a 256-byte substitution
dictionary and a big-endian section table.  Compressed sections use a
variable-length code stream and back references.  This tool never modifies
the source game files.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import struct
from dataclasses import dataclass, asdict
from pathlib import Path


@dataclass
class Section:
    index: int
    compressed_size: int
    unpacked_size: int
    offset: int
    output: str = ""
    sha256: str = ""


class BitReader:
    def __init__(self, data: bytes):
        self.data = data
        self.byte_pos = 0
        self.bit_pos = 0

    def read(self, count: int) -> int:
        value = 0
        for _ in range(count):
            if self.byte_pos >= len(self.data):
                raise EOFError("unexpected end of LS11 bitstream")
            value = (value << 1) | ((self.data[self.byte_pos] >> (7 - self.bit_pos)) & 1)
            self.bit_pos += 1
            if self.bit_pos == 8:
                self.bit_pos = 0
                self.byte_pos += 1
        return value

    def code(self) -> int:
        prefix = 0
        bits = 0
        while True:
            bit = self.read(1)
            prefix = (prefix << 1) | bit
            bits += 1
            if bit == 0:
                break
        return prefix + self.read(bits)


def decode_section(payload: bytes, dictionary: bytes, expected_size: int) -> bytes:
    reader = BitReader(payload)
    output = bytearray()
    while len(output) < expected_size:
        token = reader.code()
        if token < 0x100:
            output.append(dictionary[token])
            continue
        distance = token - 0x100
        if distance <= 0 or distance > len(output):
            raise ValueError(f"invalid LS11 back reference {distance} at output {len(output)}")
        length = reader.code() + 3
        for _ in range(length):
            output.append(output[-distance])
            if len(output) == expected_size:
                break
    if len(output) != expected_size:
        raise ValueError(f"decoded {len(output)} bytes, expected {expected_size}")
    return bytes(output)


def read_container(path: Path) -> tuple[bytes, list[Section], bytes]:
    raw = path.read_bytes()
    if len(raw) < 0x114 or raw[:4] != b"LS11":
        raise ValueError(f"{path} is not an LS11 container")
    dictionary = raw[0x10:0x110]
    sections: list[Section] = []
    cursor = 0x110
    while cursor + 4 <= len(raw):
        if raw[cursor:cursor + 4] == b"\0\0\0\0":
            break
        if cursor + 12 > len(raw):
            raise ValueError("truncated LS11 section table")
        compressed_size, unpacked_size, offset = struct.unpack(">III", raw[cursor:cursor + 12])
        if offset + compressed_size > len(raw):
            raise ValueError(f"section {len(sections)} exceeds source file")
        sections.append(Section(len(sections), compressed_size, unpacked_size, offset))
        cursor += 12
    if not sections:
        raise ValueError("LS11 container has no sections")
    return dictionary, sections, raw


def build_unpacked_container(path: Path, sections: list[bytes], destination: Path) -> None:
    """Rebuild an LS11 container with stored (uncompressed) sections.

    Some of the original scenario readers require the container table and page
    offsets rather than loose decoded sections.  Keeping this operation here
    ensures the rebuilt file remains a byte-for-byte derivation of the user's
    original archive rather than relying on a third-party unpacked copy.
    """
    raw = path.read_bytes()
    header = raw[:0x110]
    table_size = len(sections) * 12 + 4
    cursor = 0x110 + table_size
    table = bytearray()
    for data in sections:
        table.extend(struct.pack(">III", len(data), len(data), cursor))
        cursor += len(data)
    table.extend(b"\0\0\0\0")
    destination.parent.mkdir(parents=True, exist_ok=True)
    destination.write_bytes(header + table + b"".join(sections))


def extract(path: Path, output_dir: Path, unpacked_container: Path | None = None) -> dict:
    dictionary, sections, raw = read_container(path)
    output_dir.mkdir(parents=True, exist_ok=True)
    decoded_sections: list[bytes] = []
    for section in sections:
        payload = raw[section.offset:section.offset + section.compressed_size]
        data = payload if section.compressed_size == section.unpacked_size else decode_section(payload, dictionary, section.unpacked_size)
        decoded_sections.append(data)
        name = f"section-{section.index:03d}.bin"
        (output_dir / name).write_bytes(data)
        section.output = name
        section.sha256 = hashlib.sha256(data).hexdigest()
    manifest = {
        "source": str(path.resolve()),
        "source_size": len(raw),
        "source_sha256": hashlib.sha256(raw).hexdigest(),
        "format": "LS11",
        "section_count": len(sections),
        "sections": [asdict(section) for section in sections],
    }
    (output_dir / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
    if unpacked_container:
        build_unpacked_container(path, decoded_sections, unpacked_container)
    return manifest


def main() -> None:
    parser = argparse.ArgumentParser(description="Extract a KOEI LS11 resource without modifying it")
    parser.add_argument("source", type=Path)
    parser.add_argument("output", type=Path)
    parser.add_argument("--unpacked-container", type=Path)
    args = parser.parse_args()
    manifest = extract(args.source, args.output, args.unpacked_container)
    print(json.dumps({"source": manifest["source"], "sections": manifest["section_count"]}, ensure_ascii=False))


if __name__ == "__main__":
    main()
