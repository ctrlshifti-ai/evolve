// data/evolve.json stores nodes as a flat list, each pointing at its parent:
//   [{ id: 1, parentId: null, ... }, { id: 2, parentId: 1, ... }]
// The tree component needs them nested:
//   [{ id: 1, ..., children: [{ id: 2, ..., children: [] }] }]
export function buildTree(flatNodes) {
    // First make a copy of every node (with an empty children list), looked up by id.
    const nodesById = {};
    for (const node of flatNodes) {
        nodesById[node.id] = { ...node, children: [] };
    }

    // Then put each node inside its parent, or at the top level if it has no parent.
    // The list is already in tree order, so children keep the right order.
    const topLevel = [];
    for (const node of flatNodes) {
        const treeNode = nodesById[node.id];
        if (node.parentId === null) {
            topLevel.push(treeNode);
        } else if (nodesById[node.parentId]) {
            nodesById[node.parentId].children.push(treeNode);
        }
    }
    return topLevel;
}

// Adds progress numbers to every section: how many leaves are inside it (at any depth)
// and how many of those are marked as covered. Leaves are left unchanged.
//   section.totalLeaves, section.coveredLeaves
export function addProgress(nodes) {
    for (const node of nodes) {
        if (node.type === 'section') {
            countLeaves(node);
        }
    }
    return nodes;
}

function countLeaves(section) {
    let total = 0;
    let covered = 0;
    for (const child of section.children) {
        if (child.type === 'leaf') {
            total += 1;
            if (child.completed) {
                covered += 1;
            }
        } else {
            countLeaves(child); // fills in the child section's own numbers first
            total += child.totalLeaves;
            covered += child.coveredLeaves;
        }
    }
    section.totalLeaves = total;
    section.coveredLeaves = covered;
}
