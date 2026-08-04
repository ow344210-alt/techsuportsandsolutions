export function resetHistoryAndNavigate(
  navigate: (to: string) => void,
  to: string,
) {
  const currentIdx = window.history.state?.idx;

  if (typeof currentIdx !== "number" || currentIdx <= 0) {
    navigate(to);
    return;
  }

  let settled = false;

  function finish() {
    if (settled) return;
    settled = true;
    window.removeEventListener("popstate", onPop);
    window.clearTimeout(fallback);
    window.setTimeout(() => navigate(to), 0);
  }

  function onPop() {
    finish();
  }

  const fallback = window.setTimeout(finish, 100);
  window.addEventListener("popstate", onPop);
  window.history.go(-currentIdx);
}
