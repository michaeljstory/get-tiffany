if (!(window.__gt_rig_embed)) window.loadGTPageChrome?.();
(function(){
  const POSES = ['idle','fists','vsign','roses','pants','trip'];
  const NON_TRIP_POSES = ['idle','fists','vsign','roses','pants'];
  const CLEAR_SENTINEL = '__GT_RIG_CLEAR__';
  const ASSET_SUGGESTIONS = [
    '/Assets/Customiser/poses/fists/hands/hand_left_fists_master.png',
    '/Assets/Customiser/poses/fists/hands/hand_right_fists_master.png',
    '/Assets/Customiser/poses/shared/hands/hand_left_cream.png',
    '/Assets/Customiser/poses/shared/hands/hand_right_cream.png',
    '/Assets/Customiser/poses/trip/underbody/underbody_trip_cream.png',
    '/Assets/Customiser/poses/trip/shirts/top1/shirt_trip_red.png',
    '/Assets/Customiser/poses/trip/pants/pants1/trousers_trip_red.png',
    '/Assets/Customiser/masters/bodies/body_roses_master.png',
    '/Assets/Customiser/poses/roses/hand/roses_hand_master.png'
  ];
  const SHARED_SOURCE_RULES = {
    roses: { head:'idle', shirt:'idle' },
    pants: { head:'idle', shirt:'idle' }
  };

  const SLOT_SETS = {
    idle: [
      { key:'underbody', label:'Underbody' }, { key:'pants', label:'Trousers' }, { key:'belt', label:'Belt' }, { key:'shoes', label:'Shoes' },
      { key:'shirt', label:'Shirt' }, { key:'head', label:'Head' }, { key:'face', label:'Face' }, { key:'hair', label:'Hair' }, { key:'hat', label:'Hat' }
    ],
    fists: [
      { key:'underbody', label:'Underbody' }, { key:'pants', label:'Trousers' }, { key:'belt', label:'Belt' }, { key:'shoes', label:'Shoes' },
      { key:'hand_left', label:'Left fist' }, { key:'shirt', label:'Shirt' }, { key:'head', label:'Head' }, { key:'face', label:'Face' },
      { key:'hair', label:'Hair' }, { key:'hat', label:'Hat' }, { key:'hand_right', label:'Right fist' }
    ],
    vsign: [
      { key:'underbody', label:'Underbody' }, { key:'pants', label:'Trousers' }, { key:'belt', label:'Belt' }, { key:'shoes', label:'Shoes' },
      { key:'shirt', label:'Shirt' }, { key:'head', label:'Head' }, { key:'face', label:'Face' }, { key:'hair', label:'Hair' }, { key:'hat', label:'Hat' },
      { key:'hand_left', label:'Left hand' }, { key:'hand_right', label:'V-sign hand' }
    ],
    roses: [
      { key:'underbody', label:'Underbody' }, { key:'pants', label:'Trousers' }, { key:'belt', label:'Belt' }, { key:'shoes', label:'Shoes' },
      { key:'shirt', label:'Shirt' }, { key:'head', label:'Head' }, { key:'face', label:'Face' }, { key:'hair', label:'Hair' }, { key:'hat', label:'Hat' },
      { key:'hand_right', label:'Rose hand' }, { key:'accessory', label:'Roses prop' }
    ],
    pants: [
      { key:'underbody', label:'Underbody' }, { key:'pants', label:'Lowered trousers' }, { key:'belt', label:'Waist / belt' }, { key:'shoes', label:'Shoes' },
      { key:'hand_left', label:'Left hand' }, { key:'shirt', label:'Shirt / boxers body' }, { key:'head', label:'Head' }, { key:'face', label:'Face' },
      { key:'hair', label:'Hair' }, { key:'hat', label:'Hat' }, { key:'hand_right', label:'Right hand' }
    ],
    trip: [
      { key:'underbody', label:'Trip underbody' }, { key:'pants', label:'Trip trousers' }, { key:'belt', label:'Trip waist' }, { key:'shoes', label:'Trip shoes' },
      { key:'hand_left', label:'Trip left hand' }, { key:'shirt', label:'Trip shirt' }, { key:'head', label:'Trip head' }, { key:'face', label:'Trip face' },
      { key:'hair', label:'Trip hair' }, { key:'hat', label:'Trip hat' }, { key:'hand_right', label:'Trip right hand' }
    ]
  };

  const NORMALISE_KEYS = {
    roses: ['underbody','pants','belt','shoes','shirt','head','face','hair','hat'],
    pants: ['underbody','pants','belt','shoes','shirt','head','face','hair','hat'],
    trip: ['underbody','pants','belt','shoes','shirt','head','face','hair','hat']
  };

  const state = {
    rig: null,
    manifest: {},
    pose: 'idle',
    selectedLayerKey: 'underbody',
    previewOverrides: {},
    rigAssets: [],
    imageRatios: {},
    renderTick: 0,
    showBoxes: true,
    showGuide: false,
    snapToGrid: true,
    gridSize: 2,
    drag: null,
    resolvedPoseLayers: {}
  };
  const els = {};

  function $(id){ return document.getElementById(id); }
  function esc(s){ return String(s || '').replace(/[&<>"']/g, (ch) => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[ch])); }
  function slotOptions(){ return SLOT_SETS[state.pose] || SLOT_SETS.idle; }
  function slotLabel(key){ return (slotOptions().find((s) => s.key === key) || Object.values(SLOT_SETS).flat().find((s) => s.key === key) || { label:key }).label; }
  function showStatus(type, msg){ const el = els.status; if (!el) return; el.className = `status show ${type === 'ok' ? 'ok' : 'err'}`; el.textContent = msg || ''; }
  function clearStatus(){ const el = els.status; if (!el) return; el.className = 'status'; el.textContent = ''; }
  function snap(v){ const n = Number(v || 0); return state.snapToGrid ? Math.round(n / Math.max(1, state.gridSize)) * Math.max(1, state.gridSize) : Math.round(n); }
  function baseCfg(){
    return window.GTCharacterRenderer.normaliseConfig({
      pilot_enabled:true,
      supportedPoses:{ idle:true, fists:true, vsign:true, roses:true, flowers:true, pants:true, trip:true }
    });
  }
  function isUploadedRigAsset(src){ return String(src || '').startsWith('/uploads/rig/'); }
  function poseHelpers(pose, cfg){
    const skin = String(cfg?.skinColor || 'cream').toLowerCase();
    const shirt = String(cfg?.shirtColor || 'red').toLowerCase();
    const pants = String(cfg?.pantsColor || 'red').toLowerCase();
    const design = String(cfg?.pantsDesign || 'pants1').toLowerCase();
    return {
      roses: {
        underbody:'/Assets/Customiser/masters/bodies/body_roses_master.png',
        hand_right:'/Assets/Customiser/poses/fists/hands/hand_right_fists_master.png',
        accessory:'/Assets/Customiser/poses/roses/hand/roses_hand_master.png'
      },
      pants: {
        hand_left:`/Assets/Customiser/poses/shared/hands/hand_left_${skin}.png`,
        hand_right:`/Assets/Customiser/poses/shared/hands/hand_right_${skin}.png`
      },
      trip: {
        underbody:`/Assets/Customiser/poses/trip/underbody/underbody_trip_${skin}.png`,
        shirt:`/Assets/Customiser/poses/trip/shirts/top1/shirt_trip_${shirt}.png`,
        pants:`/Assets/Customiser/poses/trip/pants/${design}/trousers_trip_${pants}.png`,
        hand_left:`/Assets/Customiser/poses/shared/hands/hand_left_${skin}.png`,
        hand_right:`/Assets/Customiser/poses/shared/hands/hand_right_${skin}.png`
      }
    }[String(pose || '').toLowerCase()] || {};
  }
  function getSharedSourcePose(pose, key){
    return SHARED_SOURCE_RULES?.[pose]?.[key] || '';
  }
  function getEffectivePreviewPose(pose, key){
    return getSharedSourcePose(pose, key) || pose;
  }
  function getEffectiveEditPose(pose, key){
    const sharedPose = getSharedSourcePose(pose, key);
    return sharedPose || pose;
  }
  function defaultLayerSrc(pose, key){
    const helpers = poseHelpers(pose, baseCfg());
    if (helpers[key]) return helpers[key];
    if (key === 'head') return '/Assets/Customiser/heads/head1/heads_std_cream.png';
    if (key === 'underbody') return pose === 'trip' ? '/Assets/Customiser/poses/trip/underbody/underbody_trip_cream.png' : (pose === 'roses' ? '/Assets/Customiser/masters/bodies/body_roses_master.png' : '/Assets/Customiser/body/underbody_nohead_cream.png');
    if (key === 'hand_left' && ['pants','trip'].includes(pose)) return `/Assets/Customiser/poses/shared/hands/hand_left_${String(baseCfg().skinColor || 'cream').toLowerCase()}.png`;
    if (key === 'hand_right' && ['pants','trip'].includes(pose)) return `/Assets/Customiser/poses/shared/hands/hand_right_${String(baseCfg().skinColor || 'cream').toLowerCase()}.png`;
    if (key === 'hand_right' && pose === 'roses') return '/Assets/Customiser/poses/fists/hands/hand_right_fists_master.png';
    if (key === 'accessory' && pose === 'roses') return '/Assets/Customiser/poses/roses/hand/roses_hand_master.png';
    return '';
  }
  function getStoredPreview(pose, key){
    const effectivePose = getEffectivePreviewPose(pose, key);
    return state.previewOverrides?.[effectivePose]?.[key];
  }
  function getPreviewSrc(pose, key){
    const raw = getStoredPreview(pose, key);
    if (raw === CLEAR_SENTINEL) return '';
    return raw || '';
  }
  function setPreviewSrc(pose, key, src){
    const targetPose = getEffectiveEditPose(pose, key);
    state.previewOverrides[targetPose] = state.previewOverrides[targetPose] || {};
    const clean = String(src || '').trim();
    if (clean) state.previewOverrides[targetPose][key] = clean;
    else delete state.previewOverrides[targetPose][key];
    if (!Object.keys(state.previewOverrides[targetPose] || {}).length) delete state.previewOverrides[targetPose];
    syncPreviewSources();
    delete state.resolvedPoseLayers[pose];
    delete state.resolvedPoseLayers[targetPose];
  }
  function clearPreviewSrc(pose, key){
    const targetPose = getEffectiveEditPose(pose, key);
    state.previewOverrides[targetPose] = state.previewOverrides[targetPose] || {};
    state.previewOverrides[targetPose][key] = CLEAR_SENTINEL;
    syncPreviewSources();
    delete state.resolvedPoseLayers[pose];
    delete state.resolvedPoseLayers[targetPose];
  }
  function restorePreviewSrc(pose, key){
    const targetPose = getEffectiveEditPose(pose, key);
    if (state.previewOverrides[targetPose]) delete state.previewOverrides[targetPose][key];
    if (!Object.keys(state.previewOverrides[targetPose] || {}).length) delete state.previewOverrides[targetPose];
    syncPreviewSources();
    delete state.resolvedPoseLayers[pose];
    delete state.resolvedPoseLayers[targetPose];
  }
  function syncPreviewSources(){
    if (!state.rig) return;
    state.rig.previewSources = JSON.parse(JSON.stringify(state.previewOverrides || {}));
  }
  function effectiveEditPoses(key){
    return [state.pose];
  }
  function getRect(key){
    const rig = state.rig;
    return { ...(rig?.defaults?.[state.pose]?.[key] || rig?.defaults?.idle?.[key] || { x:0, y:0, w:100 }) };
  }
  function saveRect(key, rect){
    if (!state.rig) return;
    const next = {
      x: snap(rect.x || 0),
      y: snap(rect.y || 0),
      w: Math.max(8, snap(rect.w || 100))
    };
    for (const pose of effectiveEditPoses(key)) {
      state.rig.defaults[pose] = state.rig.defaults[pose] || {};
      state.rig.defaults[pose][key] = { ...next };
      delete state.resolvedPoseLayers[pose];
    }
  }
  function resetSelectedSlot(){
    if (!state.rig) return;
    const fallback = state.rig.defaults?.idle?.[state.selectedLayerKey];
    if (!fallback) return;
    saveRect(state.selectedLayerKey, fallback);
  }
  function resetCurrentPose(){
    if (!state.rig || state.pose === 'idle') return;
    const idleDefaults = state.rig.defaults?.idle || {};
    state.rig.defaults[state.pose] = JSON.parse(JSON.stringify(idleDefaults));
    state.rig.layerOrder[state.pose] = [...(state.rig.layerOrder.idle || defaultLayerOrder('idle'))];
    delete state.resolvedPoseLayers[state.pose];
  }
  function getRectForPose(pose, key){
    const rig = state.rig;
    return { ...(rig?.defaults?.[pose]?.[key] || rig?.defaults?.idle?.[key] || { x:0, y:0, w:100 }) };
  }
  function getPoseLayerMetrics(pose, keys){
    const metrics = [];
    for (const key of keys) {
      const src = currentSourceForPoseSlot(pose, key);
      if (!src) continue;
      const rect = getRectForPose(pose, key);
      const ratio = getRatio(src);
      const w = Math.max(8, Number(rect?.w || 100));
      const h = Math.max(18, Math.round(w * ratio));
      metrics.push({ key, src, rect, ratio, w, h, left:Number(rect.x||0), top:Number(rect.y||0), right:Number(rect.x||0)+w, bottom:Number(rect.y||0)+h, cx:Number(rect.x||0)+(w/2) });
    }
    return metrics;
  }
  function normalisePoseFromIdle(pose = state.pose){
    if (!state.rig || pose === 'idle') return;
    const keys = NORMALISE_KEYS[pose] || [];
    state.rig.defaults[pose] = state.rig.defaults[pose] || {};
    const idleMetrics = getPoseLayerMetrics('idle', keys);
    const poseMetrics = getPoseLayerMetrics(pose, keys);
    if (!idleMetrics.length || !poseMetrics.length) return;

    const idleTop = Math.min(...idleMetrics.map((m) => m.top));
    const idleBottom = Math.max(...idleMetrics.map((m) => m.bottom));
    const idleCenter = (Math.min(...idleMetrics.map((m) => m.left)) + Math.max(...idleMetrics.map((m) => m.right))) / 2;
    const poseTop = Math.min(...poseMetrics.map((m) => m.top));
    const poseBottom = Math.max(...poseMetrics.map((m) => m.bottom));
    const poseCenter = (Math.min(...poseMetrics.map((m) => m.left)) + Math.max(...poseMetrics.map((m) => m.right))) / 2;

    const idleHeight = Math.max(1, idleBottom - idleTop);
    const poseHeight = Math.max(1, poseBottom - poseTop);
    const scale = Math.min(2.25, Math.max(0.55, idleHeight / poseHeight));

    for (const metric of poseMetrics) {
      const newW = Math.max(8, snap(metric.w * scale));
      const newH = Math.max(18, Math.round(newW * metric.ratio));
      const centerOffset = (metric.cx - poseCenter) * scale;
      const bottomGap = (poseBottom - metric.bottom) * scale;
      const newX = snap(idleCenter + centerOffset - (newW / 2));
      const newY = snap(idleBottom - bottomGap - newH);
      state.rig.defaults[pose][metric.key] = { x:newX, y:newY, w:newW };
    }
    delete state.resolvedPoseLayers[pose];
  }
  function copyCurrentPoseFromIdle(){
    if (!state.rig || state.pose === 'idle') return;
    normalisePoseFromIdle(state.pose);
    const order = getLayerOrder(state.pose);
    state.rig.layerOrder[state.pose] = [...order];
  }
  function defaultLayerOrder(pose){
    return slotOptionsFor(pose).map((s) => s.key);
  }
  function slotOptionsFor(pose){ return SLOT_SETS[pose] || SLOT_SETS.idle; }
  function getLayerOrder(pose){
    if (!state.rig) return defaultLayerOrder(pose);
    const saved = Array.isArray(state.rig.layerOrder?.[pose]) ? state.rig.layerOrder[pose] : [];
    const required = defaultLayerOrder(pose);
    const out = [];
    saved.forEach((key) => { if (required.includes(key) && !out.includes(key)) out.push(key); });
    required.forEach((key) => { if (!out.includes(key)) out.push(key); });
    return out;
  }
  function moveSelectedLayer(direction){
    if (!state.rig) return;
    const order = getLayerOrder(state.pose);
    const key = state.selectedLayerKey;
    let idx = order.indexOf(key);
    if (idx < 0) return;
    if (direction === 'back' && idx > 0) { order.splice(idx,1); order.unshift(key); }
    if (direction === 'front' && idx >= 0) { order.splice(idx,1); order.push(key); }
    if (direction === 'backward' && idx > 0) [order[idx-1], order[idx]] = [order[idx], order[idx-1]];
    if (direction === 'forward' && idx < order.length - 1) [order[idx+1], order[idx]] = [order[idx], order[idx+1]];
    state.rig.layerOrder[state.pose] = order;
  }
  function getResolvedLayerMap(pose){
    return new Map(((state.resolvedPoseLayers && state.resolvedPoseLayers[pose]) || []).map((l) => [l.key, l.src]));
  }
  function currentSourceForPoseSlot(pose, key){
    const effectivePose = getEffectivePreviewPose(pose, key);
    const previewValue = getStoredPreview(pose, key);
    if (previewValue === CLEAR_SENTINEL) return '';
    const map = getResolvedLayerMap(effectivePose);
    return previewValue || map.get(key) || defaultLayerSrc(effectivePose, key) || '';
  }
  function currentSourceForSlot(key){
    return currentSourceForPoseSlot(state.pose, key);
  }
  function buildStageLayers(){
    const order = getLayerOrder(state.pose);
    return order.map((key) => {
      const src = currentSourceForSlot(key);
      const rect = getRect(key);
      return {
        key,
        label: slotLabel(key),
        src,
        rect,
        empty: !src,
        selected: key === state.selectedLayerKey
      };
    });
  }
  function getRatio(src){
    const n = Number(state.imageRatios[String(src || '').trim()] || 0);
    return (Number.isFinite(n) && n > 0) ? n : 1;
  }
  function rememberRatio(src, ratio){
    if (!src) return;
    if (ratio && Number.isFinite(ratio) && ratio > 0) state.imageRatios[src] = ratio;
  }
  function layerHeight(layer){
    const w = Math.max(8, Number(layer.rect?.w || 100));
    return Math.max(18, Math.round(w * getRatio(layer.src)));
  }
  function preloadRatio(src){
    if (!src || state.imageRatios[src]) return;
    const img = new Image();
    img.onload = () => {
      const ratio = Number(img.naturalHeight || img.height || 1) / Math.max(1, Number(img.naturalWidth || img.width || 1));
      rememberRatio(src, ratio);
      renderStage();
    };
    img.src = src;
  }
  let previewRefreshTimer = null;
  function queuePreviewRefresh(){
    if (previewRefreshTimer) clearTimeout(previewRefreshTimer);
    previewRefreshTimer = setTimeout(() => {
      previewRefreshTimer = null;
      refreshGamePreview();
    }, 40);
  }
  function renderStage(){
    const stage = els.stage;
    if (!stage) return;
    if (!state.resolvedPoseLayers[state.pose]) refreshResolvedPoseLayers(state.pose).then(() => { if (state.pose) renderStage(); });
    const layers = buildStageLayers();
    const guideSrc = ({ idle:'/Assets/Customiser/body/underbody_std_cream.png', fists:'/Assets/Customiser/poses/fists/underbody/underbody_fists_master.png', vsign:'/Assets/Customiser/poses/vsign/underbody/underbody_vsign_cream.png', roses:'/Assets/Customiser/masters/bodies/body_roses_master.png', pants:'/Assets/Customiser/body/underbody_std_cream.png', trip:'/Assets/Customiser/poses/trip/underbody/underbody_trip_cream.png' })[state.pose] || '/Assets/Customiser/body/underbody_std_cream.png';
    const html = [`<div class="stageInner">`];
    if (state.showGuide) html.push(`<img class="guide" src="${esc(guideSrc)}" alt="" />`);
    for (const layer of layers) {
      if (layer.src) {
        preloadRatio(layer.src);
        const h = layerHeight(layer);
        html.push(`<img class="layer${state.showBoxes ? ' box' : ''}" data-layer="${esc(layer.key)}" src="${esc(layer.src)}" style="left:${Math.round(layer.rect.x)}px;top:${Math.round(layer.rect.y)}px;width:${Math.round(layer.rect.w)}px;height:${Math.round(h)}px;z-index:${100 + getLayerOrder(state.pose).indexOf(layer.key)}" alt="" draggable="false" />`);
      } else {
        const h = Math.max(24, Math.round(Number(layer.rect.w || 100) * 0.9));
        html.push(`<div class="ghost${state.showBoxes ? ' box' : ''}" data-layer="${esc(layer.key)}" style="left:${Math.round(layer.rect.x)}px;top:${Math.round(layer.rect.y)}px;width:${Math.round(layer.rect.w)}px;height:${Math.round(h)}px;z-index:${100 + getLayerOrder(state.pose).indexOf(layer.key)}"><span>${esc(layer.label)}</span></div>`);
      }
    }
    const selected = layers.find((l) => l.key === state.selectedLayerKey);
    if (selected) {
      const h = selected.src ? layerHeight(selected) : Math.max(24, Math.round(Number(selected.rect.w || 100) * 0.9));
      html.push(`<div class="selectionFrame" style="left:${Math.round(selected.rect.x)}px;top:${Math.round(selected.rect.y)}px;width:${Math.round(selected.rect.w)}px;height:${Math.round(h)}px"><span class="selectionMove" data-selection-move="1">${esc(selected.label)}</span><span class="selectionResize" data-selection-resize="1"></span></div>`);
    }
    html.push(`</div>`);
    stage.innerHTML = html.join('');
    bindStagePointers();
    renderInspector();
    queuePreviewRefresh();
  }
  function renderPosePills(){
    els.posePills.innerHTML = POSES.map((pose) => `<button class="pill${pose === state.pose ? ' active' : ''}" type="button" data-pose="${esc(pose)}">${esc(pose)}</button>`).join('');
    els.posePills.querySelectorAll('[data-pose]').forEach((btn) => btn.addEventListener('click', () => {
      state.pose = btn.dataset.pose;
      if (!slotOptions().some((s) => s.key === state.selectedLayerKey)) state.selectedLayerKey = slotOptions()[0].key;
      clearStatus();
      renderAll();
    }));
  }
  function renderSlotButtons(){
    els.slotList.innerHTML = slotOptions().map((slot) => `<button class="btn secondary slotBtn${slot.key === state.selectedLayerKey ? ' active' : ''}" type="button" data-slot="${esc(slot.key)}">${esc(slot.label)}</button>`).join('');
    els.slotList.querySelectorAll('[data-slot]').forEach((btn) => btn.addEventListener('click', () => {
      state.selectedLayerKey = btn.dataset.slot;
      renderAll();
    }));
  }
  function renderInspector(){
    const rect = getRect(state.selectedLayerKey);
    const sharedPose = getSharedSourcePose(state.pose, state.selectedLayerKey);
    const targetPose = getEffectiveEditPose(state.pose, state.selectedLayerKey);
    els.fieldX.value = Math.round(rect.x || 0);
    els.fieldY.value = Math.round(rect.y || 0);
    els.fieldW.value = Math.round(rect.w || 100);
    els.selectionMeta.textContent = sharedPose ? `${slotLabel(state.selectedLayerKey)} • ${state.pose} • asset shared from ${sharedPose}` : `${slotLabel(state.selectedLayerKey)} • ${state.pose}`;
    els.assetPathInput.value = getPreviewSrc(targetPose, state.selectedLayerKey) || currentSourceForSlot(state.selectedLayerKey) || '';
    renderLayerOrder();
    renderAssetGallery();
  }
  function renderLayerOrder(){
    const order = getLayerOrder(state.pose);
    els.layerOrder.innerHTML = order.map((key) => `<div class="row${key === state.selectedLayerKey ? ' active' : ''}" data-row-slot="${esc(key)}"><div><strong>${esc(slotLabel(key))}</strong><div class="tiny muted">${esc(key)}</div></div><div class="rowActions"><button class="pill" type="button" data-row-front="${esc(key)}">Top</button></div></div>`).join('');
    els.layerOrder.querySelectorAll('[data-row-slot]').forEach((row) => row.addEventListener('click', () => { state.selectedLayerKey = row.dataset.rowSlot; renderAll(); }));
    els.layerOrder.querySelectorAll('[data-row-front]').forEach((btn) => btn.addEventListener('click', (e) => { e.stopPropagation(); state.selectedLayerKey = btn.dataset.rowFront; moveSelectedLayer('front'); renderStage(); }));
  }
  function refreshAssetSuggestions(){
    const values = Array.from(new Set([...ASSET_SUGGESTIONS, ...(state.rigAssets || [])])).filter(Boolean);
    els.assetPathList.innerHTML = values.map((src) => `<option value="${esc(src)}"></option>`).join('');
  }
  function renderAssetGallery(){
    const current = getPreviewSrc(state.pose, state.selectedLayerKey);
    els.assetGallery.innerHTML = (state.rigAssets || []).map((src) => {
      const active = current === src ? ' active' : '';
      return `<div class="assetCard${active}" data-asset-src="${esc(src)}"><button class="assetDelete" type="button" data-delete-asset="${esc(src)}">×</button><img class="assetThumb" src="${esc(src)}" alt="" /><div class="assetName">${esc(src.split('/').pop() || src)}</div><div class="assetMeta">uploaded rig asset</div></div>`;
    }).join('') || '<div class="tiny">No uploaded rig assets yet.</div>';
    els.assetGallery.querySelectorAll('[data-asset-src]').forEach((card) => card.addEventListener('click', (e) => {
      if (e.target.closest('[data-delete-asset]')) return;
      const src = card.dataset.assetSrc || '';
      if (!src) return;
      setPreviewSrc(state.pose, state.selectedLayerKey, src);
      renderAll();
      showStatus('ok', `${slotLabel(state.selectedLayerKey)} now uses the uploaded asset.`);
    }));
    els.assetGallery.querySelectorAll('[data-delete-asset]').forEach((btn) => btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const src = btn.dataset.deleteAsset || '';
      if (!src) return;
      try {
        const r = await fetch(`/api/admin/rig-assets?path=${encodeURIComponent(src)}`, { method:'DELETE', credentials:'same-origin' });
        const j = await r.json().catch(() => ({}));
        if (!r.ok || !j.ok) throw new Error(j.error || 'Could not delete rig asset.');
        Object.keys(state.previewOverrides || {}).forEach((pose) => {
          Object.keys(state.previewOverrides[pose] || {}).forEach((key) => {
            if (state.previewOverrides[pose][key] === src) delete state.previewOverrides[pose][key];
          });
          if (!Object.keys(state.previewOverrides[pose] || {}).length) delete state.previewOverrides[pose];
        });
        syncPreviewSources();
        await loadRigAssets();
        renderAll();
        showStatus('ok', 'Uploaded rig asset deleted.');
      } catch (err) {
        showStatus('err', err.message || 'Could not delete rig asset.');
      }
    }));
  }
  function bindStagePointers(){
    els.stage.querySelectorAll('[data-layer]').forEach((node) => {
      node.addEventListener('pointerdown', (e) => {
        const key = node.dataset.layer;
        if (!key) return;
        state.selectedLayerKey = key;
        startDrag('move', e, key);
        renderStage();
      });
    });
    const moveHandle = els.stage.querySelector('[data-selection-move]');
    if (moveHandle) moveHandle.addEventListener('pointerdown', (e) => startDrag('move', e, state.selectedLayerKey));
    const resizeHandle = els.stage.querySelector('[data-selection-resize]');
    if (resizeHandle) resizeHandle.addEventListener('pointerdown', (e) => startDrag('resize', e, state.selectedLayerKey));
  }
  function startDrag(mode, e, key){
    e.preventDefault();
    e.stopPropagation();
    const rect = getRect(key);
    state.drag = {
      mode,
      key,
      startX: e.clientX,
      startY: e.clientY,
      rect: { ...rect },
      pointerId: e.pointerId
    };
  }
  function onPointerMove(e){
    const drag = state.drag;
    if (!drag) return;
    if (drag.pointerId != null && e.pointerId != null && drag.pointerId !== e.pointerId) return;
    const dx = e.clientX - drag.startX;
    const dy = e.clientY - drag.startY;
    const next = { ...drag.rect };
    if (drag.mode === 'resize') next.w = Math.max(8, drag.rect.w + dx);
    else {
      next.x = drag.rect.x + dx;
      next.y = drag.rect.y + dy;
    }
    saveRect(drag.key, next);
    renderStage();
  }
  function onPointerUp(e){
    const drag = state.drag;
    if (!drag) return;
    if (drag.pointerId != null && e.pointerId != null && drag.pointerId !== e.pointerId) return;
    state.drag = null;
  }
  function loadPreviewImage(src){
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  }
  async function refreshResolvedPoseLayers(pose){
    if (!window.GTCharacterRenderer?.resolveLayerPreviewSources) return [];
    const previewSources = JSON.parse(JSON.stringify(state.previewOverrides || {}));
    const runtime = JSON.parse(JSON.stringify(state.rig || {}));
    runtime.previewSources = previewSources;
    const previous = window.__gtRigRuntime;
    window.__gtRigRuntime = runtime;
    try {
      const resolved = await window.GTCharacterRenderer.resolveLayerPreviewSources(baseCfg(), pose, state.manifest || {});
      const layers = Array.isArray(resolved?.layers) ? resolved.layers : [];
      state.resolvedPoseLayers[pose] = layers;
      return layers;
    } catch {
      state.resolvedPoseLayers[pose] = [];
      return [];
    } finally {
      window.__gtRigRuntime = runtime;
    }
  }

  async function refreshGamePreview(){
    if (!els.gamePosePreview || !window.GTCharacterRenderer?.resolveLayerPreviewSources) return;
    const tick = ++state.renderTick;
    try {
      await refreshResolvedPoseLayers(state.pose);
      if (tick !== state.renderTick) return;
      const order = getLayerOrder(state.pose);
      const layers = [];
      for (const key of order) {
        const previewValue = getStoredPreview(state.pose, key);
        if (previewValue === CLEAR_SENTINEL) continue;
        const src = currentSourceForSlot(key);
        if (!src) continue;
        layers.push({ key, src, rect: getRect(key) });
      }
      const loaded = [];
      for (const layer of layers) {
        try {
          const img = await loadPreviewImage(layer.src);
          loaded.push({ ...layer, img });
        } catch {}
      }
      if (!loaded.length) {
        els.gamePosePreview.removeAttribute('src');
        els.gamePreviewMeta.textContent = `Pose: ${state.pose} • No visible layers to preview yet.`;
        return;
      }

      const measured = loaded.map((entry) => {
        const iw = Number(entry.img.naturalWidth || entry.img.width || 1);
        const ih = Number(entry.img.naturalHeight || entry.img.height || 1);
        const drawW = Math.max(1, Number(entry.rect?.w || iw));
        const drawH = Math.max(1, Math.round((ih / Math.max(1, iw)) * drawW));
        const x = Number(entry.rect?.x || 0);
        const y = Number(entry.rect?.y || 0);
        return { ...entry, x, y, drawW, drawH, right:x + drawW, bottom:y + drawH };
      });

      const pad = 12;
      const minX = Math.min(...measured.map((m) => m.x));
      const minY = Math.min(...measured.map((m) => m.y));
      const maxX = Math.max(...measured.map((m) => m.right));
      const maxY = Math.max(...measured.map((m) => m.bottom));
      const logical = document.createElement('canvas');
      logical.width = Math.max(32, Math.ceil((maxX - minX) + (pad * 2)));
      logical.height = Math.max(32, Math.ceil((maxY - minY) + (pad * 2)));
      const lctx = logical.getContext('2d');
      lctx.clearRect(0, 0, logical.width, logical.height);
      lctx.imageSmoothingEnabled = true;
      for (const entry of measured) {
        lctx.drawImage(entry.img, Math.round(entry.x - minX + pad), Math.round(entry.y - minY + pad), Math.round(entry.drawW), Math.round(entry.drawH));
      }

      const preview = document.createElement('canvas');
      preview.width = 260;
      preview.height = 360;
      const pctx = preview.getContext('2d');
      pctx.clearRect(0, 0, preview.width, preview.height);
      pctx.imageSmoothingEnabled = true;

      const contentW = logical.width;
      const contentH = logical.height;
      const scale = Math.min((preview.width - 20) / Math.max(1, contentW), (preview.height - 20) / Math.max(1, contentH));
      const drawW = Math.round(contentW * scale);
      const drawH = Math.round(contentH * scale);
      const dx = Math.round((preview.width - drawW) / 2);
      const dy = Math.round(preview.height - drawH - 8);
      pctx.drawImage(logical, 0, 0, logical.width, logical.height, dx, dy, drawW, drawH);

      if (tick !== state.renderTick) return;
      els.gamePosePreview.src = preview.toDataURL('image/png');
      els.gamePreviewMeta.textContent = `Pose: ${state.pose} • Live in-game preview from the pose you are editing.`;
    } catch {
      if (tick !== state.renderTick) return;
      els.gamePosePreview.removeAttribute('src');
      els.gamePreviewMeta.textContent = `Pose: ${state.pose} • Game preview unavailable right now.`;
    }
  }
  async function saveRigToServer(){
    syncPreviewSources();
    const r = await fetch('/api/customisation/rig-save', {
      method:'POST',
      credentials:'same-origin',
      headers:{ 'Content-Type':'application/json' },
      body: JSON.stringify({ rig: state.rig })
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok || !j.ok) throw new Error(j.error || 'Could not save rig.');
    state.rig = window.GTCharacterRenderer.sanitiseRig(j.rig || state.rig);
    state.previewOverrides = JSON.parse(JSON.stringify(state.rig.previewSources || {}));
    state.resolvedPoseLayers = {};
    window.__gtRigRuntime = state.rig;
  }
  async function loadRigAssets(){
    const res = await fetch('/api/admin/rig-assets', { credentials:'same-origin' }).then((r) => r.json()).catch(() => ({ ok:false, assets:[] }));
    state.rigAssets = Array.isArray(res.assets) ? res.assets : [];
    refreshAssetSuggestions();
  }
  async function loadData(){
    await window.AdminAPI.ensureAdmin();
    const [manifestRes, rigRes] = await Promise.all([
      fetch('/api/customisation/item-manifest', { credentials:'same-origin' }).then((r) => r.json()),
      fetch('/api/customisation/rig-runtime', { credentials:'same-origin' }).then((r) => r.json())
    ]);
    state.manifest = manifestRes.items || {};
    state.rig = window.GTCharacterRenderer.sanitiseRig(rigRes.rig || null);
    state.previewOverrides = JSON.parse(JSON.stringify(state.rig.previewSources || {}));
    ['roses','pants','trip'].forEach((pose) => {
      const poseDefaults = state.rig?.defaults?.[pose] || {};
      if (!poseDefaults.head || !poseDefaults.shirt || !poseDefaults.underbody) normalisePoseFromIdle(pose);
    });
    state.resolvedPoseLayers = {};
    window.__gtRigRuntime = state.rig;
    state.resolvedPoseLayers = {};
    await loadRigAssets();
  }
  function applyNumericFields(){
    saveRect(state.selectedLayerKey, {
      x: Number(els.fieldX.value || 0),
      y: Number(els.fieldY.value || 0),
      w: Number(els.fieldW.value || 100)
    });
    renderAll();
  }
  function nudgeSelected(mode){
    const rect = getRect(state.selectedLayerKey);
    if (mode === 'left') rect.x -= state.gridSize;
    if (mode === 'right') rect.x += state.gridSize;
    if (mode === 'up') rect.y -= state.gridSize;
    if (mode === 'down') rect.y += state.gridSize;
    if (mode === 'grow') rect.w += state.gridSize;
    if (mode === 'shrink') rect.w -= state.gridSize;
    saveRect(state.selectedLayerKey, rect);
    renderAll();
  }
  async function uploadSelectedAsset(){
    const file = els.assetFileInput?.files?.[0];
    if (!file) return showStatus('err', 'Choose an image to upload first.');
    try {
      const fd = new FormData();
      fd.append('asset', file);
      const r = await fetch('/api/admin/rig-assets', { method:'POST', credentials:'same-origin', body:fd });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j.ok || !j.path) throw new Error(j.error || 'Could not upload rig asset.');
      setPreviewSrc(state.pose, state.selectedLayerKey, j.path);
      els.assetPathInput.value = j.path;
      els.assetFileInput.value = '';
      await loadRigAssets();
      renderAll();
      showStatus('ok', 'Rig asset uploaded and loaded into the selected slot.');
    } catch (err) {
      showStatus('err', err.message || 'Could not upload rig asset.');
    }
  }
  function bind(){
    els.status = $('rigStatus');
    els.posePills = $('posePills');
    els.slotList = $('slotList');
    els.stage = $('stage');
    els.fieldX = $('fieldX');
    els.fieldY = $('fieldY');
    els.fieldW = $('fieldW');
    els.assetPathInput = $('assetPathInput');
    els.assetPathList = $('assetPathList');
    els.assetFileInput = $('assetFileInput');
    els.assetGallery = $('assetGallery');
    els.selectionMeta = $('selectionMeta');
    els.layerOrder = $('layerOrder');
    els.gamePosePreview = $('gamePosePreview');
    els.gamePreviewMeta = $('gamePreviewMeta');

    $('showBoxes').addEventListener('change', (e) => { state.showBoxes = !!e.target.checked; renderStage(); });
    $('showGuide').addEventListener('change', (e) => { state.showGuide = !!e.target.checked; renderStage(); });
    $('snapToGrid').addEventListener('change', (e) => { state.snapToGrid = !!e.target.checked; });
    $('gridSize').addEventListener('change', (e) => { state.gridSize = Math.max(1, Number(e.target.value || 2)); e.target.value = state.gridSize; });

    document.querySelectorAll('[data-nudge]').forEach((btn) => btn.addEventListener('click', () => nudgeSelected(btn.dataset.nudge)));
    $('applyRectBtn').addEventListener('click', applyNumericFields);
    $('resetSlotBtn').addEventListener('click', () => { resetSelectedSlot(); renderAll(); showStatus('ok', 'Selected slot reset.'); });
    $('resetPoseBtn').addEventListener('click', () => { resetCurrentPose(); renderAll(); showStatus('ok', 'Current pose reset from idle.'); });
    $('copySharedBtn').addEventListener('click', () => { copyCurrentPoseFromIdle(); renderAll(); showStatus('ok', state.pose === 'idle' ? 'Idle is already the source pose.' : `Scaled ${state.pose} to match Idle more naturally.`); });
    $('normalisePoseBtn').addEventListener('click', () => { normalisePoseFromIdle(); renderAll(); showStatus('ok', state.pose === 'idle' ? 'Idle already sets the size reference.' : `Scaled ${state.pose} to match Idle\'s overall size.`); });
    $('sendBackBtn').addEventListener('click', () => { moveSelectedLayer('back'); renderStage(); });
    $('backOneBtn').addEventListener('click', () => { moveSelectedLayer('backward'); renderStage(); });
    $('forwardOneBtn').addEventListener('click', () => { moveSelectedLayer('forward'); renderStage(); });
    $('bringFrontBtn').addEventListener('click', () => { moveSelectedLayer('front'); renderStage(); });
    $('savePoseBtn').addEventListener('click', async () => {
      try {
        await saveRigToServer();
        showStatus('ok', 'Pose rig saved.');
      } catch (err) {
        showStatus('err', err.message || 'Could not save rig.');
      }
    });
    $('uploadAssetBtn').addEventListener('click', uploadSelectedAsset);
    $('applyAssetPathBtn').addEventListener('click', () => {
      const src = String(els.assetPathInput.value || '').trim();
      if (!src) return showStatus('err', 'Enter an image path first.');
      setPreviewSrc(state.pose, state.selectedLayerKey, src);
      renderAll();
      showStatus('ok', `${slotLabel(state.selectedLayerKey)} updated for ${state.pose}.`);
    });
    $('clearAssetBtn').addEventListener('click', () => {
      clearPreviewSrc(state.pose, state.selectedLayerKey);
      renderAll();
      showStatus('ok', `${slotLabel(state.selectedLayerKey)} cleared for ${state.pose}.`);
    });
    $('restoreDefaultBtn').addEventListener('click', () => {
      restorePreviewSrc(state.pose, state.selectedLayerKey);
      renderAll();
      showStatus('ok', `${slotLabel(state.selectedLayerKey)} restored to the built-in asset.`);
    });

    document.addEventListener('pointermove', onPointerMove);
    document.addEventListener('pointerup', onPointerUp);
    document.addEventListener('pointercancel', onPointerUp);
  }
  async function renderAll(){
    renderPosePills();
    renderSlotButtons();
    await refreshResolvedPoseLayers(state.pose);
    renderStage();
    await refreshGamePreview();
  }
  async function init(){
    bind();
    try {
      await loadData();
      await renderAll();
    } catch (err) {
      showStatus('err', err.message || 'Could not load pose rig.');
    }
  }
  init();
})();
