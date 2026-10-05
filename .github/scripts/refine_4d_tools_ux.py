from pathlib import Path


def replace_exact(path, old, new, count=1):
    p = Path(path)
    text = p.read_text()
    actual = text.count(old)
    if actual != count:
        raise SystemExit(f"{path}: expected {count} occurrence(s), found {actual}")
    p.write_text(text.replace(old, new, count))


old_block = '''    <details class="control-section insight-section perception-details">
      <summary class="perception-summary">
        <span class="control-section__label">4D inspection</span>
        <span class="control-section__note">optional · exact W sections</span>
      </summary>
      <div class="perception-body">
        <div class="segmented segmented--three insight-modes" id="insightControl">
          <button type="button" data-insight="standard" class="is-active">Standard</button>
          <button type="button" data-insight="w-slice" title="Show one exact intrinsic-W 3D section of the hypersolid">W slice</button>
          <button type="button" data-insight="w-layers" title="Show several exact intrinsic-W 3D sections simultaneously">W layers</button>
        </div>
        <div class="insight-range" id="wSliceControl">
          <span>W section</span>
          <input id="wSliceInput" type="range" min="0" max="1" step="0.01" value="0.5" aria-label="Intrinsic W section position" />
          <output id="wSliceValue">50%</output>
        </div>
        <div class="insight-actions">
          <button id="replay4D" type="button" title="Replay the exact 3D to 4D construction">Replay 3D → 4D</button>
        </div>
        <p class="insight-note">
          W slice/layers are exact 3D sections of the intrinsic 4D construction.
          X-ray is only an inspection aid; it is not claimed as literal 4D vision.
        </p>
      </div>
    </details>'''

new_block = '''    <details class="control-section insight-section perception-details">
      <summary
        class="perception-summary"
        title="Optional tools for inspecting exact 3D cross-sections through the 4D geometry"
      >
        <span class="control-section__label">4D tools</span>
      </summary>
      <div class="perception-body">
        <div class="perception-tool-label">Cross-section</div>
        <div class="segmented segmented--three insight-modes" id="insightControl">
          <button type="button" data-insight="standard" class="is-active">Off</button>
          <button type="button" data-insight="w-slice" title="Show one exact 3D cross-section at a chosen W position">1 slice</button>
          <button type="button" data-insight="w-layers" title="Show five exact 3D cross-sections across W">5 slices</button>
        </div>
        <div class="insight-range perception-range" id="wSliceControl">
          <span>Position in W</span>
          <input id="wSliceInput" type="range" min="0" max="1" step="0.01" value="0.5" aria-label="Position of the 3D cross-section along W" />
          <output id="wSliceValue">50%</output>
        </div>
        <button
          id="replay4D"
          class="perception-replay"
          type="button"
          title="Replay the construction from the 3D form into its 4D extension"
        >Replay 3D → 4D</button>
      </div>
    </details>'''
replace_exact('public/index.html', old_block, new_block)

old_xray = '''      <button
        type="button"
        class="inspection-toggle"
        data-render="xray"
        title="Inspection mode: alpha-composite projected layers without depth occlusion. Not a literal simulation of 4D eyesight."
      >X-ray inspection</button>'''
new_xray = '''      <button
        type="button"
        class="inspection-toggle"
        data-render="xray"
        title="Make projected surfaces translucent so hidden geometry can be seen. This is a transparency aid, not a simulation of 4D eyesight."
      >Transparent</button>'''
replace_exact('public/index.html', old_xray, new_xray)

old_css = '''/* 4D perception controls: intentionally compact and secondary. */

.perception-details {
  padding-block: 0;
}

.perception-summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 12px 0;
  cursor: pointer;
  list-style: none;
}

.perception-summary::-webkit-details-marker {
  display: none;
}

.perception-summary::after {
  content: '⌄';
  color: rgba(238,239,242,.38);
  font-size: 12px;
  transition: transform 160ms ease;
}

.perception-details[open] .perception-summary::after {
  transform: rotate(180deg);
}

.perception-body {
  padding: 0 0 12px;
}

.inspection-toggle {
  width: 100%;
  margin-top: 7px;
  padding: 7px 10px;
  border: 1px solid rgba(238,239,242,.10);
  border-radius: 9px;
  background: rgba(238,239,242,.025);
  color: rgba(238,239,242,.52);
  font: inherit;
  font-size: 11px;
  cursor: pointer;
}

.inspection-toggle:hover {
  border-color: rgba(240,196,92,.28);
  color: rgba(238,239,242,.76);
}

.inspection-toggle.is-active {
  border-color: rgba(240,196,92,.42);
  background: rgba(240,196,92,.08);
  color: #f0c45c;
}

@media (max-width: 760px) {
  .perception-summary {
    padding-block: 11px;
  }
}'''

