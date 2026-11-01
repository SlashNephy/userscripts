export type ArmEntry = {
  mal_id?: number
  anilist_id?: number
  annict_id?: number
  syobocal_tid?: number
}

export async function fetchArmEntries(branch = 'master'): Promise<ArmEntry[]> {
  const response = await fetch(`https://raw.githubusercontent.com/kawaiioverflow/arm/${branch}/arm.json`)

  return response.json()
}
