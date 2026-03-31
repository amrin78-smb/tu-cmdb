
export function calcTechnicalDebt(lifecycleStatus: string, deviceStatus: string, deviceType: string): number | null {
  if (lifecycleStatus !== 'EOL / EOS' || deviceStatus !== 'Active') return null
  const map: Record<string, number> = {
    'access point': 35000,
    'core switch': 1000000,
    'firewall': 300000,
    'router': 25000,
    'switch': 120000,
    'wireless controller': 300000,
  }
  return map[deviceType?.toLowerCase().trim()] ?? null
}
