import content from '../database/greetings.json' with { type: 'json' }

// Nội dung gia đình dùng chung cho giao diện và backend.
export function normalizeFamilyName(name) {
  return name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').toLowerCase().replace(/\s+/g, ' ').trim()
}

export function isMother(name) {
  const normalized = normalizeFamilyName(name)
  return /(^|[^a-z])me($|[^a-z])/.test(normalized) || /(^|[^a-z])yen($|[^a-z])/.test(normalized)
}

const { motherLetter, wishes, closings, familyTitles } = content

function familyRecipient(name) {
  const words = normalizeFamilyName(name).split(' ')
  const title = familyTitles[words.at(-1)]
  if (!title) return name
  const bareName = name.replace(/^(chị|chi|anh|ba)\s+/iu, '')
  const displayName = bareName.split(/\s+/).map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ')
  return `${title} ${displayName}`
}

export function getFamilyGreeting(rawName) {
  const name = familyRecipient(rawName.trim().normalize('NFC').slice(0, 100))
  if (isMother(name)) return { greeting: motherLetter, recipient: 'Mẹ', special: true, signature: 'Con của mẹ, với tất cả yêu thương', title: 'Người đặc biệt nhất trong trái tim con' }
  const normalized = normalizeFamilyName(name)
  let hash = 0
  for (const char of normalized) hash = (Math.imul(hash, 31) + char.charCodeAt(0)) >>> 0
  const role = /^(ba|ong|ngoai|noi)( |$)/.test(normalized) ? 'Kính gửi' : 'Thương gửi'
  return {
    greeting: `${role} ${name},\n\nNhân ngày 20/10, gửi đến ${name} lời chúc sức khỏe, bình an và thật nhiều niềm vui bên gia đình. Một tấm thiệp nhỏ không thể nói hết tình cảm, nhưng mong từng dòng ở đây sẽ mang đến cảm giác được nhớ tới và được yêu thương.\n\n${wishes[hash % wishes.length]}\n\n${closings[Math.floor(hash / wishes.length) % closings.length]}\n\nChúc ${name} hôm nay và những ngày sau đều có những điều nhỏ bé để mỉm cười, những người thân để sẻ chia và một mái nhà để luôn muốn trở về.`,
    recipient: name, special: false, signature: 'Thương mến, từ gia đình mình', title: 'Một người thương, một lời chúc riêng'
  }
}
