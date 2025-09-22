import { Suspense } from "react"
import { DownloadSuccessPage } from "@/components/DownloadSuccessPage"

interface PageProps {
  params: {
    slug: string
  }
  searchParams: {
    filename?: string
    size?: string
    type?: string
  }
}

export default function SuccessPage({ params, searchParams }: PageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
      <Suspense
        fallback={
          <div className="flex items-center justify-center min-h-screen">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-emerald-500"></div>
          </div>
        }
      >
        <DownloadSuccessPage
          slug={params.slug}
          filename={searchParams.filename}
          size={searchParams.size}
          type={searchParams.type}
        />
      </Suspense>
    </div>
  )
}
