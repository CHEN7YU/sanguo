import { readFile } from 'node:fs/promises';

const data = await readFile(process.argv[2]);
const decoder = new TextDecoder('big5');
let current = [];

function flush() {
  if (!current.length) return;
  const text = decoder.decode(Uint8Array.from(current)).trim();
  if (text.length >= 3 && /[\u3400-\u9fff]/u.test(text)) console.log(text);
  current = [];
}

for (let i = 0; i < data.length;) {
  const byte = data[i];
  if ((byte >= 0x20 && byte <= 0x7e) || byte === 0x0a || byte === 0x0d) {
    current.push(byte);
    i += 1;
  } else if (i + 1 < data.length && byte >= 0x81 && byte <= 0xfe &&
    ((data[i + 1] >= 0x40 && data[i + 1] <= 0x7e) || (data[i + 1] >= 0xa1 && data[i + 1] <= 0xfe))) {
    current.push(byte, data[i + 1]);
    i += 2;
  } else {
    flush();
    i += 1;
  }
}
flush();
