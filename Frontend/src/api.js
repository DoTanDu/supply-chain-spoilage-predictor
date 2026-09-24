const API_BASE = 'http://localhost:5000/api';

export async function fetchDashboardStats() {
  const res = await fetch(`${API_BASE}/dashboard/stats`);
  const json = await res.json();
  return json.data;
}

export async function fetchProducts() {
  const res = await fetch(`${API_BASE}/products`);
  const json = await res.json();
  return json.data || [];
}

export async function fetchBatches() {
  const res = await fetch(`${API_BASE}/batches`);
  const json = await res.json();
  return json.data || [];
}

export async function fetchDisposals() {
  const res = await fetch(`${API_BASE}/disposals`);
  const json = await res.json();
  return json.data || [];
}

export async function fetchAuditLogs() {
  const res = await fetch(`${API_BASE}/audit-logs`);
  const json = await res.json();
  return json.data || [];
}

export async function apiAddBatch(batchData) {
  const res = await fetch(`${API_BASE}/batches`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(batchData)
  });
  return await res.json();
}

export async function apiCreateProduct(productData) {
  const res = await fetch(`${API_BASE}/products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(productData)
  });
  return await res.json();
}

export async function apiProcessSale(items, weather) {
  const res = await fetch(`${API_BASE}/sales`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items, weather })
  });
  return await res.json();
}

export async function apiCreateDisposal(disposalData) {
  const res = await fetch(`${API_BASE}/spoilage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(disposalData)
  });
  return await res.json();
}

export async function apiApplyDiscount(batchId, percent = 30) {
  const res = await fetch(`${API_BASE}/batches/${batchId}/discount`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ percent })
  });
  return await res.json();
}
