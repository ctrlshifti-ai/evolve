// Turns a leaf's Markdown text into safe HTML, and draws its ```mermaid diagrams.
// Uses three libraries loaded by index.html as plain scripts: marked, DOMPurify and mermaid.

// The only iframe allowed in leaf content: YouTube's privacy-friendly player.
const YOUTUBE_EMBED_URL = 'https://www.youtube-nocookie.com/embed/';

mermaid.initialize({
    startOnLoad: false,
    theme: 'dark',
    securityLevel: 'strict',
    themeVariables: { fontSize: '26px' }, // scaled to match the leaf text size (--leaf-font-size)
});

marked.use({
    gfm: true,     // GitHub-style Markdown: bare URLs become links, ~~strike~~, tables
    breaks: true,  // a single line break stays a line break, like in a plain-text note
    renderer: {
        // A ```mermaid block becomes <pre class="mermaid">, which drawDiagrams() turns into a picture.
        // Returning false lets marked render every other code block normally.
        code(code, language) {
            if (language === 'mermaid') {
                return `<pre class="mermaid">${escapeHtml(code)}</pre>`;
            }
            return false;
        },
        // ![Video title](YouTube link) becomes an embedded player; every other image stays an image.
        // (marked has already escaped `text`, the alt text, so it is safe inside the title attribute.)
        image(href, title, text) {
            const videoId = getYoutubeId(href);
            if (!videoId) {
                return false;
            }
            return `<iframe class="youtube-embed" src="${YOUTUBE_EMBED_URL}${videoId}" title="${text}" loading="lazy"`
                + ' allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"'
                // YouTube refuses to play ("Error 153") when the request carries no Referer.
                + ' referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>';
        },
    },
});

// Links open in a new tab so Evolve stays open.
DOMPurify.addHook('afterSanitizeAttributes', (node) => {
    if (node.tagName === 'A' && node.getAttribute('href')) {
        node.setAttribute('target', '_blank');
        node.setAttribute('rel', 'noopener noreferrer');
    }
});

// Iframes are allowed (see renderMarkdown) only so the YouTube player survives: remove every other one.
DOMPurify.addHook('uponSanitizeElement', (node, data) => {
    if (data.tagName !== 'iframe') {
        return;
    }
    const src = node.getAttribute('src') || '';
    if (!src.startsWith(YOUTUBE_EMBED_URL)) {
        node.remove();
    }
});

export function renderMarkdown(text) {
    const html = marked.parse(text);
    // Strips scripts and other unsafe HTML; keeps the YouTube iframe and the attributes it needs.
    return DOMPurify.sanitize(html, {
        ADD_TAGS: ['iframe'],
        ADD_ATTR: ['allow', 'allowfullscreen', 'referrerpolicy'],
    });
}

export async function drawDiagrams(container) {
    const diagrams = container.querySelectorAll('pre.mermaid');
    if (diagrams.length === 0) {
        return;
    }
    // suppressErrors: a broken diagram shows an error box instead of stopping the others.
    await mermaid.run({ nodes: diagrams, suppressErrors: true });
}

// Returns the 11-character video id from a YouTube link, or null if it isn't one.
function getYoutubeId(url) {
    const patterns = [
        /^https?:\/\/(?:www\.|m\.)?youtube\.com\/watch\?(?:.*&)?v=([\w-]{11})/, // youtube.com/watch?v=ID
        /^https?:\/\/youtu\.be\/([\w-]{11})/,                                   // youtu.be/ID
        /^https?:\/\/(?:www\.)?youtube\.com\/(?:embed|shorts)\/([\w-]{11})/,    // youtube.com/embed/ID, /shorts/ID
    ];
    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) {
            return match[1];
        }
    }
    return null;
}

function escapeHtml(text) {
    return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
