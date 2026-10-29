-- CreateTable
CREATE TABLE "Usuario" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "senhaHash" TEXT NOT NULL,
    "papel" TEXT NOT NULL DEFAULT 'OPERADOR',
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Equipamento" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "fabricante" TEXT,
    "enderecoIp" TEXT,
    "localizacao" TEXT,
    "unidade" TEXT,
    "limiteMin" REAL,
    "limiteMax" REAL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Leitura" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "equipamentoId" TEXT NOT NULL,
    "valor" REAL NOT NULL,
    "registradaEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Leitura_equipamentoId_fkey" FOREIGN KEY ("equipamentoId") REFERENCES "Equipamento" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Alerta" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "equipamentoId" TEXT NOT NULL,
    "leituraId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "valor" REAL NOT NULL,
    "limite" REAL NOT NULL,
    "reconhecido" BOOLEAN NOT NULL DEFAULT false,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Alerta_equipamentoId_fkey" FOREIGN KEY ("equipamentoId") REFERENCES "Equipamento" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Alerta_leituraId_fkey" FOREIGN KEY ("leituraId") REFERENCES "Leitura" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Equipamento_enderecoIp_key" ON "Equipamento"("enderecoIp");

-- CreateIndex
CREATE INDEX "Leitura_equipamentoId_registradaEm_idx" ON "Leitura"("equipamentoId", "registradaEm");

-- CreateIndex
CREATE INDEX "Alerta_equipamentoId_criadoEm_idx" ON "Alerta"("equipamentoId", "criadoEm");
