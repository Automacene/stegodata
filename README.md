# StegoData (v1.0 Specification)

Universal, language-agnostic, and non-destructive metadata embedding for the AI era.

---

## The Crisis of Scale in the Age of AI

We live in an era where AI agents consume, generate, and index millions to billions of files. Traditional data management approaches—relying on external databases, companion `.json` sidecar files, or complex directory hierarchies—create massive management bloat. When files are moved, emailed, shared via APIs, or downloaded from the web, sidecar metadata gets stripped away, leaving downstream AI pipelines blind, context-deprived, and forced to rely on expensive workarounds.

### The Problem with On-The-Fly Chunking & Caching

To make documents usable for AI, current architectures rely on brute-force approaches:

* **Endless Re-Chunking:** Every time a new agent model or chunking strategy is deployed, massive pipelines must re-read, parse, and split files from scratch.
* **Result Caching Bloat:** Storing parsed chunks and embeddings in external vector databases decouples the data from the file itself, introducing synchronization nightmares when the source file updates.
* **Compute Waste:** Millions of CPU cycles are wasted repeatedly parsing raw PDFs, images, and code files just to extract basic contextual metadata that should have lived with the file in the first place.

---

## The Technique: Inspired by Spore

StegoData borrows its core technique from a legendary game design trick used in Maxis's *Spore*. In *Spore*, player-created creatures were saved as standard, ordinary PNG images, but the game embedded the actual creature parameters and metadata directly into the image file format. If you shared a screenshot of your creature on a forum, anyone could drag that picture into the save folder and the creature would have a thumbnail and parameters for generating the creature in your world.

StegoData brings that exact concept to general computing and AI systems: **the file is the container, the database, and the context.**

Instead of wrapping files in heavy proprietary envelopes or breaking native parsers, StegoData allows arbitrary semantic payloads, agent memory blocks, and custom metadata to be appended directly to the tail end of any file. Native readers ignore the extra bytes, but AI agents and specialized pipelines can read them instantly—eliminating sidecar bloat, bypassing redundant chunking overhead, and keeping context permanently bound to the asset.

---

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

---

## Example Block in the Wild

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

---

## Format Compatibility Matrix

| File Format Category | Native Trailing Data Tolerance | Handling Requirements |
| --- | --- | --- |
| **PDF, Markdown, Plain Text** | **High** | Ignored by native readers; safe to append directly. |
| **PNG, JPEG, Media Files** | **Moderate-High** | Usually ignored past image structural markers (`IEND`, `EOI`), but check parser behavior. |
| **ZIP-based (DOCX, XLSX, EPUB)** | **Low** *for now* | Archives rely on an End of Central Directory (EOCD) at the absolute tail. StegoData cannot be naively appended without breaking standard unzipping tools unless wrapped or placed prior to the EOCD. |

---

## Parsing & Extraction Algorithm

Because multiple StegoData blocks can be stacked sequentially at the tail of a file, parsers utilize a backward-seeking traversal algorithm to read blocks efficiently without scanning the entire file from the beginning.

### The Reverse-Chop Algorithm

1. **Locate Tail:** Open the file in binary mode and seek to the absolute end (`SEEK_END`).
2. **Read Length Pointer:** Read the final **4 bytes** of the file. Convert this little-endian integer into a numeric value ($N$).
3. **Jump to Block Start:** Seek backward from the end of the file by $N$ bytes to find the exact starting byte of `--STEGO-BEGIN--`.
4. **Extract & Parse:**
* Extract the block data bounded by `--STEGO-BEGIN--` and `--STEGO-END--`.
* Parse the headers up to `===PAYLOAD===` and read the payload body according to `content-type`.


5. **Iterate or Terminate:**
* Check the remaining file data preceding the current block. If another StegoData block exists immediately prior (detectable by checking if the preceding bytes match another tail length or block structure), repeat steps 2–4.
* If the cursor reaches a native format end marker (e.g., `%%EOF` or `IEND`), terminate the extraction loop.



---

## Technical Guarantees & Safety

* **Encoding:** The entire header and metadata block from `--STEGO-BEGIN--` down to `===PAYLOAD===` is strictly UTF-8, ensuring global internationalization support while maintaining 1-to-1 ASCII compatibility for core routing keywords.
* **Multi-Block Support:** Because each block concludes with its own length pointer, multiple namespaces can be safely stacked or chained at the end of a single file.
* **Write/Stripping Safety:** Standard file utilities and text editors should be configured to preserve trailing bytes upon saving unless an explicit "strip metadata" command is executed. Pipelines recalculating cryptographic hashes (like SHA-256) should either isolate the native file content prior to the first `--STEGO-BEGIN--` marker or treat the StegoData-appended asset as a distinct artifact container.
