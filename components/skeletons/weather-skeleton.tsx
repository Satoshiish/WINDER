import { Skeleton } from "@/components/ui/skeleton"

export function WeatherCardSkeleton() {
  return (
    <div className="bg-gradient-to-r from-slate-800/50 to-slate-700/50 rounded-xl p-6 border border-slate-600/30 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <Skeleton className="h-8 w-48 mb-2 bg-slate-600/50" />
          <Skeleton className="h-4 w-64 bg-slate-600/50" />
        </div>
        <Skeleton className="h-20 w-20 rounded-full bg-slate-600/50" />
      </div>

      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-16 w-24 mb-2 bg-slate-600/50" />
          <Skeleton className="h-4 w-32 bg-slate-600/50" />
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <Skeleton className="h-4 w-16 mb-1 bg-slate-600/50" />
            <Skeleton className="h-4 w-12 bg-slate-600/50" />
          </div>
          <div>
            <Skeleton className="h-4 w-16 mb-1 bg-slate-600/50" />
            <Skeleton className="h-4 w-12 bg-slate-600/50" />
          </div>
        </div>
      </div>
    </div>
  )
}

export function SearchSkeleton() {
  return (
    <div className="flex items-center space-x-2">
      <Skeleton className="h-4 w-4 bg-slate-600/50" />
      <Skeleton className="h-4 w-20 bg-slate-600/50" />
    </div>
  )
}

export function LocationSkeleton() {
  return (
    <div className="flex items-center space-x-2">
      <Skeleton className="h-4 w-4 bg-slate-600/50" />
      <Skeleton className="h-4 w-32 bg-slate-600/50" />
    </div>
  )
}

export function ForecastSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="bg-gradient-to-r from-slate-800/50 to-slate-700/50 rounded-xl p-4 border border-slate-600/30 backdrop-blur-sm"
        >
          <Skeleton className="h-4 w-16 mb-2 bg-slate-600/50" />
          <Skeleton className="h-8 w-8 mx-auto mb-2 bg-slate-600/50 rounded-full" />
          <Skeleton className="h-6 w-12 mb-1 bg-slate-600/50" />
          <Skeleton className="h-3 w-20 bg-slate-600/50" />
        </div>
      ))}
    </div>
  )
}

export function AlertSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="bg-gradient-to-r from-slate-800/50 to-slate-700/50 rounded-xl p-4 border border-slate-600/30 backdrop-blur-sm"
        >
          <div className="flex items-start space-x-3">
            <Skeleton className="h-5 w-5 bg-slate-600/50 rounded" />
            <div className="flex-1">
              <Skeleton className="h-5 w-32 mb-2 bg-slate-600/50" />
              <Skeleton className="h-4 w-full mb-1 bg-slate-600/50" />
              <Skeleton className="h-4 w-3/4 bg-slate-600/50" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export function RiskPredictionSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="bg-gradient-to-r from-slate-800/50 to-slate-700/50 rounded-xl p-4 border border-slate-600/30 backdrop-blur-sm"
        >
          <div className="flex items-center justify-between mb-2">
            <Skeleton className="h-4 w-24 bg-slate-600/50" />
            <Skeleton className="h-4 w-4 bg-slate-600/50" />
          </div>
          <Skeleton className="h-8 w-16 mb-2 bg-slate-600/50" />
          <Skeleton className="h-3 w-full bg-slate-600/50" />
        </div>
      ))}
    </div>
  )
}

export function HistorySkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="bg-gradient-to-r from-slate-800/50 to-slate-700/50 rounded-xl p-4 border border-slate-600/30 backdrop-blur-sm"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Skeleton className="h-8 w-8 bg-slate-600/50 rounded-full" />
              <div>
                <Skeleton className="h-4 w-32 mb-1 bg-slate-600/50" />
                <Skeleton className="h-3 w-24 bg-slate-600/50" />
              </div>
            </div>
            <div className="text-right">
              <Skeleton className="h-6 w-12 mb-1 bg-slate-600/50" />
              <Skeleton className="h-3 w-16 bg-slate-600/50" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export function NavigationSkeleton() {
  return (
    <div className="flex justify-around items-center p-4 bg-gradient-to-r from-slate-800/50 to-slate-700/50 backdrop-blur-md border-t border-slate-600/30">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex flex-col items-center space-y-1">
          <Skeleton className="h-6 w-6 bg-slate-600/50 rounded" />
          <Skeleton className="h-3 w-12 bg-slate-600/50" />
        </div>
      ))}
    </div>
  )
}

export function WeatherIndicesSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="bg-gradient-to-r from-slate-800/50 to-slate-700/50 rounded-lg p-6 border border-slate-600/30 backdrop-blur-sm"
        >
          <div className="flex items-center gap-3 mb-4">
            <Skeleton className="h-6 w-6 bg-slate-600/50 rounded" />
            <Skeleton className="h-6 w-24 bg-slate-600/50" />
          </div>
          <Skeleton className="h-10 w-20 mb-2 bg-slate-600/50" />
          <Skeleton className="h-5 w-16 mb-3 bg-slate-600/50" />
          <Skeleton className="h-4 w-full bg-slate-600/50" />
        </div>
      ))}
    </div>
  )
}
