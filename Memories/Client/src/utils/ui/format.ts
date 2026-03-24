export function formatTime(seconds: number): string{
    const min = Math.floor(seconds / 60)
    const sec = Math.floor(seconds % 60)
    return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`
}

export function camelCase(str: string): string {
  return str.replace(/_[a-z]/g, str1 => str1.substr(-1).toUpperCase())
}
  
export function isNumberStr(str: string): boolean {
  return /^[+-]?(0|([1-9]\d*))(\.\d+)?$/g.test(str)
}

export function generateImage() {  
  const canvas = document.createElement('canvas');  
  const ctx = canvas.getContext('2d');  
  canvas.width = 300;  canvas.height = 300;
  if (ctx === null) {
    return;
  }
  ctx.fillStyle = '#FFFFFF';  
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#000000';  ctx.font = 'bold 40px Arial';  
  ctx.textAlign = 'center';  ctx.textBaseline = 'middle';
  const number = Math.floor(Math.random() * 1000000); 
  ctx.fillText(number.toString(), canvas.width / 2, canvas.height / 2);
  return canvas.toDataURL('image/jpeg', 0.9);
}

export function formatTimeShort(timestamp: number): string {
  if (!timestamp) return ''
  const d = new Date(timestamp)
  const now = new Date()
  const isToday = d.toDateString() === now.toDateString()
  if (isToday) {
    return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0')
  }
  return `${d.getMonth() + 1}/${d.getDate()}`
}

const colors: string[] = [
  '#e74c3c', '#e67e22', '#2ecc71',
  '#3498db', '#9b59b6', '#1abc9c',
  '#e91e63', '#ff5722', '#607d8b', '#f39c12'
]

export function getAvatarColor(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}

export function getAvatarText(name: string): string {
  if (!name) return '?'
  return name.charAt(0).toUpperCase()
}
