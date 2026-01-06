// Script para converter logo para WebP
// Uso: node scripts/convert-logo.js <caminho-da-imagem>

const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

async function convertToWebp(inputPath) {
  const outputPath = path.join(__dirname, '../public/logo-studao-dark.webp');

  try {
    await sharp(inputPath)
      .webp({ quality: 90 })
      .toFile(outputPath);

    console.log('✅ Logo convertido com sucesso!');
    console.log(`📁 Salvo em: ${outputPath}`);

    const stats = fs.statSync(outputPath);
    console.log(`📊 Tamanho: ${(stats.size / 1024).toFixed(2)} KB`);
  } catch (error) {
    console.error('❌ Erro ao converter:', error.message);
  }
}

const inputPath = process.argv[2];

if (!inputPath) {
  console.log('Uso: node scripts/convert-logo.js <caminho-da-imagem>');
  console.log('Exemplo: node scripts/convert-logo.js ~/Downloads/logo.png');
  process.exit(1);
}

convertToWebp(inputPath);
