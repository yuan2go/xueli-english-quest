# Paper Trail / tabby production assets

`references/`: **historical** page references from the tabby cutover, retained only as generation provenance. Their 12-challenge HUD and page layouts are superseded by docs/03 and docs/11–12. Correct/Wrong/Hint use Core Game states; Pause/Recovery use the Tutorial paper overlay treatment. Chinese product text and lowercase Arial letter blocks are real DOM. Reference decorative leaves/signs are intentionally omitted from runtime. References never become whole-page backgrounds.

`masters/`: native individual PNG outputs, not screenshot crops or upscales. `src/content/visual-assets.ts` is the single authoritative runtime image registry (including native master hash, alpha, bytes, dimensions, display bound and provenance). Runtime files live in `public/assets/game/tabby/`.

Identity: brown-grey tabby, dark stripes, golden eyes, pale muzzle; gray collar with white round tracker on viewer-right, green scarf below it, olive pack. No horizontal mirroring. Idle also serves teaching; thinking serves hint/correction; action serves crossing and ordinary success. The original user-confirmed celebration WebP from PR #5 is used at <=220 CSS px in the ending only; its original high resolution PNG was not found locally, so no master is claimed for that reused pose. Paper token uses the idle image within an explicit paper mount, never as the companion instance.

Runtime preparation: Pillow, WebP quality 88/method 6. Original PNGs are retained untouched. Alpha subject bounds are downsampled to 86% width / 88% height on 768px character or 512px prop canvases; baseline 94%. Backgrounds downsample to 1440x960. No recoloring, upscaling, mirroring or page-reference cropping. Actual alpha range 0–255 on every transparent master and runtime. Light-paper and dark-green compositing inspected, locator remains visible.

Generated with the built-in imagegen tool in this task; no external paid service or API credentials used. Model version and seed were not exposed. `generation-record.json` records prompts/briefs and actual processing. Visual use does not approve licensing, teaching, audio or public release; release gate remains strict.
