"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { ArrowLeft, Upload, FolderOpen } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ThemeToggle } from "@/components/theme-toggle"
import FileUploadComponent from "@/components/FileUpload"
import FileManager from "@/components/FileManager"
import Link from "next/link"
import type { FileUpload } from "../../types/file-upload"

export default function FilesPage() {
  const [refreshKey, setRefreshKey] = useState(0)

  const handleUploadComplete = (file: FileUpload) => {
    // Trigger refresh of file manager
    setRefreshKey((prev) => prev + 1)
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold">File Manager</h1>
              <p className="text-muted-foreground">Upload and manage your archive files</p>
            </div>
          </div>
          <ThemeToggle />
        </motion.div>

        {/* Main Content */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Tabs defaultValue="upload" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 max-w-md">
              <TabsTrigger value="upload" className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Upload
              </TabsTrigger>
              <TabsTrigger value="manage" className="flex items-center gap-2">
                <FolderOpen className="h-4 w-4" />
                Manage
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upload" className="space-y-6">
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
                <FileUploadComponent onUploadComplete={handleUploadComplete} />
              </motion.div>
            </TabsContent>

            <TabsContent value="manage" className="space-y-6">
              <motion.div
                key={refreshKey}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <FileManager />
              </motion.div>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  )
}
