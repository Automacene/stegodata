export class BaseAdapter {
  append(fileBuffer, stegoBlockWithFooter) {
    throw new Error('BaseAdapter.append() must be implemented by a subclass.');
  }
}
