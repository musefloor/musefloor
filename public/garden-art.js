export const seeds = {
  daisy: { name: "Daisy", color: "#eac45c", note: "A little spot of sunshine." },
  lavender: { name: "Lavender", color: "#aa91c3", note: "Tall, purple, pleasantly unruly." },
  mint: { name: "Mint", color: "#739d70", note: "Leaves in every direction." },
};

function drawing(type, stage) {
  if (stage === 0) return '<path d="M45 91q5-14 12-5q-1 11-12 5" fill="#dfc7a0"/><path d="m48 88 5-3" stroke="#aa895e" stroke-width="2"/>';
  if (stage === 1) return '<path d="M51 94V68" stroke="#537849" stroke-width="4" stroke-linecap="round"/><path d="M51 78Q22 75 28 57Q52 55 51 78M52 73Q78 65 74 52Q50 52 52 73" fill="#84a36c"/><path d="m34 63 17 16 16-20" fill="none" stroke="#537849" stroke-width="2"/>';
  if (type === "daisy") return '<path d="M52 95Q48 74 51 47M50 79 34 68M51 85 71 72" fill="none" stroke="#587847" stroke-width="4" stroke-linecap="round"/><path d="M47 80Q19 79 24 62Q43 64 47 80M54 87Q80 83 78 66Q57 72 54 87" fill="#8ba66b"/><g fill="#fff9e5" stroke="#ede3c9" stroke-width="1"><ellipse cx="51" cy="31" rx="9" ry="17"/><ellipse cx="51" cy="31" rx="9" ry="17" transform="rotate(60 51 47)"/><ellipse cx="51" cy="31" rx="9" ry="17" transform="rotate(120 51 47)"/><ellipse cx="51" cy="31" rx="9" ry="17" transform="rotate(180 51 47)"/><ellipse cx="51" cy="31" rx="9" ry="17" transform="rotate(240 51 47)"/><ellipse cx="51" cy="31" rx="9" ry="17" transform="rotate(300 51 47)"/></g><circle cx="51" cy="47" r="12" fill="#e7b949"/><circle cx="48" cy="44" r="2" fill="#f8d979"/><circle cx="55" cy="49" r="2" fill="#c79439"/>';
  if (type === "lavender") return '<g fill="none" stroke="#688250" stroke-width="3" stroke-linecap="round"><path d="M50 95 36 45M50 95 52 25M50 95 71 42"/><path d="m45 76-15-9m22 9 13-13m-16 2-9-12"/></g><g fill="#9e83b8"><ellipse cx="35" cy="43" rx="7" ry="15" transform="rotate(-17 35 43)"/><ellipse cx="52" cy="25" rx="7" ry="19"/><ellipse cx="72" cy="40" rx="7" ry="16" transform="rotate(19 72 40)"/></g><g fill="#c4a9d7"><circle cx="32" cy="38" r="4"/><circle cx="38" cy="45" r="4"/><circle cx="49" cy="17" r="4"/><circle cx="55" cy="26" r="4"/><circle cx="49" cy="34" r="4"/><circle cx="71" cy="31" r="4"/><circle cx="75" cy="41" r="4"/></g>';
  return '<path d="M50 95V39M50 78 26 66M50 70 76 56M50 54 34 44" fill="none" stroke="#476c4b" stroke-width="4" stroke-linecap="round"/><g fill="#7eaa79" stroke="#577f58" stroke-width="1.5"><path d="M50 85Q19 82 19 60Q45 57 50 85"/><path d="M50 73Q80 77 85 48Q56 43 50 73"/><path d="M49 58Q24 57 27 34Q52 34 49 58"/><path d="M50 47Q70 43 67 22Q47 24 50 47"/></g><g fill="none" stroke="#577f58" stroke-width="1.5"><path d="m27 67 20 15m10-13 20-14M33 41l13 13m8-14 7-10"/></g>';
}

export function plantArt(type, stage = 2) {
  return `<svg viewBox="0 0 100 110" aria-hidden="true"><ellipse cx="50" cy="96" rx="26" ry="6" fill="#395637" opacity=".12"/>${drawing(type, stage)}</svg>`;
}

export function gardenArt() {
  const plants = ["lavender", "daisy", "mint", "mint", "daisy", "lavender", "daisy", "mint", "daisy"];
  let plots = "";
  for (let row = 0; row < 3; row += 1) {
    for (let col = 0; col < 3; col += 1) {
      const x = 400 + (col - row) * 111;
      const y = 89 + (col + row) * 58;
      plots += `<g transform="translate(${x} ${y})"><path d="M0 0 99 51 0 102-99 51Z" fill="#ba9872"/><path d="M-99 51 0 102 99 51v13L0 115-99 64Z" fill="#a6835f"/><path d="M0 8 86 51 0 94-86 51Z" fill="#ddc2a0"/><g fill="#b3926b" opacity=".6"><ellipse cx="-40" cy="50" rx="3" ry="1.5"/><ellipse cx="37" cy="62" rx="2" ry="1"/><ellipse cx="14" cy="76" rx="3" ry="1.5"/><ellipse cx="18" cy="39" rx="2" ry="1"/></g><g transform="translate(-55 -45) scale(1.1)">${drawing(plants[row * 3 + col], 2)}</g></g>`;
    }
  }
  return `<svg viewBox="0 0 800 510" role="img" aria-label="A little garden of daisies, lavender, and mint in nine raised beds"><rect width="800" height="510" fill="#dfe8d4"/><path d="M0 371Q168 305 304 373T800 348V510H0Z" fill="#d4dfc7"/><ellipse cx="404" cy="338" rx="312" ry="133" fill="#c7d5b9" opacity=".65"/><g fill="#98ad84"><path d="m96 366-4-15 9 13 8-17-3 21Z"/><path d="m660 327 2-18 7 17 11-8-6 17Z"/><path d="m592 445-2-15 7 13 9-13-4 18Z"/><path d="m179 133 2-12 5 11 8-6-6 13Z"/></g>${plots}<g transform="translate(128 357) rotate(-14)"><rect width="45" height="57" rx="3" fill="#f6eed6"/><rect x="5" y="5" width="35" height="33" rx="2" fill="#e5ce87"/><path d="M24 31V18m0 7-9-4m9 0 8-6" stroke="#698451" stroke-width="3"/><path d="M9 46h27M9 51h18" stroke="#a79a77" stroke-width="2"/></g><g transform="translate(628 161) rotate(15)"><ellipse cx="21" cy="22" rx="23" ry="16" fill="none" stroke="#597b72" stroke-width="8"/><path d="M1 23h40v41H1Z" fill="#7c9f92"/><ellipse cx="21" cy="23" rx="20" ry="7" fill="#99b8a5"/><path d="m40 42 26-15 6 5-31 25Z" fill="#6b9183"/><path d="m64 24 10 13" stroke="#44685f" stroke-width="5" stroke-linecap="round"/></g></svg>`;
}
