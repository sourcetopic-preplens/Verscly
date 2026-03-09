// SERVER ONLY
export async function extractTextFromBuffer(buffer: Buffer, filename: string): Promise<string> {
  const ext = filename.split('.').pop()?.toLowerCase()

  if (ext === 'pdf')                   return extractPDF(buffer)
  if (ext === 'docx' || ext === 'doc') return extractDOCX(buffer)
  if (ext === 'txt')                   return buffer.toString('utf-8')

  throw new Error(`Unsupported file type: .${ext}. Please upload a PDF, DOCX, or TXT file.`)
}

async function extractPDF(buffer: Buffer): Promise<string> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdfjs = require('pdfjs-dist/legacy/build/pdf.js')
    pdfjs.GlobalWorkerOptions.workerSrc = ''

    const loadingTask = pdfjs.getDocument({
      data: new Uint8Array(buffer),
      useWorkerFetch: false,
      isEvalSupported: false,
      useSystemFonts: true,
      disableFontFace: true,
    })

    const doc = await loadingTask.promise
    let text = ''

    for (let i = 1; i <= doc.numPages; i++) {
      const page    = await doc.getPage(i)
      const content = await page.getTextContent()
      const pageText = content.items
        .map((item: { str?: string }) => item.str ?? '')
        .join(' ')
      text += pageText + '\n\n'
    }

    const result = text.trim()
    if (!result) throw new Error('PDF appears to be empty or image-only. Please use a text-based PDF.')
    return result
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    throw new Error(`Could not read PDF: ${msg}`)
  }
}

async function extractDOCX(buffer: Buffer): Promise<string> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mammoth = require('mammoth')
    const result  = await mammoth.extractRawText({ buffer })
    const text = (result.value as string).trim()
    if (!text) throw new Error('Document appears to be empty.')
    return text
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    throw new Error(`Could not read DOCX: ${msg}`)
  }
}
