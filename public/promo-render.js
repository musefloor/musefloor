import { cleanHeadline, promo } from "./promo-model.js";

function rounded(ctx, x, y, w, h, radius, fill) {
  ctx.beginPath(); ctx.roundRect(x, y, w, h, radius); ctx.fillStyle = fill; ctx.fill();
}
function textLines(ctx, text, maxWidth) {
  const lines = []; let line = "";
  for (const char of Array.from(text)) {
    if (ctx.measureText(line + char).width > maxWidth && line) { lines.push(line.trim()); line = char; }
    else line += char;
  }
  if (line) lines.push(line.trim());
  return lines;
}

export function drawPromo(ctx, frame, headline) {
  const { width: w, height: h } = promo;
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = "#f5f2e9"; ctx.fillRect(0, 0, w, h);
  ctx.textAlign = "left";
  ctx.fillStyle = "#543653"; ctx.font = '30px "Muse Pixel", monospace'; ctx.fillText("musefloor", 38, 49);
  ctx.textAlign = "right"; ctx.font = '15px "Muse Sans", sans-serif'; ctx.fillText("Lantern Catch", w - 38, 45);
  ctx.textAlign = "left"; ctx.fillStyle = "#342e38"; ctx.font = '44px "Muse Pixel", monospace';
  let size = 44, lines = textLines(ctx, cleanHeadline(headline), w - 76);
  while (lines.length > 2 && size > 18) {
    size -= 2; ctx.font = `${size}px "Muse Pixel", monospace`;
    lines = textLines(ctx, cleanHeadline(headline), w - 76);
  }
  lines.forEach((line, i) => ctx.fillText(line, 38, 106 + i * (size + 4)));
  const top = 210, fieldH = 490;
  const sky = ctx.createLinearGradient(0, top, 0, top + fieldH); sky.addColorStop(0, "#28283e"); sky.addColorStop(1, "#646473");
  ctx.fillStyle = sky; ctx.fillRect(0, top, w, fieldH);
  ctx.fillStyle = "#e5dcbd"; ctx.beginPath(); ctx.arc(606, top + 72, 25, 0, Math.PI * 2); ctx.fill();
  for (const [x,y] of [[99,45],[183,111],[330,50],[461,89],[535,31],[668,153]]) { ctx.beginPath(); ctx.arc(x,top+y,1.5,0,Math.PI*2); ctx.fill(); }
  ctx.fillStyle = "#393e50"; ctx.beginPath(); ctx.moveTo(0,top+275); ctx.quadraticCurveTo(150,top+180,310,top+256); ctx.quadraticCurveTo(490,top+300,w,top+233); ctx.lineTo(w,top+fieldH);ctx.lineTo(0,top+fieldH);ctx.fill();
  ctx.fillStyle = "#354544"; ctx.beginPath(); ctx.moveTo(0,top+345); ctx.quadraticCurveTo(280,top+260,410,top+336); ctx.quadraticCurveTo(560,top+370,w,top+306); ctx.lineTo(w,top+fieldH);ctx.lineTo(0,top+fieldH);ctx.fill();
  ctx.strokeStyle = "#29373b";ctx.lineWidth=9;ctx.lineCap="round";
  for(const [x, direction] of [[38,1],[687,-1]]){ctx.beginPath();ctx.moveTo(x,top+425);ctx.lineTo(x-direction*12,top+103);ctx.moveTo(x,top+214);ctx.lineTo(x+direction*50,top+141);ctx.stroke();}
  ctx.strokeStyle="#fff2c315";ctx.lineWidth=1;ctx.setLineDash([4,8]);
  for(let lane=1;lane<5;lane++){ctx.beginPath();ctx.moveTo(lane*w/5,top+42);ctx.lineTo(lane*w/5,top+430);ctx.stroke();}ctx.setLineDash([]);
  for (const drop of frame.drops) {
    const x = (0.1 + drop.lane * 0.2) * w, y = top + 65 + drop.progress * 300;
    ctx.save();ctx.translate(x,y);
    if(drop.kind==="light"){ctx.shadowColor="#edd882";ctx.shadowBlur=20;rounded(ctx,-6,-9,12,18,6,"#ffe9a0");ctx.shadowBlur=0;ctx.fillStyle="#fff8d4";ctx.beginPath();ctx.ellipse(-8,-3,6,3,-.4,0,Math.PI*2);ctx.ellipse(8,-3,6,3,.4,0,Math.PI*2);ctx.fill();}
    else{ctx.rotate(-.65);ctx.fillStyle="#be9269";ctx.beginPath();ctx.ellipse(0,0,8,15,0,0,Math.PI*2);ctx.fill();ctx.strokeStyle="#78553c";ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(0,-10);ctx.lineTo(0,11);ctx.stroke();}
    ctx.restore();
  }
  const jarX = (0.1 + frame.state.lane * 0.2) * w, jarY = top + 365;
  rounded(ctx,jarX-28,jarY,56,70,11,"#f7ead533");ctx.strokeStyle="#e3d8bd";ctx.lineWidth=2;ctx.stroke();
  rounded(ctx,jarX-32,jarY-4,64,9,3,"#c7b78f");
  for(let i=0;i<frame.state.caught;i++){ctx.fillStyle="#ffde7b";ctx.beginPath();ctx.arc(jarX-15+(i%4)*10,jarY+48-Math.floor(i/4)*12,3,0,Math.PI*2);ctx.fill();}
  ctx.fillStyle="#fff2cf";ctx.font='14px "Muse Sans", sans-serif';ctx.fillText(`Lights ${frame.state.caught} / 12`,24,top+fieldH-20);ctx.textAlign="right";ctx.fillText("Scripted example play",w-24,top+fieldH-20);ctx.textAlign="left";
  if(frame.endCard){ctx.fillStyle="#252535dc";ctx.fillRect(0,top,w,fieldH);ctx.fillStyle="#f5e9c8";ctx.textAlign="center";ctx.font='58px "Muse Pixel", monospace';ctx.fillText("Your turn.",w/2,top+225);ctx.font='21px "Muse Sans", sans-serif';ctx.fillText("Same fireflies. A fresh jar.",w/2,top+265);ctx.textAlign="left";}
  ctx.fillStyle="#5f515f";ctx.font='18px "Muse Sans", sans-serif';ctx.fillText("A little challenge to send a friend.",38,755);
  ctx.fillStyle="#543653";ctx.font='28px "Muse Pixel", monospace';ctx.fillText("Play Lantern Catch",38,806);
  ctx.font='17px "Muse Sans", sans-serif';ctx.fillText("musefloor.world/lantern.html?round=v1-0000002a",38,840);
}
