<p align="center">
  <img src="assets/stegodataProfile.png" alt="StegoData Banner" width="100%" style="max-width: 800px; border-radius: 10px;" />
</p>

# StegoData (v1.0.3 Specification)

> **Universal, language-agnostic, and non-destructive metadata embedding for the AI era.**

[![npm version](https://img.shields.io/npm/v/@automacene/stegodata.svg)](https://www.npmjs.com/package/@automacene/stegodata)
[![jsDelivr](https://data.jsdelivr.com/v1/package/npm/@automacene/stegodata/badge)](https://www.jsdelivr.com/package/npm/@automacene/stegodata)
[![License: Apache 2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)   

## ⚡ Quick Start

StegoData works out of the box with zero external dependencies in Node.js, modern bundlers, and direct browser script tags.

### 1. Installation
```bash
npm install @automacene/stegodata  
```

Or load directly in the browser via CDN:
```html
<script src="[https://cdn.jsdelivr.net/npm/@automacene/stegodata@latest/dist/stegodata.min.js](https://cdn.jsdelivr.net/npm/@automacene/stegodata@latest/dist/stegodata.min.js)"></script>
```

### 2. Basic Usage

#### Node.js / ES Modules
```javascript
import { StegoData } from '@automacene/stegodata';
import fs from 'fs/promises';

// Read an existing file (PDF, TXT, Image, etc.)
const inputBuffer = await fs.readFile('./document.pdf');

// Inject AI metadata or agent memory
const taggedBuffer = await StegoData.inject(inputBuffer, {
  namespace: 'ai:chunk-cache',
  contentType: 'application/json',
  headers: {
    '+author': 'Agent-007',
    '+tags': 'processed, rag-ready'
  },
  payload: {
    summary: 'Executive brief on Q3 earnings.',
    chunks: [
      { id: 1, text: 'Revenue grew by 14%...' }
    ]
  }
});

// Save the asset — standard PDF viewers still open it cleanly!
await fs.writeFile('./document_tagged.pdf', taggedBuffer);

// Extract metadata anywhere downstream
const blocks = await StegoData.extract(taggedBuffer);
console.log(blocks[0].payload);
```

#### Browser Script Tag
```html
<script src="[https://cdn.jsdelivr.net/npm/@automacene/stegodata@latest/dist/stegodata.min.js](https://cdn.jsdelivr.net/npm/@automacene/stegodata@latest/dist/stegodata.min.js)"></script>
<script>
  async function processFile(fileInput) {
    const file = fileInput.files[0];
    
    // Inject metadata directly into a browser File object
    const taggedBytes = await StegoData.inject(file, {
      namespace: 'browser:session',
      payload: { clientTimestamp: Date.now() }
    });

    // Extract blocks back
    const metadata = await StegoData.extract(taggedBytes);
    console.log('Extracted StegoData:', metadata);
  }
</script>
```

## The Crisis of Scale in the Age of AI

We live in an era where AI agents consume, generate, and index millions to billions of files. Traditional data management approaches—relying on external databases, companion `.json` sidecar files, or complex directory hierarchies—create massive management bloat. When files are moved, emailed, shared via APIs, or downloaded from the web, sidecar metadata gets stripped away, leaving downstream AI pipelines blind, context-deprived, and forced to rely on expensive workarounds.

### The Problem with On-The-Fly Chunking & Caching

To make documents usable for AI, current architectures rely on brute-force approaches:

* **Endless Re-Chunking:** Every time a new agent model or chunking strategy is deployed, massive pipelines must re-read, parse, and split files from scratch.
* **Result Caching Bloat:** Storing parsed chunks and embeddings in external vector databases decouples the data from the file itself, introducing synchronization nightmares when the source file updates.
* **Compute Waste:** Millions of CPU cycles are wasted repeatedly parsing raw PDFs, images, and code files just to extract basic contextual metadata that should have lived with the file in the first place.

### The Technique: Inspired by Spore

StegoData borrows its core technique from a legendary game design trick used in Maxis's *Spore*. In *Spore*, player-created creatures were saved as standard, ordinary PNG images, but the game embedded the actual creature parameters and metadata directly into the image file format. If you shared a screenshot of your creature on a forum, anyone could drag that picture into the save folder and the creature would have a thumbnail and parameters for generating the creature in your world.

StegoData brings that exact concept to general computing and AI systems: **the file is the container, the database, and the context.**

Instead of wrapping files in heavy proprietary envelopes or breaking native parsers, StegoData allows arbitrary semantic payloads, agent memory blocks, and custom metadata to be appended directly to the tail end of any file. Native readers ignore the extra bytes, but AI agents and specialized pipelines can read them instantly—eliminating sidecar bloat, bypassing redundant chunking overhead, and keeping context permanently bound to the asset.

## Wire Format Specification (v1.0)

At the absolute tail end of a file (following any native end-of-file markers like `%%EOF` or `IEND`), data blocks can be appended sequentially.

### Structure Overview
```text
[ Native File Content / Binary Data ]
--STEGO-BEGIN--
[ Header Section: Key-Value pairs ]
===PAYLOAD===
[ Raw Payload Bytes ]
--STEGO-END--[ 4-Byte Little-Endian Length Integer ]
```

### Detailed Breakdown

* `--STEGO-BEGIN--`: An unmistakable 15-byte text marker signaling the start of a StegoData block.
* **Header Section (UTF-8):** Key-value pairs separated by colons (`:`), one per line.
* *System / Routing Headers (Reserved):* `namespace` (target routing identifier), `content-type` (`application/json`, `text/plain`, etc.), `schema` (optional URI).
* *Custom User Metadata (`+` prefix):* Any header prefixed with a `+` symbol is treated as custom user metadata (e.g., `+author: Alice`, `+tags: draft, ai-ready`). This allows lightweight indexers to query metadata without parsing heavy payloads.
* `===PAYLOAD===`: The boundary token separating header metadata from the raw payload body, preventing internal newlines within JSON or text payloads from colliding with the header parser.
* **Raw Payload Data:** Unwrapped, arbitrary data bytes interpreted according to the `content-type`.
* `--STEGO-END--`: The 13-byte closing text marker.
* **4-Byte Little-Endian Length Integer:** Positioned at the absolute tail of the file. This integer records the exact byte length of the stego block, **measured from the first byte of `--STEGO-BEGIN--` up to and including the final 4th byte of the length integer itself**. Stored in **Little-Endian** format to optimize decoding speed for data-center-scale processing pipelines on x86 and ARM architectures. This enables $O(1)$ reverse-seeking.

### Example Block in the Wild
```text
%PDF-1.4
... [ standard PDF binary payload ] ...
%%EOF
--STEGO-BEGIN--
namespace: automacene:document-meta
content-type: application/json
+author: Alice
+tags: draft, ai-ready

===PAYLOAD===
{
  "analyst_id": "A-12",
  "notes": "Complex data with multiple lines\nand nested blocks is fully supported."
}
--STEGO-END--\x0A\x01\x00\x00
```

### Format Compatibility Matrix

| File Format Category | Native Trailing Data Tolerance | Handling Requirements |
| --- | --- | --- |
| **PDF, Markdown, Plain Text** | **High** | Ignored by native readers; safe to append directly. |
| **PNG, JPEG, Media Files** | **Moderate-High** | Usually ignored past image structural markers (`IEND`, `EOI`), but check parser behavior. |
| **ZIP-based (DOCX, XLSX, EPUB)** | **Low** *for now* | Archives rely on an End of Central Directory (EOCD) at the absolute tail. Requires adapter handling before EOCD. |

### Parsing & Extraction Algorithm

Because multiple StegoData blocks can be stacked sequentially at the tail of a file, parsers utilize a backward-seeking traversal algorithm to read blocks efficiently without scanning the entire file from the beginning.

### The Reverse-Chop Algorithm

1. **Locate Tail:** Open the file in binary mode and seek to the absolute end (`SEEK_END`).
2. **Read Length Pointer:** Read the final **4 bytes** of the file. Convert this little-endian integer into a numeric value ($N$).
3. **Jump to Block Start:** Seek backward from the end of the file by $N$ bytes to find the exact starting byte of `--STEGO-BEGIN--`.
4. **Extract & Parse:**

* Extract the block data bounded by `--STEGO-BEGIN--` and `--STEGO-END--`.
* Parse the headers up to `===PAYLOAD===` and read the payload body according to `content-type`.

5. **Iterate or Terminate:**

* Check the remaining file data preceding the current block. If another StegoData block exists immediately prior, repeat steps 2–4.
* If the cursor reaches a native format end marker (e.g., `%%EOF` or `IEND`), terminate the extraction loop.

## Project Architecture & Extensibility

To support universal, non-destructive metadata embedding across JavaScript environments, the reference SDK is designed around a zero-dependency, modular pipeline.
```text
src/
├── core/
│   ├── spec.js       # Constants, markers, and validation rules
│   ├── builder.js    # Serializes headers & payloads into binary blocks
│   └── parser.js     # Parses binary blocks back into JS objects
├── utils/
│   └── buffer.js     # Little-endian 4-byte length read/write utilities
├── adapters/
│   ├── base.js       # Standard interface contract for format adapters
│   ├── raw.js        # Default tail-concatenation strategy
│   └── index.js      # Format adapter registry and lookup
└── index.js          # Main entrypoint & unified browser/Node API
```

### Custom Adapter Registry

StegoData allows registering custom file adapters to handle format-specific constraints (such as PNG chunk injection or PDF cross-reference updates):
```javascript
import { StegoData, BaseAdapter } from '@automacene/stegodata';

class CustomFormatAdapter extends BaseAdapter {
  inject(fileBuffer, blockBytes) {
    // Custom byte placement logic
    return modifiedBuffer;
  }
}

// Register for auto-resolution by MIME type or file extension
StegoData.registerAdapter('image/custom', new CustomFormatAdapter());
StegoData.registerAdapter('.custom', new CustomFormatAdapter());
```

## Development & Build System

The SDK uses `esbuild` to assemble zero-dependency runtime targets optimized for execution speed and minimal footprint.

* **Build Bundle:** `npm run build` (outputs `dist/stegodata.min.js`)
* **Run Test Suite:** `npm test` (covers block serialization, $O(1)$ extraction accuracy, and edge-case inputs)

## License

[Apache 2.0](./LICENSE) © Automacene
