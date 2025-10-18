"use client"

import { Button } from "@/components/ui/button"
import { Users } from "lucide-react"
import Link from "next/link"

export function SocialNavLink() {
  return (
    <Link href="/social">
      <Button
        variant="ghost"
        className="gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
      >
        <Users className="w-4 h-4" />
        Social
      </Button>
    </Link>
  )
}
