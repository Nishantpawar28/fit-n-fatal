export function ChartSkeleton({ height = 140 }: { height?: number }) {
  return <div className="w-full rounded-lg bg-purple-500/5 animate-pulse" style={{ height }} />;
}
