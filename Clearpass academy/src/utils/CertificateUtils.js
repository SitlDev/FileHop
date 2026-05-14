import { pdf } from '@react-pdf/renderer'
import React from 'react'

/**
 * Generates a unique Certificate ID in the format: CP-YYYY-8RANDOM
 * Example: CP-2025-A7K2M9XQ
 */
export const generateCertificateId = () => {
  const year = new Date().getFullYear()
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let randomPart = ''
  for (let i = 0; i < 8; i++) {
    randomPart += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return `CP-${year}-${randomPart}`
}

/**
 * Returns the QRickit API URL for a verification link
 */
export const getQrCodeUrl = (id) => {
  const verifyUrl = `${window.location.origin}/verify/${id}`
  return `https://qrickit.com/api/qr?d=${encodeURIComponent(verifyUrl)}&qrsize=150&t=p&e=m`
}

/**
 * Placeholder for PDF generation using @react-pdf/renderer
 * In a real app, you'd pass a CertificatePDF component here
 */
export const downloadCertificate = async (cert) => {
  console.log('Downloading certificate:', cert.id)
  // Logic to generate and download PDF would go here
  // For now, we'll just mock a download delay
  return new Promise(resolve => setTimeout(resolve, 1000))
}
