:root{
/* Surfaces */
--bg-page: #f4f2f1;
--bg-card: #eceae8;
--bg-track: #d9d7d7;

/* Text */
--text-1: #0d0c0b;
--text-2: #bdbbba;
--text-3: #a09e9d;
--text-marker: #6a6866;

/* Accents */
--accent-yellow: #ffd403;
--accent-green: #7fb31b;
--accent-red: #cf5452;

/* Progress gradient (example) */
--grad-past: linear-gradient(to right, #7b5ca0, #5b4a6a, #4a4351);

/* Shape & depth (keep generic + adjust once) */
--radius-card: 1.25rem;
--radius-pill: 9999px;

--shadow-card: 0 0.75rem 1.75rem rgba(0,0,0,0.10);
--shadow-inset: inset 0 1px 0 rgba(255,255,255,0.55),
inset 0 -1px 0 rgba(0,0,0,0.08);
}

/* Layout */
.page{
background: var(--bg-page);
color: var(--text-1);
}

/* Card */
.card{
background: var(--bg-card);
border-radius: var(--radius-card);
box-shadow: var(--shadow-card);
}

/* Typography helpers */
.text-primary{ color: var(--text-1); }
.text-secondary{ color: var(--text-2); }
.text-tertiary{ color: var(--text-3); }

/* Progress */
.progress{
background: var(--bg-track);
border-radius: var(--radius-pill);
box-shadow: var(--shadow-inset);
overflow: hidden;
position: relative;
}
.progress::after{
content:"";
position:absolute; inset:0;
background: linear-gradient(to bottom, rgba(255,255,255,0.25), transparent);
pointer-events:none;
}
.seg--past{ background: var(--grad-past); }
.seg--empty{ background: var(--accent-yellow); }
.seg--left{ background: color-mix(in srgb, var(--bg-track) 80%, white); }

/* Marker */
.marker{
position:absolute;
top: 0;
transform: translateX(-50%);
}
.marker__line{
background: var(--accent-yellow);
border-radius: var(--radius-pill);
width: 2px;
}
.marker__label{
color: var(--text-marker);
font-weight: 600;
white-space: nowrap;
}

/* Legend dots */
.dot{ border-radius: 9999px; display:inline-block; }
.dot--empty{ background: var(--accent-yellow); }
.dot--past{ background: #5b4a6a; }
.dot--left{ background: #cbc9c8; }

/* Dot matrix */
.matrix__dot--on{ background: var(--accent-yellow); }
.matrix__dot--off{ background: #e3e1e0; }
