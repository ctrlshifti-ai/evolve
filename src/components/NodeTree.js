// Left pane: the tree of sections and leaves, drawn with the he-tree library.
// It doesn't change any data itself — it tells the parent what the user wants via events.

export default {
    name: 'NodeTree',
    components: {
        BaseTree: heTreeVue.BaseTree,
    },
    props: {
        treeData: { type: Array, required: true },
        openIds: { type: Array, required: true }, // ids of sections that are expanded
        selectedId: { type: Number, default: null }, // the leaf shown on the right
    },
    emits: ['open-leaf', 'toggle-section'],
    methods: {
        // he-tree calls this for every node when it builds the tree.
        // We use it to restore which sections were expanded.
        applyOpenState(stat) {
            stat.open = this.openIds.includes(stat.data.id);
            return stat;
        },
        onRowClick(node, stat) {
            if (node.type === 'section') {
                stat.open = !stat.open;
                this.$emit('toggle-section', node.id, stat.open);
            } else {
                this.$emit('open-leaf', node.id);
            }
        },
        percentCovered(section) {
            return Math.round((section.coveredLeaves / section.totalLeaves) * 100);
        },
    },
    template: `
        <div class="node-tree">
            <BaseTree
                :modelValue="treeData"
                textKey="title"
                childrenKey="children"
                :indent="18"
                :defaultOpen="false"
                :statHandler="applyOpenState"
            >
                <template #default="{ node, stat }">
                    <div
                        class="tree-row"
                        :class="{ 'tree-row--selected': node.type === 'leaf' && node.id === selectedId }"
                        @click="onRowClick(node, stat)"
                    >
                        <span class="tree-row__icon" v-if="node.type === 'section'">{{ stat.open ? '▾' : '▸' }}</span>
                        <span class="tree-row__icon tree-row__icon--done" v-else-if="node.completed" title="Covered">✓</span>
                        <span class="tree-row__icon tree-row__icon--leaf" v-else>📄</span>
                        <span class="tree-row__title" :class="{ 'tree-row__title--done': node.type === 'leaf' && node.completed }">{{ node.title }}</span>
                    </div>

                    <!-- Progress line under each section: share of its leaves marked as covered -->
                    <div class="section-progress" v-if="node.type === 'section' && node.totalLeaves > 0" @click="onRowClick(node, stat)">
                        <div class="section-progress__bar">
                            <div class="section-progress__fill" :style="{ width: percentCovered(node) + '%' }"></div>
                        </div>
                        <span class="section-progress__text">{{ node.coveredLeaves }}/{{ node.totalLeaves }}</span>
                    </div>
                </template>
            </BaseTree>
        </div>
    `,
};
