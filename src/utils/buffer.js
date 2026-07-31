export function writeLengthFooter(stegoBytes) {
  const bytes = stegoBytes instanceof Uint8Array
    ? stegoBytes
    : new Uint8Array(stegoBytes);

  const totalLength = bytes.length + 4; // Total size including footer
  const output = new Uint8Array(totalLength);
  output.set(bytes, 0);

  const view = new DataView(output.buffer, output.byteOffset, output.byteLength);
  
  view.setUint32(totalLength - 4, totalLength, true);
  return output;
}

export function readLengthFooter(fileBuffer) {
  const bytes = fileBuffer instanceof Uint8Array
    ? fileBuffer
    : new Uint8Array(fileBuffer);

  if (bytes.length < 4) {
    return 0;
  }

  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  return view.getUint32(bytes.byteLength - 4, true);
}