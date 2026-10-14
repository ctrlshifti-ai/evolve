# Evolve

A self-paced study guide for developers: a tree of sections and short lessons ("leaves") covering data structures and algorithms, AI-assisted development, web security, backend and infrastructure, frontend and mobile, engineering practices and core AI concepts.

It is a static site: plain HTML, CSS and JavaScript, no build step and no backend.

## Running it

Serve the folder with any static web server (GitHub Pages works as-is) and open it in a browser. Opening `index.html` straight from disk (`file://`) won't work, because the app loads ES modules and fetches its data.

## Progress

"Mark as covered" is saved in your browser (localStorage), so each browser keeps its own progress.

## Content: `data/evolve.json`

Every section and leaf lives in one file:

```json
{
    "nodes": [
        { "id": 1, "parentId": null, "type": "section", "title": "DSA" },
        { "id": 2, "parentId": 1, "type": "leaf", "title": "Start here", "content": "### Markdown here" }
    ]
}
```

- `parentId` is the id of the section the node sits in (`null` for the top level).
- The order in the array is the order in the tree.
- To add a leaf, give it a new unique `id` (highest id + 1), set its `parentId`, and place it after its siblings.
- `content` is GitHub-style Markdown. Code blocks marked `mermaid` are drawn as diagrams.
- Images: put the file in `images/` and write `![Alt text](images/name.svg)`.
- YouTube videos: `![Video title](https://www.youtube.com/watch?v=VIDEO_ID)` shows an embedded player. A normal `[link](...)` stays a link.

## Credits

- Images: see [images/CREDITS.md](images/CREDITS.md).
- Libraries in `lib/` (unmodified copies): Vue 3.5.39 (MIT), @he-tree/vue 2.10.5 with @virtual-list/vue 1.2.1 and vue-demi 0.14.10 (MIT), marked 12.0.2 (MIT), DOMPurify 3.1.6 (Apache-2.0 or MPL-2.0), Mermaid 11.4.1 (MIT).
