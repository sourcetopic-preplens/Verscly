/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['mammoth', 'pdfjs-dist'],
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = [...(config.externals || []), 'canvas', 'encoding']
    }
    // Prevent pdfjs worker from being bundled
    config.resolve.alias = {
      ...config.resolve.alias,
      'pdfjs-dist/build/pdf.worker.js': false,
    }
    return config
  },
}

module.exports = nextConfig
