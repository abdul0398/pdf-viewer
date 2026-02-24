export function parseDeviceName(ua: string): string {
  // Detect browser (Edge > Chrome > Firefox > Safari order matters)
  let browser = 'Unknown Browser'
  const edgeMatch = ua.match(/Edg\/(\d+)/)
  const chromeMatch = ua.match(/Chrome\/(\d+)/)
  const firefoxMatch = ua.match(/Firefox\/(\d+)/)
  const safariMatch = ua.match(/Version\/(\d+).*Safari/)

  if (edgeMatch) {
    browser = `Edge ${edgeMatch[1]}`
  } else if (chromeMatch) {
    browser = `Chrome ${chromeMatch[1]}`
  } else if (firefoxMatch) {
    browser = `Firefox ${firefoxMatch[1]}`
  } else if (safariMatch) {
    browser = `Safari ${safariMatch[1]}`
  }

  // Detect OS
  let os = 'Unknown OS'
  if (/iPhone/.test(ua)) {
    os = 'iPhone'
  } else if (/iPad/.test(ua)) {
    os = 'iPad'
  } else if (/Android/.test(ua)) {
    os = 'Android'
  } else if (/Mac OS X/.test(ua)) {
    os = 'macOS'
  } else if (/Windows/.test(ua)) {
    os = 'Windows'
  } else if (/Linux/.test(ua)) {
    os = 'Linux'
  }

  return `${browser} on ${os}`
}
