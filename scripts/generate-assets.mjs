import { mkdir, writeFile } from "node:fs/promises";
const shapes = {
  bille:
    '<circle cx="60" cy="61" r="35" fill="#a5ddd2"/><path d="M40 32Q86 56 40 91Q73 72 78 38" fill="#e4a84c"/><path d="M39 41Q32 48 33 58" stroke="white" stroke-width="7"/>',
  yoyo: '<path d="M72 24Q98 5 97 33T73 61" fill="none"/><ellipse cx="68" cy="68" rx="30" ry="33" fill="#5ca6a0"/><ellipse cx="53" cy="66" rx="28" ry="34" fill="#9bd6cc"/><ellipse cx="53" cy="66" rx="12" ry="16" fill="#f5c367"/><path d="M34 48L40 42" stroke="white" stroke-width="5"/>',
  corde:
    '<path d="M30 38C-2 108 122 108 87 37C54 -17 35 63 63 79" fill="none" stroke="#cd7951" stroke-width="7"/><rect x="23" y="21" width="15" height="39" rx="7" fill="#5e9b96"/><rect x="80" y="24" width="15" height="39" rx="7" fill="#5e9b96"/>',
  toupie:
    '<path d="M27 57L61 102L94 57" fill="#d8874e"/><ellipse cx="60" cy="54" rx="35" ry="17" fill="#eac57d"/><path d="M29 62L87 70M40 78L76 84" stroke="#7aa7a0" stroke-width="7"/><rect x="55" y="21" width="11" height="30" rx="5" fill="#a96c49"/>',
  ressort:
    '<path d="M24 85C1 65 102 52 95 36S17 18 23 42S103 55 96 71S18 89 22 64S108 66 99 87S18 108 24 85" fill="none" stroke="#be7994" stroke-width="7"/><path d="M23 42Q56 18 95 36M22 64Q57 45 96 71" fill="none" stroke="#80aaa2" stroke-width="7"/>',
  billes:
    '<path d="M14 50L87 40L108 67L38 84Z" fill="#e7c994"/><path d="M14 50V83L38 105V84M38 105L108 87V67" fill="#ba8552"/><path d="M15 49V21L87 12V40" fill="#e2be87"/><circle cx="39" cy="60" r="10" fill="#80b9af"/><circle cx="61" cy="57" r="10" fill="#c68998"/><circle cx="84" cy="55" r="10" fill="#e5b656"/><circle cx="53" cy="73" r="9" fill="#7d9ec0"/><circle cx="77" cy="70" r="9" fill="#99bd81"/>',
  regle:
    '<g transform="rotate(-18 60 60)"><rect x="12" y="40" width="96" height="38" rx="4" fill="#e7bb68"/><path d="M20 41v9m10-9v6m10-6v9m10-9v6m10-6v9m10-9v6m10-6v9m10-9v6"/><circle cx="35" cy="64" r="7" fill="#fff0d6"/><path d="M54 70L61 56L68 70Z" fill="#fff0d6"/><rect x="80" y="57" width="12" height="13" fill="#fff0d6"/></g>',
  trousse:
    '<path d="M18 47Q20 35 33 35H91L105 51V82H16Z" fill="#c88576"/><path d="M18 49H102M27 41H86" stroke="#f4d59b" stroke-width="5"/><rect x="38" y="57" width="42" height="18" rx="4" fill="#f7deb5"/><path d="M90 45v15h10V45" fill="#d6a454"/>',
  stylo:
    '<g transform="rotate(24 60 60)"><rect x="47" y="31" width="27" height="61" rx="7" fill="#f1d9a9"/><path d="M49 90L60 111L72 90" fill="#82aaa2"/><rect x="46" y="16" width="29" height="26" rx="7" fill="#8fb9be"/><path d="M50 17V9m9 8V7m10 10V10" stroke-width="6" stroke="#c06764"/><path d="M75 31v27h7V36" fill="#b3cbd2"/></g>',
  gomme:
    '<path d="M23 41L72 27L100 48L51 63Z" fill="#f1bece"/><path d="M23 41V76L51 96V63M51 96L100 79V48" fill="#d698ad"/><path d="M37 38L85 32L94 78L48 90Z" fill="#eee4c5"/><path d="M55 58l16-4m-14 12l16-4" stroke="#82a698"/>',
  carnet:
    '<rect x="27" y="17" width="65" height="91" rx="6" fill="#8fabbc"/><path d="M38 18v88M43 39h34M43 49h24" stroke="#e7d7b8"/><rect x="77" y="49" width="26" height="25" rx="4" fill="#d8aa67"/><path d="M83 49v-8a7 7 0 0 1 14 0v8" fill="none"/><circle cx="90" cy="61" r="3" fill="#665242"/>',
  globe:
    '<path d="M58 78V100M39 104H81" stroke-width="9" stroke="#bd8c57"/><path d="M65 13Q110 28 93 66Q81 85 52 85" fill="none" stroke="#d6aa67" stroke-width="6"/><circle cx="58" cy="46" r="32" fill="#84bdb8"/><path d="M36 22L55 30L52 48L41 51L48 68L37 67M67 18L71 34L86 38L80 51L63 57L60 75" fill="#d1d294" stroke="none"/><path d="M29 45H88M58 15Q82 45 58 77Q33 47 58 15Z" fill="none" opacity=".4"/>',
  manette:
    '<path d="M62 36C101 8 19 17 48 4" fill="none" stroke-width="5"/><path d="M24 39Q15 40 12 61L9 85Q16 100 31 79H87Q104 100 111 84L105 54Q103 39 92 39Z" fill="#aaa3ba"/><path d="M29 49v25M17 61h25" stroke="#4e4a5c" stroke-width="9"/><circle cx="89" cy="56" r="6" fill="#d27e78"/><circle cx="98" cy="69" r="6" fill="#d3ad61"/><path d="M54 70h6m8 0h6" stroke-width="5"/>',
  cartouche:
    '<rect x="25" y="17" width="70" height="87" rx="5" fill="#a3b7a7"/><rect x="35" y="30" width="50" height="42" rx="3" fill="#f1d6a7"/><path d="M38 62L51 42L63 57L72 43L82 62" fill="#bd876b"/><path d="M39 87v15m10-15v15m10-15v15m10-15v15m10-15v15" stroke="#717b71" stroke-width="5"/>',
  de: '<path d="M25 38L66 16L102 38L61 61Z" fill="#c2b1dd"/><path d="M25 38V83L61 107V61" fill="#a18abf"/><path d="M61 61L102 38V83L61 107Z" fill="#b09ecd"/><circle cx="65" cy="37" r="5" fill="#f9edcf"/><path d="M38 58v1m11 26v1M77 61v1m13-8v1m-13 33v1m13-8v1" stroke="#f9edcf" stroke-width="8"/>',
  portable:
    '<rect x="28" y="12" width="65" height="100" rx="13" fill="#d1be9d"/><rect x="36" y="23" width="49" height="42" rx="5" fill="#667b75"/><rect x="41" y="28" width="39" height="31" rx="2" fill="#aac49e"/><path d="M47 49l8-9 9 5 9-10" fill="none" stroke="#7c9c7b"/><path d="M44 76v18M35 85h18" stroke="#526865" stroke-width="6"/><circle cx="77" cy="81" r="5" fill="#bd716d"/><circle cx="83" cy="93" r="5" fill="#bd716d"/><path d="M58 103h10" stroke-width="4"/>',
  tapis:
    '<path d="M28 30H93L112 96H9Z" fill="#989cc1"/><path d="M49 30L41 96M72 30L80 96M23 51H100M17 73H106" stroke="#e8d8ba" stroke-width="3"/><path d="M59 35l-8 10h16ZM21 60l10-6v13ZM98 60l-10-6v13ZM60 89l-9-10h18Z" fill="#e1a5aa"/>',
  borne:
    '<path d="M35 13H87L82 63L100 86L92 110H24L20 83L35 60Z" fill="#639e9e"/><path d="M35 16H85V32H35Z" fill="#eacb88"/><path d="M43 23h32" stroke="#bb7657"/><path d="M37 37H78L74 63H37Z" fill="#465968"/><path d="M54 44l3 6 7 1-5 4 1 7-6-4-6 4 2-7-5-4 7-1Z" fill="#eac879"/><path d="M22 83H98M38 73v-7" stroke-width="4"/><circle cx="39" cy="67" r="5" fill="#d87d6d"/><circle cx="74" cy="75" r="4" fill="#eccb86"/><rect x="47" y="91" width="25" height="9" fill="#467d83"/>',
  cassette:
    '<rect x="14" y="32" width="93" height="62" rx="7" fill="#7d9a9d"/><rect x="23" y="41" width="75" height="35" rx="5" fill="#f0d7ab"/><path d="M34 84L29 94H91L84 84Z" fill="#aec4b9"/><circle cx="40" cy="59" r="10" fill="#675951"/><circle cx="80" cy="59" r="10" fill="#675951"/><path d="M50 59H70" stroke="#ad7953" stroke-width="7"/><path d="M29 44H91" stroke="#d79579"/>',
  casque:
    '<path d="M22 68V48C22 2 97 2 97 48V69" fill="none" stroke="#778d91" stroke-width="10"/><path d="M25 41C34 6 86 6 94 41" fill="none" stroke="#c7b899" stroke-width="5"/><rect x="17" y="57" width="23" height="41" rx="11" fill="#d08b59"/><rect x="80" y="57" width="23" height="41" rx="11" fill="#d08b59"/><path d="M93 98Q95 115 68 112" fill="none"/>',
  cd: '<circle cx="60" cy="60" r="44" fill="#b6c7ca"/><path d="M60 17L48 49L18 47M60 103L70 72L102 72" fill="#dcc0cb" stroke="none"/><path d="M100 40L71 53L83 22M22 82L49 69L36 100" fill="#dce3bc" stroke="none"/><circle cx="60" cy="60" r="13" fill="#f6e7cd"/><circle cx="60" cy="60" r="5" fill="#9aa9a8"/>',
  baladeur:
    '<rect x="25" y="21" width="69" height="83" rx="10" fill="#ce9d52"/><rect x="35" y="38" width="49" height="38" rx="4" fill="#7c9e9b"/><rect x="44" y="47" width="31" height="19" rx="4" fill="#e7d5b1"/><circle cx="50" cy="56" r="4"/><circle cx="68" cy="56" r="4"/><path d="M35 86H84M36 17h9m7 0h9m7 0h9" stroke-width="5"/><path d="M91 31Q118 28 109 9" fill="none"/>',
  mp3: '<path d="M72 25Q96 25 92 53L87 86H75" fill="#c5bfa6"/><rect x="34" y="19" width="46" height="84" rx="10" fill="#a4bead"/><rect x="40" y="29" width="34" height="24" rx="4" fill="#e0e1bc"/><circle cx="57" cy="76" r="15" fill="#dce2cc"/><path d="M54 70l8 6-8 6Z" fill="#789a87"/>',
  radio:
    '<path d="M34 35V19H87V35" fill="none" stroke-width="7"/><rect x="10" y="32" width="102" height="65" rx="7" fill="#ab9d8f"/><circle cx="32" cy="66" r="17" fill="#596866"/><circle cx="91" cy="66" r="17" fill="#596866"/><circle cx="32" cy="66" r="9" fill="#7b8b83"/><circle cx="91" cy="66" r="9" fill="#7b8b83"/><rect x="52" y="52" width="20" height="27" fill="#e1c799"/><path d="M43 40H78M93 30L108 8" stroke-width="4"/>',
  disquette:
    '<path d="M25 15H85L98 28V107H25Z" fill="#9b8cba"/><rect x="42" y="16" width="39" height="31" fill="#c4cbc1"/><rect x="60" y="20" width="11" height="23" fill="#7b7c83"/><rect x="35" y="60" width="52" height="39" rx="3" fill="#f1ddba"/><path d="M42 71H79M42 80H69" stroke="#b3a898"/>',
  souris:
    '<path d="M59 40C58 15 99 32 95 7" fill="none" stroke-width="4"/><path d="M31 72C25 25 89 27 91 72L87 90Q59 117 35 91Z" fill="#e1d4b4"/><path d="M59 36V69M33 68H89" fill="none"/><rect x="55" y="47" width="9" height="15" rx="4" fill="#94a394"/>',
  usb: '<g transform="rotate(25 60 60)"><rect x="46" y="12" width="30" height="30" fill="#c2c8c0"/><path d="M53 21h5m6 0h5" stroke-width="5"/><rect x="38" y="39" width="46" height="65" rx="12" fill="#8fbdb4"/><path d="M48 49V90" stroke="#bed8cc" stroke-width="6"/><circle cx="61" cy="91" r="5" fill="#628e88"/></g>',
  clavier:
    '<path d="M20 39H100L113 87H7Z" fill="#cec7af"/><path d="M25 48H96M21 59H100M18 70H104M39 81H82" stroke="#f6e7cc" stroke-width="6"/><path d="M35 45l-4 28m17-28-2 28m15-28v28m13-28 2 28m12-28 4 28" stroke="#928d7d"/>',
  ecran:
    '<path d="M47 81L41 102H85L78 81" fill="#bbb29b"/><rect x="17" y="15" width="87" height="71" rx="11" fill="#dfd1af"/><rect x="26" y="23" width="68" height="50" rx="9" fill="#6c9691"/><path d="M34 63L47 43L62 54L75 36L88 63" fill="#9eb5a0" stroke="none"/><circle cx="90" cy="80" r="2" fill="#d99761"/><path d="M34 102H91" stroke-width="6"/>',
  robot:
    '<path d="M60 22V9M35 70L20 84M85 70L100 84M46 95v15m29-15v15" stroke-width="8" stroke="#ae8959"/><circle cx="60" cy="8" r="5" fill="#d49b57"/><rect x="30" y="23" width="61" height="39" rx="10" fill="#a5c3b7"/><rect x="36" y="64" width="48" height="35" rx="6" fill="#d5ae6c"/><circle cx="47" cy="41" r="7" fill="#f9e4b6"/><circle cx="74" cy="41" r="7" fill="#f9e4b6"/><path d="M49 53H72"/><path d="M52 73l7 6 8-6v16H52Z" fill="#a2705a"/>',
  reveil:
    '<path d="M28 87L24 99M91 87L96 99" stroke-width="7"/><rect x="12" y="33" width="98" height="57" rx="10" fill="#857d7b"/><rect x="21" y="42" width="80" height="34" rx="5" fill="#4c5555"/><text x="61" y="66" text-anchor="middle" font-family="monospace" font-size="24" fill="#efad78" stroke="none">07:30</text><rect x="45" y="26" width="35" height="7" rx="3" fill="#bab29e"/>',
  telephone:
    '<g transform="rotate(-12 60 60)"><rect x="37" y="9" width="49" height="51" rx="9" fill="#a4b3c0"/><rect x="43" y="18" width="37" height="31" rx="3" fill="#b4d1c2"/><rect x="34" y="60" width="55" height="49" rx="8" fill="#c1ccd0"/><path d="M43 74h8m8 0h5m9 0h7M43 84h8m8 0h5m9 0h7M43 94h8m8 0h5m9 0h7" stroke="#677f87" stroke-width="4"/></g>',
  appareil:
    '<rect x="14" y="35" width="94" height="58" rx="9" fill="#b5c4be"/><rect x="26" y="27" width="19" height="9" rx="3" fill="#8eaba1"/><circle cx="65" cy="64" r="24" fill="#829c99"/><circle cx="65" cy="64" r="16" fill="#516b70"/><circle cx="61" cy="59" r="6" fill="#a1c9c4" stroke="none"/><rect x="23" y="44" width="17" height="11" fill="#f5dcaa"/>',
  lampe:
    '<path d="M49 24L35 83H88L73 24Z" fill="#e2a295"/><path d="M43 73Q40 60 53 58T68 38Q73 34 77 49T66 72T43 73" fill="#e4bf76" stroke="none"/><path d="M48 24L53 10H68L74 24ZM35 83L29 110H94L88 83Z" fill="#92a5a6"/><path d="M36 100H86" stroke="#c0cfbd" stroke-width="4"/>',
  etoile:
    '<path d="M29 84C7 26 104 10 96 84Z" fill="#9399b8"/><path d="M28 84H97L101 103H23Z" fill="#d7c7b0"/><path d="M48 39l2 5 6 1-5 4 2 6-5-4-5 4 1-6-4-4 6-1ZM76 56l2 5 6 1-5 4 2 6-5-4-5 4 1-6-4-4 6-1Z" fill="#f4d98f" stroke="none"/><circle cx="68" cy="31" r="3" fill="#f4d98f" stroke="none"/>',
  planete:
    '<path d="M59 7V21M17 29L99 17M28 27V57M61 23V89M91 18V48" fill="none" stroke="#bd9a63"/><circle cx="28" cy="65" r="16" fill="#8cb6bb"/><circle cx="61" cy="95" r="12" fill="#d3a465"/><circle cx="91" cy="59" r="18" fill="#bd8f9c"/><ellipse cx="91" cy="59" rx="26" ry="7" fill="none" stroke="#e0bf82" transform="rotate(-25 91 59)"/><path d="M18 63L35 69" stroke="#b7cec2" stroke-width="5"/>',
};
await mkdir("public/objects", { recursive: true });
for (const [id, body] of Object.entries(shapes)) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" fill="none"><defs><filter id="shadow" x="-30%" y="-30%" width="160%" height="170%"><feDropShadow dx="0" dy="3" stdDeviation="2" flood-color="#60472d" flood-opacity=".16"/></filter></defs><ellipse cx="61" cy="112" rx="36" ry="4" fill="#70543c" opacity=".10"/><g stroke="#645546" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" filter="url(#shadow)">${body}</g></svg>`;
  await writeFile(`public/objects/${id}.svg`, svg);
}
await writeFile(
  "public/objects/manifest.json",
  JSON.stringify(
    {
      author: "Créations SVG originales pour Le Grenier",
      license:
        "Créations propres au projet ; licence de distribution à choisir par son propriétaire.",
      source: "scripts/generate-assets.mjs",
      externalServices: false,
      assets: Object.keys(shapes).map((id) => ({
        id,
        path: `/objects/${id}.svg`,
        provenance:
          "Dessin vectoriel original, sans logo ni personnage sous licence",
      })),
    },
    null,
    2,
  ),
);
console.log(`${Object.keys(shapes).length} illustrations SVG créées.`);