new_css = '''/* 4D tools stay compact and secondary to the core explorer controls. */

.perception-details {
  padding-block: 0;
}

.perception-summary {
  display: flex;
  align-items: center;
  min-height: 38px;
  padding: 0;
  cursor: pointer;
  list-style: none;
}

.perception-summary::-webkit-details-marker {
  display: none;
}

.perception-summary::after {
  content: '⌄';
  margin-left: auto;
  color: rgba(238,239,242,.34);
  font-size: 11px;
  transition: transform 160ms ease;
}

.perception-details[open] .perception-summary::after {
  transform: rotate(180deg);
}

.perception-body {
  padding: 0 0 10px;
}

.perception-tool-label {
  margin: 2px 0 7px;
  color: rgba(238,239,242,.46);
  font-size: 10px;
  font-weight: 600;
  letter-spacing: .05em;
  text-transform: uppercase;
}

.perception-range {
  display: grid;
  grid-template-columns: auto minmax(70px, 1fr) 34px;
  align-items: center;
  gap: 8px;
  margin-top: 10px;
}

#wSliceControl.is-disabled {
  display: none;
}

.perception-range > span,
.perception-range > output {
  color: rgba(238,239,242,.56);
  font-size: 10px;
  line-height: 1;
  white-space: nowrap;
}

.perception-range > output {
  text-align: right;
  font-variant-numeric: tabular-nums;
}

.perception-range input[type='range'] {
  min-width: 0;
  width: 100%;
}

.perception-replay {
  margin-top: 9px;
  padding: 4px 0;
  border: 0;
  background: transparent;
  color: rgba(238,239,242,.52);
  font: inherit;
  font-size: 10px;
  cursor: pointer;
}

.perception-replay:hover:not(:disabled) {
  color: rgba(238,239,242,.80);
}

.perception-replay:disabled {
  opacity: .32;
  cursor: default;
}

.inspection-toggle {
  width: 100%;
  margin-top: 7px;
  padding: 6px 10px;
  border: 1px solid rgba(238,239,242,.09);
  border-radius: 8px;
  background: transparent;
  color: rgba(238,239,242,.48);
  font: inherit;
  font-size: 10px;
  cursor: pointer;
}

.inspection-toggle:hover {
  border-color: rgba(240,196,92,.24);
  color: rgba(238,239,242,.74);
}

.inspection-toggle.is-active {
  border-color: rgba(240,196,92,.38);
  background: rgba(240,196,92,.07);
  color: #f0c45c;
}

@media (max-width: 760px) {
  .perception-summary {
    min-height: 36px;
  }

  .perception-range {
    grid-template-columns: auto minmax(80px, 1fr) 32px;
  }
}'''
replace_exact('public/styles.css', old_css, new_css)

old_readme = '''- **X-ray inspection** — optional translucent inspection of projected layers. Transparent triangles are composited back-to-front without depth writes so hidden projected layers remain visible. This is an explanatory tool, **not** a claim that a 4D observer sees through opaque 4D matter.

The collapsed **4D inspection** disclosure exposes exact intrinsic-W sections and several simultaneous W layers. These are 3D sections of the actual 4D construction, not screen-space clipping. A hypothetical 4D observer would have a 3D retinal image: a visible 3D boundary cell can therefore be perceived volumetrically, while other 3D boundary cells may still occlude it. Hypermandala's ordinary screen render remains a 2D visualization of the projected geometry rather than a literal simulation of such a retina.'''
new_readme = '''- **Transparent** — optional translucent inspection of projected layers. Transparent triangles are composited back-to-front without depth writes so hidden projected geometry remains visible. It is simply a see-through inspection aid, **not** a simulation of 4D eyesight.

The collapsed **4D tools** disclosure exposes one exact intrinsic-W 3D cross-section or five simultaneous sections. These are sections of the actual 4D construction, not screen-space clipping. A hypothetical 4D observer would have a 3D retinal image: a visible 3D boundary cell can therefore be perceived volumetrically, while other 3D boundary cells may still occlude it. Hypermandala's ordinary screen render remains a 2D visualization of the projected geometry rather than a literal simulation of such a retina.'''
replace_exact('README.md', old_readme, new_readme)

index = Path('public/index.html').read_text()
css = Path('public/styles.css').read_text()
assert '>4D tools<' in index
assert '>Off<' in index and '>1 slice<' in index and '>5 slices<' in index
assert '>Transparent<' in index
assert 'X-ray inspection' not in index
assert '#wSliceControl.is-disabled' in css
assert 'insight-note' not in new_block
print('4D tools UX patch applied successfully')
