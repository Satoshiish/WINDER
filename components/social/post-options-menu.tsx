"use client"
import { Button } from "@/components/ui/button"
import { Flag, Trash2, Pin, Archive } from "lucide-react"

interface PostOptionsMenuProps {
  isOpen: boolean
  onClose: () => void
  isOwnPost: boolean
  onDelete?: () => void
  onPin?: () => void
  onArchive?: () => void
  onReport?: () => void
}

export function PostOptionsMenu({
  isOpen,
  onClose,
  isOwnPost,
  onDelete,
  onPin,
  onArchive,
  onReport,
}: PostOptionsMenuProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50" onClick={onClose}>
      <div
        className="absolute top-0 right-0 mt-2 mr-2 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 min-w-48"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="py-1">
          {isOwnPost ? (
            <>
              <Button
                variant="ghost"
                className="w-full justify-start px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-none"
                onClick={() => {
                  onPin?.()
                  onClose()
                }}
              >
                <Pin className="w-4 h-4 mr-2" />
                Pin Post
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-none"
                onClick={() => {
                  onArchive?.()
                  onClose()
                }}
              >
                <Archive className="w-4 h-4 mr-2" />
                Archive
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-none"
                onClick={() => {
                  onDelete?.()
                  onClose()
                }}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            </>
          ) : (
            <Button
              variant="ghost"
              className="w-full justify-start px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-none"
              onClick={() => {
                onReport?.()
                onClose()
              }}
            >
              <Flag className="w-4 h-4 mr-2" />
              Report Post
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
