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