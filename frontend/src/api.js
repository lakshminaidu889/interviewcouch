export async function api(path, { method = "GET", body } = {}) {
  const token = localStorage.getItem("token");
  const res = await fetch(path, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401 && token) {
    localStorage.removeItem("token");
    window.location.href = "/login";
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(typeof err.detail === "string" ? err.detail : "Something went wrong");
  }
  return res.json();
}
