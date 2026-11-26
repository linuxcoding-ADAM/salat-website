/** Pixel-art crescent and star, drawn on a 16×16 grid (the same mark as public/favicon.svg). */
export function Logo({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      shapeRendering="crispEdges"
      aria-hidden="true"
      focusable="false"
    >
      <path fill="#4ade80" d="M5 2h2v1h-2zM3 3h3v1h-3zM2 4h3v1h-3zM2 5h3v1h-3zM1 6h4v1h-4zM1 7h4v1h-4zM1 8h4v1h-4zM1 9h5v1h-5zM1 10h6v1h-6zM2 11h6v1h-6zM2 12h11v1h-11zM3 13h9v1h-9zM5 14h5v1h-5z" />
      <path fill="#d7e0ea" d="M12 3h1v1h-1zM11 4h3v1h-3zM12 5h1v1h-1z" />
    </svg>
  );
}
