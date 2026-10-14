'use client';

export default function CrazyLoader({
  title,
  subtitle,
  fullscreen = false,
}) {
  const body = (
    <div className="flex flex-col items-center justify-center px-6 text-center">
      <div className="h-6 w-6 rounded-full border border-gray-200 border-t-green-950 animate-spin" />
      {title ? (
        <p className="mt-4 text-sm text-green-950">{title}</p>
      ) : null}
      {subtitle ? (
        <p className="mt-1 text-xs text-gray-500">{subtitle}</p>
      ) : null}
    </div>
  );

  if (!fullscreen) {
    return <div className="flex min-h-[40vh] items-center justify-center">{body}</div>;
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-white">
      {body}
    </div>
  );
}
