"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import FileUpload from "@/components/FileUpload"
import { ThemeToggle } from "@/components/theme-toggle"

export default function FilesPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold">Gerenciador de Arquivos</h1>
              <p className="text-sm text-muted-foreground">Upload e compartilhamento de arquivos</p>
            </div>
          </div>
          <ThemeToggle />
        </motion.header>

        {/* File Upload Component */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <FileUpload />
        </motion.div>
      </div>
    </div>
  )
}
