// Header badge: overall progress as a percentage inside a ring.
// The ring grows clockwise from the top with every covered leaf: just a dot at 0%, a full circle at 100%.

const RADIUS = 15.5; // ring radius inside the 36 x 36 viewBox, leaving room for the 3-unit-wide stroke
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default {
    name: 'ProgressRing',
    props: {
        covered: { type: Number, required: true }, // leaves marked as covered
        total: { type: Number, required: true }, // all leaves
    },
    data() {
        return {
            radius: RADIUS,
            circumference: CIRCUMFERENCE,
        };
    },
    computed: {
        // Whole percentage for the label. It is only 0% when nothing is covered and only 100% when
        // everything is, so covering the first or the last leaf always changes the number.
        percent() {
            if (this.covered === 0 || this.total === 0) {
                return 0;
            }
            if (this.covered >= this.total) {
                return 100;
            }
            const rounded = Math.round((this.covered / this.total) * 100);
            return Math.min(99, Math.max(1, rounded));
        },
        // Length of the visible part of the ring. It uses the exact share (not the rounded label),
        // so every covered leaf moves the ring. The tiny minimum keeps a dot at 0%: the round line cap draws it.
        arcLength() {
            const share = this.total === 0 ? 0 : Math.min(1, this.covered / this.total);
            return Math.max(0.01, share * this.circumference);
        },
    },
    template: `
        <svg class="progress-ring" viewBox="0 0 36 36" role="img" :aria-label="'Overall progress: ' + percent + '%'">
            <title>{{ covered }} of {{ total }} leaves covered</title>
            <!-- rotate(-90) moves the start of the circle from the right side to the top -->
            <circle
                class="progress-ring__arc"
                cx="18"
                cy="18"
                :r="radius"
                :stroke-dasharray="arcLength + ' ' + circumference"
                transform="rotate(-90 18 18)"
            />
            <text class="progress-ring__text" x="18" y="18" text-anchor="middle" dominant-baseline="central">{{ percent }}%</text>
        </svg>
    `,
};
