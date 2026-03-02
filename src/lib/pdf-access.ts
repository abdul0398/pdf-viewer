// PDFs that blue-color users are allowed to access.
// Green-color users (and users with no color) can access all PDFs.
export const BLUE_ALLOWED_PDFS = [
  'Paper 2 Questions & Answers.pdf',
  'Paper 1 Questions & Answers.pdf',
]

export function canAccessPdf(userColor: string | null | undefined, pdfName: string): boolean {
  if (!userColor || userColor !== 'blue') return true
  return BLUE_ALLOWED_PDFS.includes(pdfName)
}
