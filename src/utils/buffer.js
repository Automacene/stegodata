export function writeLengthFooter(stegoBytes) {
  if (!(stegoBytes instanceof Uint8Array)) {
    stegoBytes = new Uint8Array(stegoBytes);
  }

  const totalLength = stegoBytes.length + 4;
  const output = new Uint8Array(totalLength);
  output.set(stegoBytes, 0);

  const view = new DataView(output.buffer, output.byteOffset, output.byteLength);
  view.setUint32(stegoBytes.length, totalLength, true);

  return output;
}

export function readLengthFooter(fileBuffer) {
  if (!(fileBuffer instanceof Uint8Array)) {
    fileBuffer = new Uint8Array(fileBuffer);
  }

  if (fileBuffer.length < 4) {
    return 0;
  }

  const view = new DataView(fileBuffer.buffer, fileBuffer.byteOffset, fileBuffer.byteLength);
  return view.getUint32(fileBuffer.byteLength - 4, true);
}
