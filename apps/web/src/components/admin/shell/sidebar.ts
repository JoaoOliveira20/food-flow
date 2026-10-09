export type SidebarPreference = "auto" | "expanded" | "collapsed";

const SIDEBAR_STORAGE_KEY = "food-flow-admin-sidebar";
const RAIL_ATTRIBUTE = "data-admin-rail";
export const WIDE_QUERY = "(min-width: 1280px)";
export const DESKTOP_QUERY = "(min-width: 1024px)";
const SIDEBAR_CHANGE_EVENT = "food-flow-sidebar-change";

export const SIDEBAR_BOOT_SCRIPT = `(function(){try{var p=localStorage.getItem("${SIDEBAR_STORAGE_KEY}");var r=matchMedia("${DESKTOP_QUERY}").matches&&(p==="collapsed"||(p!=="expanded"&&!matchMedia("${WIDE_QUERY}").matches));document.documentElement.setAttribute("${RAIL_ATTRIBUTE}",r?"true":"false")}catch(e){}})()`;

export function isRail(preference: SidebarPreference, isDesktop: boolean, isWide: boolean): boolean {
  return isDesktop && (preference === "collapsed" || (preference === "auto" && !isWide));
}

export function applySidebarState() {
  const rail = isRail(readSidebarPreference(), window.matchMedia(DESKTOP_QUERY).matches, window.matchMedia(WIDE_QUERY).matches);
  document.documentElement.setAttribute(RAIL_ATTRIBUTE, rail ? "true" : "false");
}

export function readSidebarPreference(): SidebarPreference {
  try {
    const stored = window.localStorage.getItem(SIDEBAR_STORAGE_KEY);
    return stored === "expanded" || stored === "collapsed" ? stored : "auto";
  } catch {
    return "auto";
  }
}

export function storeSidebarPreference(preference: SidebarPreference) {
  try {
    window.localStorage.setItem(SIDEBAR_STORAGE_KEY, preference);
  } catch {}
  applySidebarState();
  window.dispatchEvent(new Event(SIDEBAR_CHANGE_EVENT));
}

export function subscribeToSidebarPreference(onChange: () => void): () => void {
  window.addEventListener("storage", onChange);
  window.addEventListener(SIDEBAR_CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(SIDEBAR_CHANGE_EVENT, onChange);
  };
}
