import { buildTree, addProgress } from './tree-helpers.js';
import NodeTree from './components/NodeTree.js';
import LeafPane from './components/LeafPane.js';
import ProgressRing from './components/ProgressRing.js';

// All sections and leaves live in this one static file. The path is relative,
// so the app works from any folder or static host (e.g. GitHub Pages).
const DATA_URL = './data/evolve.json';

const OPEN_IDS_KEY = 'evolve-open-sections';
const COVERED_IDS_KEY = 'evolve-covered-leaves';
const LIST_WIDTH_KEY = 'evolve-tree-width';
const MIN_TREE_WIDTH = 200;
const MIN_LEAF_WIDTH = 300;

// localStorage can be unavailable (private mode), so reading and writing never throw.
function readStored(key, fallback) {
    try {
        const value = localStorage.getItem(key);
        return value === null ? fallback : JSON.parse(value);
    } catch (e) {
        return fallback;
    }
}

function writeStored(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
        // Not saved — the app still works, it just won't remember this next time.
    }
}

const App = {
    components: { NodeTree, LeafPane, ProgressRing },
    data() {
        return {
            nodes: [], // flat list from data/evolve.json: { id, parentId, type, title, content }
            loaded: false,
            treeVersion: 0, // bumped when progress changes so the tree redraws from fresh data
            openIds: readStored(OPEN_IDS_KEY, []),
            coveredIds: readStored(COVERED_IDS_KEY, []), // leaves marked as covered in this browser
            selectedLeafId: null,

            treeWidth: readStored(LIST_WIDTH_KEY, 320),
            resizing: false,
        };
    },
    computed: {
        // Every node plus its "covered" flag. Progress is saved in this browser, not in the data file.
        nodesWithProgress() {
            return this.nodes.map((node) => ({ ...node, completed: this.coveredIds.includes(node.id) }));
        },
        treeData() {
            return addProgress(buildTree(this.nodesWithProgress));
        },
        // Overall progress for the ring in the header.
        leafCount() {
            return this.nodes.filter((node) => node.type === 'leaf').length;
        },
        coveredCount() {
            // Counted from the leaves (not coveredIds.length) so ids of leaves removed from the data don't count.
            return this.nodes.filter((node) => node.type === 'leaf' && this.coveredIds.includes(node.id)).length;
        },
        selectedLeaf() {
            return this.nodesWithProgress.find((node) => node.id === this.selectedLeafId) || null;
        },
        // The leaves in the same section as the open leaf, in tree order.
        // (data/evolve.json lists nodes in tree order, so filtering keeps the order.)
        sectionLeaves() {
            if (!this.selectedLeaf) {
                return [];
            }
            const parentId = this.selectedLeaf.parentId;
            return this.nodes.filter((node) => node.type === 'leaf' && node.parentId === parentId);
        },
        selectedLeafIndex() {
            return this.sectionLeaves.findIndex((node) => node.id === this.selectedLeafId);
        },
        previousLeaf() {
            return this.sectionLeaves[this.selectedLeafIndex - 1] || null;
        },
        nextLeaf() {
            return this.sectionLeaves[this.selectedLeafIndex + 1] || null;
        },
    },
    async mounted() {
        await this.loadNodes();
        this.loaded = true;
        window.addEventListener('keydown', this.onKeydown);
    },
    beforeUnmount() {
        window.removeEventListener('keydown', this.onKeydown);
    },
    methods: {
        // ---------- loading ----------
        async loadNodes() {
            try {
                // no-cache: the browser checks for a newer file on every visit (cheap when unchanged).
                const response = await fetch(DATA_URL, { cache: 'no-cache' });
                if (!response.ok) {
                    throw new Error(`Could not load ${DATA_URL} (HTTP ${response.status})`);
                }
                const data = await response.json();
                this.nodes = data.nodes;
            } catch (e) {
                alert(e.message);
            }
        },

        // ---------- tree events ----------
        openLeaf(id) {
            this.selectedLeafId = id;
        },
        closeLeaf() {
            this.selectedLeafId = null;
        },
        goToPreviousLeaf() {
            if (this.previousLeaf) {
                this.openLeaf(this.previousLeaf.id);
            }
        },
        goToNextLeaf() {
            if (this.nextLeaf) {
                this.openLeaf(this.nextLeaf.id);
            }
        },
        // Left/right arrow keys move between leaves, unless the user is typing somewhere.
        onKeydown(event) {
            if (!this.selectedLeaf || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) {
                return;
            }
            const target = event.target;
            const isTyping = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
            if (isTyping) {
                return;
            }
            if (event.key === 'ArrowLeft') {
                event.preventDefault();
                this.goToPreviousLeaf();
            } else if (event.key === 'ArrowRight') {
                event.preventDefault();
                this.goToNextLeaf();
            }
        },
        setLeafCompleted(id, completed) {
            if (completed && !this.coveredIds.includes(id)) {
                this.coveredIds.push(id);
            }
            if (!completed) {
                this.coveredIds = this.coveredIds.filter((coveredId) => coveredId !== id);
            }
            writeStored(COVERED_IDS_KEY, this.coveredIds);
            this.treeVersion++; // redraw the tree so the tick and the section progress update
        },
        toggleSection(id, isOpen) {
            if (isOpen && !this.openIds.includes(id)) {
                this.openIds.push(id);
            }
            if (!isOpen) {
                this.openIds = this.openIds.filter((openId) => openId !== id);
            }
            writeStored(OPEN_IDS_KEY, this.openIds);
        },

        // ---------- resizing the two panes ----------
        startResize(event) {
            this.resizing = true;
            event.target.setPointerCapture(event.pointerId);
        },
        onResize(event) {
            if (!this.resizing) {
                return;
            }
            const layoutLeft = this.$refs.layout.getBoundingClientRect().left;
            this.setTreeWidth(event.clientX - layoutLeft);
        },
        endResize(event) {
            if (!this.resizing) {
                return;
            }
            this.resizing = false;
            event.target.releasePointerCapture(event.pointerId);
            writeStored(LIST_WIDTH_KEY, this.treeWidth);
        },
        setTreeWidth(width) {
            const maxWidth = this.$refs.layout.clientWidth - MIN_LEAF_WIDTH;
            this.treeWidth = Math.round(Math.max(MIN_TREE_WIDTH, Math.min(width, maxWidth)));
        },
    },
    template: `
        <header class="app-header">
            <img src="./icon.svg" alt="">
            <h1>Evolve</h1>
            <ProgressRing v-if="leafCount > 0" :covered="coveredCount" :total="leafCount" />
        </header>

        <div
            class="evolve-layout"
            ref="layout"
            :class="{ 'evolve-layout--leaf-open': selectedLeaf, 'evolve-layout--resizing': resizing }"
            :style="{ '--tree-width': treeWidth + 'px' }"
        >
            <aside class="tree-pane">
                <div class="placeholder" v-if="!loaded">Loading…</div>
                <div class="placeholder" v-else-if="!nodes.length">Nothing here yet.</div>
                <NodeTree
                    v-else
                    :key="treeVersion"
                    :treeData="treeData"
                    :openIds="openIds"
                    :selectedId="selectedLeafId"
                    @open-leaf="openLeaf"
                    @toggle-section="toggleSection"
                />
            </aside>

            <div
                class="pane-resizer"
                title="Drag to resize"
                @pointerdown.prevent="startResize"
                @pointermove="onResize"
                @pointerup="endResize"
                @pointercancel="endResize"
            ></div>

            <section class="content-pane">
                <!-- :key gives every leaf a fresh pane, so it starts at the top and draws its diagrams once -->
                <LeafPane
                    v-if="selectedLeaf"
                    :key="selectedLeaf.id"
                    :leafId="selectedLeaf.id"
                    :title="selectedLeaf.title"
                    :content="selectedLeaf.content"
                    :completed="selectedLeaf.completed"
                    @close="closeLeaf"
                    @set-completed="setLeafCompleted"
                />
                <div class="placeholder" v-else>Pick a leaf on the left to see its content.</div>

                <!-- Floating previous/next: moves between leaves of the same section (also ← and → keys) -->
                <div class="leaf-nav" v-if="selectedLeaf">
                    <button
                        type="button"
                        class="leaf-nav__button"
                        :disabled="!previousLeaf"
                        :title="previousLeaf ? 'Previous: ' + previousLeaf.title + ' (←)' : 'First in this section'"
                        @click="goToPreviousLeaf"
                    >‹ Prev</button>
                    <span class="leaf-nav__position">{{ selectedLeafIndex + 1 }} / {{ sectionLeaves.length }}</span>
                    <button
                        type="button"
                        class="leaf-nav__button"
                        :disabled="!nextLeaf"
                        :title="nextLeaf ? 'Next: ' + nextLeaf.title + ' (→)' : 'Last in this section'"
                        @click="goToNextLeaf"
                    >Next ›</button>
                </div>
            </section>
        </div>
    `,
};

Vue.createApp(App).mount('#app');
