/* marketplace.js — loads preview listings for the Marketplace coming-soon page */
(function () {
  const grid = document.getElementById('mpGrid');
  if (!grid) return;

  function esc(str) {
    return String(str ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
  }

  function cardHtml(item) {
    const img = item.image_link
      ? `<img class="mp-card-img" src="${esc(item.image_link)}" alt="${esc(item.title)}" loading="lazy" />`
      : `<div class="mp-card-img-placeholder">📦</div>`;
    return `
      <div class="mp-card">
        ${img}
        <div class="mp-card-body">
          ${item.category ? `<span class="mp-card-category">${esc(item.category)}</span>` : ''}
          <h4 class="mp-card-title">${esc(item.title)}</h4>
          ${item.description ? `<p class="mp-card-desc">${esc(item.description)}</p>` : ''}
          ${item.price ? `<span class="mp-card-price">${esc(item.price)}</span>` : ''}
        </div>
      </div>`;
  }

  fetch(`${BASTEL_CONFIG.API_BASE}/marketplace`)
    .then(res => res.json())
    .then(({ success, data }) => {
      if (!success) throw new Error('Failed to load listings');
      if (!data || !data.length) {
        grid.innerHTML = '<p class="mp-empty">No preview listings yet — check back soon as we add products ahead of launch.</p>';
        return;
      }
      grid.innerHTML = data.map(cardHtml).join('');
      BLog.info('Marketplace listings loaded', { count: data.length });
    })
    .catch(err => {
      grid.innerHTML = '<p class="mp-empty">Could not load listings right now — please check back later.</p>';
      BLog.error('Marketplace load failed', { error: err.message });
    });
})();
