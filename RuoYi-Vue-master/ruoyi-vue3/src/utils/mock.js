export function generateImage() {  
    const canvas = document.createElement('canvas');  
    const ctx = canvas.getContext('2d');  
    canvas.width = 300;  canvas.height = 300;
    ctx.fillStyle = '#FFFFFF';  
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#000000';  ctx.font = 'bold 40px Arial';  
    ctx.textAlign = 'center';  ctx.textBaseline = 'middle';
    const number = Math.floor(Math.random() * 1000000); 
    ctx.fillText(number, canvas.width / 2, canvas.height / 2);
    return canvas.toDataURL('image/jpeg', 0.9);
}