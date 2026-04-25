import argparse
import os
from pathlib import Path


def convert_conll_to_qpen(src_path, dst_path):
    src = Path(src_path)
    dst = Path(dst_path)
    dst.parent.mkdir(parents=True, exist_ok=True)

    lines_to_write = []
    with src.open('r', encoding='utf-8') as fp:
        for raw_line in fp:
            line = raw_line.rstrip('\n')
            if not line.strip():
                lines_to_write.append('\n')
                continue
            parts = line.split()
            if len(parts) < 2:
                raise ValueError(f"Expected at least token and label in line: {line}")
            token = parts[0]
            label = parts[-1]
            if '\t' in token:
                raise ValueError(f"Token contains a tab character: {token}")
            lines_to_write.append(f"{token}\t{label}\tNONE-CATE\n")

    with dst.open('w', encoding='utf-8') as fp:
        fp.writelines(lines_to_write)


def main():
    parser = argparse.ArgumentParser(description="Convert CoNLL-style ABSA data to the QPEN token/tag format.")
    parser.add_argument("--src", required=True, help="Input file with token/label columns separated by whitespace.")
    parser.add_argument("--dst", required=True, help="Output QPEN-formatted file.")
    args = parser.parse_args()

    convert_conll_to_qpen(args.src, args.dst)
    print(f"Wrote converted data to {os.path.abspath(args.dst)}")


if __name__ == "__main__":
    main()
