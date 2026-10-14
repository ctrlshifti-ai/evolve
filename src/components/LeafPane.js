import { renderMarkdown, drawDiagrams } from '../markdown.js';

// Right pane: shows one leaf's content, rendered from Markdown (links, code, images, diagrams, videos).
// The parent gives every leaf its own LeafPane (:key), so the content never changes while it's shown.
export default {
    name: 'LeafPane',
    props: {
        leafId: { type: Number, required: true },
        title: { type: String, required: true },
        content: { type: String, required: true },
        completed: { type: Boolean, default: false },
    },
    emits: ['close', 'set-completed'],
    computed: {
        renderedContent() {
            return renderMarkdown(this.content);
        },
    },
    mounted() {
        // The rendered HTML is on the page now, so ```mermaid blocks can be turned into diagrams.
        drawDiagrams(this.$refs.view);
    },
    template: `
        <div class="leaf-pane">
            <div class="leaf-pane__bar">
                <button type="button" class="leaf-pane__back" @click="$emit('close')">&lt; Back</button>
                <button
                    type="button"
                    class="covered-button"
                    :class="{ 'covered-button--done': completed }"
                    @click="$emit('set-completed', leafId, !completed)"
                >{{ completed ? '✓ Covered' : 'Mark as covered' }}</button>
            </div>
            <h2 class="leaf-pane__title">{{ title }}</h2>
            <div ref="view" class="leaf-pane__view markdown" v-html="renderedContent"></div>
        </div>
    `,
};
