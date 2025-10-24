import { Skeleton } from "@/components/ui/skeleton"

export function PostCardSkeleton() {
  return (
    <div className="bg-slate-800/50 rounded-lg border border-slate-700/50 p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-full bg-slate-600/50" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-32 bg-slate-600/50" />
          <Skeleton className="h-3 w-24 bg-slate-600/50" />
        </div>
      </div>

      {/* Content */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-full bg-slate-600/50" />
        <Skeleton className="h-4 w-5/6 bg-slate-600/50" />
      </div>

      {/* Image placeholder */}
      <Skeleton className="h-48 w-full rounded bg-slate-600/50" />

      {/* Footer */}
      <div className="flex gap-4 pt-2">
        <Skeleton className="h-4 w-16 bg-slate-600/50" />
        <Skeleton className="h-4 w-16 bg-slate-600/50" />
        <Skeleton className="h-4 w-16 bg-slate-600/50" />
      </div>
    </div>
  )
}

export function SocialFeedSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <PostCardSkeleton key={i} />
      ))}
    </div>
  )
}

export function CommentSkeleton() {
  return (
    <div className="flex gap-3 p-3 bg-slate-800/30 rounded">
      <Skeleton className="h-8 w-8 rounded-full bg-slate-600/50" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-24 bg-slate-600/50" />
        <Skeleton className="h-3 w-full bg-slate-600/50" />
        <Skeleton className="h-3 w-4/5 bg-slate-600/50" />
      </div>
    </div>
  )
}

export function CommentsSectionSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <CommentSkeleton key={i} />
      ))}
    </div>
  )
}
