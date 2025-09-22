-- Migração da tabela file_uploads para o novo schema
-- Este script verifica a estrutura atual e adiciona/modifica colunas conforme necessário

-- Primeiro, verificar se a tabela existe
DO $$
BEGIN
    -- Se a tabela não existe, criar com o schema completo
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'file_uploads') THEN
        CREATE TABLE file_uploads (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            filename VARCHAR(255) NOT NULL,
            original_name VARCHAR(255) NOT NULL,
            file_size BIGINT NOT NULL DEFAULT 0,
            mime_type VARCHAR(100),
            file_extension VARCHAR(10),
            storage_url TEXT NOT NULL,
            download_slug VARCHAR(100) UNIQUE NOT NULL,
            upload_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            download_count INTEGER DEFAULT 0,
            expires_at TIMESTAMP WITH TIME ZONE,
            is_active BOOLEAN DEFAULT true,
            metadata JSONB DEFAULT '{}',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Criar índices
        CREATE INDEX IF NOT EXISTS idx_file_uploads_download_slug ON file_uploads(download_slug);
        CREATE INDEX IF NOT EXISTS idx_file_uploads_created_at ON file_uploads(created_at DESC);
        CREATE INDEX IF NOT EXISTS idx_file_uploads_is_active ON file_uploads(is_active);
        
        RAISE NOTICE 'Tabela file_uploads criada com sucesso';
    ELSE
        RAISE NOTICE 'Tabela file_uploads já existe, verificando colunas...';
        
        -- Adicionar colunas que podem estar faltando
        
        -- Adicionar original_name se não existir
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'file_uploads' AND column_name = 'original_name') THEN
            ALTER TABLE file_uploads ADD COLUMN original_name VARCHAR(255);
            UPDATE file_uploads SET original_name = filename WHERE original_name IS NULL;
            ALTER TABLE file_uploads ALTER COLUMN original_name SET NOT NULL;
            RAISE NOTICE 'Coluna original_name adicionada';
        END IF;
        
        -- Renomear slug para download_slug se necessário
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'file_uploads' AND column_name = 'slug') 
           AND NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'file_uploads' AND column_name = 'download_slug') THEN
            ALTER TABLE file_uploads RENAME COLUMN slug TO download_slug;
            RAISE NOTICE 'Coluna slug renomeada para download_slug';
        END IF;
        
        -- Adicionar download_slug se não existir
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'file_uploads' AND column_name = 'download_slug') THEN
            ALTER TABLE file_uploads ADD COLUMN download_slug VARCHAR(100);
            UPDATE file_uploads SET download_slug = id::text WHERE download_slug IS NULL;
            ALTER TABLE file_uploads ALTER COLUMN download_slug SET NOT NULL;
            -- Criar constraint unique
            ALTER TABLE file_uploads ADD CONSTRAINT file_uploads_download_slug_unique UNIQUE (download_slug);
            RAISE NOTICE 'Coluna download_slug adicionada';
        END IF;
        
        -- Renomear blob_url para storage_url se necessário
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'file_uploads' AND column_name = 'blob_url') 
           AND NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'file_uploads' AND column_name = 'storage_url') THEN
            ALTER TABLE file_uploads RENAME COLUMN blob_url TO storage_url;
            RAISE NOTICE 'Coluna blob_url renomeada para storage_url';
        END IF;
        
        -- Adicionar storage_url se não existir
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'file_uploads' AND column_name = 'storage_url') THEN
            ALTER TABLE file_uploads ADD COLUMN storage_url TEXT DEFAULT '';
            RAISE NOTICE 'Coluna storage_url adicionada';
        END IF;
        
        -- Adicionar file_extension se não existir
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'file_uploads' AND column_name = 'file_extension') THEN
            ALTER TABLE file_uploads ADD COLUMN file_extension VARCHAR(10) DEFAULT '.zip';
            RAISE NOTICE 'Coluna file_extension adicionada';
        END IF;
        
        -- Adicionar upload_date se não existir
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'file_uploads' AND column_name = 'upload_date') THEN
            ALTER TABLE file_uploads ADD COLUMN upload_date TIMESTAMP WITH TIME ZONE DEFAULT NOW();
            UPDATE file_uploads SET upload_date = created_at WHERE upload_date IS NULL;
            RAISE NOTICE 'Coluna upload_date adicionada';
        END IF;
        
        -- Adicionar download_count se não existir
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'file_uploads' AND column_name = 'download_count') THEN
            ALTER TABLE file_uploads ADD COLUMN download_count INTEGER DEFAULT 0;
            RAISE NOTICE 'Coluna download_count adicionada';
        END IF;
        
        -- Adicionar expires_at se não existir
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'file_uploads' AND column_name = 'expires_at') THEN
            ALTER TABLE file_uploads ADD COLUMN expires_at TIMESTAMP WITH TIME ZONE;
            RAISE NOTICE 'Coluna expires_at adicionada';
        END IF;
        
        -- Adicionar is_active se não existir
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'file_uploads' AND column_name = 'is_active') THEN
            ALTER TABLE file_uploads ADD COLUMN is_active BOOLEAN DEFAULT true;
            RAISE NOTICE 'Coluna is_active adicionada';
        END IF;
        
        -- Adicionar metadata se não existir
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'file_uploads' AND column_name = 'metadata') THEN
            ALTER TABLE file_uploads ADD COLUMN metadata JSONB DEFAULT '{}';
            RAISE NOTICE 'Coluna metadata adicionada';
        END IF;
        
        -- Adicionar updated_at se não existir
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'file_uploads' AND column_name = 'updated_at') THEN
            ALTER TABLE file_uploads ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
            UPDATE file_uploads SET updated_at = created_at WHERE updated_at IS NULL;
            RAISE NOTICE 'Coluna updated_at adicionada';
        END IF;
        
        -- Garantir que file_size seja BIGINT
        ALTER TABLE file_uploads ALTER COLUMN file_size TYPE BIGINT USING file_size::BIGINT;
        
        -- Garantir que download_count seja INTEGER
        ALTER TABLE file_uploads ALTER COLUMN download_count TYPE INTEGER USING COALESCE(download_count::INTEGER, 0);
        
        -- Criar índices se não existirem
        CREATE INDEX IF NOT EXISTS idx_file_uploads_download_slug ON file_uploads(download_slug);
        CREATE INDEX IF NOT EXISTS idx_file_uploads_created_at ON file_uploads(created_at DESC);
        CREATE INDEX IF NOT EXISTS idx_file_uploads_is_active ON file_uploads(is_active);
        CREATE INDEX IF NOT EXISTS idx_file_uploads_expires_at ON file_uploads(expires_at);
        
        RAISE NOTICE 'Migração da tabela file_uploads concluída';
    END IF;
END
$$;

-- Criar função de trigger para updated_at se não existir
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Criar trigger para updated_at
DROP TRIGGER IF EXISTS update_file_uploads_updated_at ON file_uploads;
CREATE TRIGGER update_file_uploads_updated_at
    BEFORE UPDATE ON file_uploads
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Verificar estrutura final
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'file_uploads' 
ORDER BY ordinal_position;
