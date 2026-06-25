// A template re-mounts on every navigation (unlike layout), so wrapping the
// page here replays the entrance animation on each route change. The header
// lives in the layout and stays anchored. Motion collapses under
// prefers-reduced-motion (see globals.css).
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="sdn-page-enter flex flex-1 flex-col">{children}</div>;
}
