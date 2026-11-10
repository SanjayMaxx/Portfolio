# Design and QA notes

## Art direction

Warm paper, deep ink blue, coral, and citron replace the previous black-and-purple template feel. The layout uses oversized editorial headlines, alternating light/dark chapters, a persistent progress indicator, and a full-screen chapter index.

## 3D decision

The provided GLB was inspected and contains `idle`, `walk`, `run`, `wave`, and `jump`. Its blocky character aesthetic does not match the professional visual direction, so the portfolio uses a custom Three.js signal core instead of presenting it as Sanjay's portrait. The core uses a translucent faceted shell, rotating inner mesh, metallic orbit rings, connected nodes, dust points, colored lights, pointer response, and gentle motion.

## Browser and build checks

- Next.js static production build completed successfully.
- Local production preview returned HTTP 200 and served the updated page.
- Browser accessibility tree confirmed all six chapters, project details, toolkit controls, contact links, and the 3D visualization landmark.
- Chapter index opened and exposed all six navigation controls.
- Mobile viewport screenshot checked for the opening and contact sections.
- Reduced-motion path disables smooth scrolling and reveals content without scroll animations.
