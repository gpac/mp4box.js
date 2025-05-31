# Contributing to MP4Box.js

First off, thanks for considering contributing to MP4Box.js! We appreciate your help in making this project better.

## Commit Messages

While we don't strictly enforce it, we **strongly encourage** you to use [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) for your commit messages. This helps us automate the release process using Semantic Release and makes it easier to understand the changes in the project history.

**Why Conventional Commits?**

- **Automated Changelog Generation:** Semantic Release can automatically generate a meaningful changelog.

- **Automatic Version Bumping:** Semantic Release can determine the next version number based on the types of commits (fix, feat, BREAKING CHANGE, etc.).

- **Clearer Commit History:** It makes the project history more readable and understandable.

A typical commit message might look like:

```
feat: Add new 'prft' box from 14496-12
```

Or for a fix:

```
fix: Correct parsing of 'prft' box under specific conditions
```

## Adding New Boxes

We welcome contributions for new MP4 box types! Here's how to add one:

1. **Create the Box File:** Each new box should be implemented in its own file under the `src/boxes/` directory. For example, a new box named `prft` would be in `src/boxes/prft.ts`.

2. **Re-export the Box:** After creating your box file, you **must** re-export it from `entries/all-boxes.ts`. This makes the new box available to the library.

   Open `entries/all-boxes.ts` and add an export line for your new box:

   ```ts
   // ... other box exports
   export * from '#/boxes/prft'; // Add this line for your new box
   ```

### Example Box Contribution

Here's an example of how a box class might be structured. This is the `prft` (ProducerReferenceTimeBox) box:

```ts
import { FullBox } from '#/box';
import type { MultiBufferStream } from '#/buffer';

export class prftBox extends FullBox {
  static fourcc = 'prft' as const;
  box_name = 'ProducerReferenceTimeBox' as const;

  ref_track_id: number;
  ntp_timestamp: number;
  media_time: number;

  parse(stream: MultiBufferStream) {
    this.parseFullHeader(stream);
    this.ref_track_id = stream.readUint32();
    this.ntp_timestamp = stream.readUint64();
    if (this.version === 0) {
      this.media_time = stream.readUint32();
    } else {
      this.media_time = stream.readUint64();
    }
  }
}
```

---

Thank you for contributing!
