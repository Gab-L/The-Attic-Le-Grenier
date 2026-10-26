"use client";
import { useId } from "react";
import {
  slots,
  type Definition,
  type Instance,
  type Room,
} from "@/lib/catalog";
type Props = {
  room: Room;
  items: Pick<Instance, "id" | "definition_id">[];
  definitions: Definition[];
  rewards?: string[];
  editable?: boolean;
  selected?: string | null;
  onSlot?: (id: string) => void;
  onItem?: (id: string) => void;
  exportId?: string;
  demo?: boolean;
};
export function RoomScene({
  room,
  items,
  definitions,
  rewards = [],
  editable = false,
  selected,
  onSlot,
  onItem,
  exportId,
  demo,
}: Props) {
  const uid = useId().replaceAll(":", "");
  const wall = { cream: "#f2e4ca", pink: "#ecd5ce", blue: "#cedce2" }[
    room.wall
  ];
  const floor = { honey: "#c99a65", light: "#dac6a4", dark: "#8e7162" }[
    room.floor
  ];
  const accent =
    room.theme === "night"
      ? "#77799b"
      : room.theme === "pastel"
        ? "#b4bda1"
        : "#8aa69b";
  return (
    <svg
      id={exportId}
      className="room-scene"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 900 560"
      role={editable ? "group" : "img"}
      aria-label={
        demo
          ? "Chambre de démonstration décorée de souvenirs"
          : "Votre chambre et ses objets"
      }
    >
      <defs>
        <linearGradient id={`${uid}wall`} x2="0" y2="1">
          <stop stopColor={wall} />
          <stop offset="1" stopColor={wall} stopOpacity=".8" />
        </linearGradient>
        <linearGradient id={`${uid}sun`} x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#fff7d6" stopOpacity=".7" />
          <stop offset="1" stopColor="#fff7d6" stopOpacity="0" />
        </linearGradient>
        <filter
          id={`${uid}shadow`}
          x="-30%"
          y="-30%"
          width="160%"
          height="170%"
        >
          <feDropShadow
            dx="0"
            dy="6"
            stdDeviation="6"
            floodColor="#694b35"
            floodOpacity=".15"
          />
        </filter>
      </defs>
      <rect width="900" height="560" rx="22" fill={wall} />
      <path d="M0 0H900V435H0Z" fill={`url(#${uid}wall)`} />
      <path d="M0 435H900V560H0Z" fill={floor} />
      <path d="M0 435H900V448H0Z" fill="#b28458" />
      <path d="M0 448H900" stroke="#e2bd8c" strokeWidth="3" />
      {[472, 506, 548].map((y) => (
        <path
          key={y}
          d={`M0 ${y}H900`}
          stroke="#8e6744"
          strokeOpacity=".22"
          strokeWidth="2"
        />
      ))}
      {[40, 210, 410, 610, 800].map((x) => (
        <path
          key={x}
          d={`M${x + 35} 448L${x - 30} 560M${x} 472h12`}
          stroke="#8e6744"
          strokeOpacity=".17"
          strokeWidth="2"
        />
      ))}
      <path d="M715 99L900 127V465L575 507Z" fill={`url(#${uid}sun)`} />
      <g filter={`url(#${uid}shadow)`}>
        <rect x="718" y="78" width="130" height="193" rx="3" fill="#b8956e" />
        <rect x="727" y="87" width="111" height="175" fill="#cee0d6" />
        <path d="M727 180L760 140L795 177L838 135V262H727Z" fill="#b4cdb4" />
        <path d="M782 87V262M727 171H838" stroke="#f4e7c9" strokeWidth="8" />
        <rect x="711" y="263" width="145" height="13" rx="3" fill="#d4b48a" />
      </g>
      <path d="M707 67L732 69L727 255L701 276Z" fill={accent} />
      <path d="M840 69L863 67L869 277L844 256Z" fill={accent} />
      <path
        d="M717 71L714 247M854 71L858 247"
        stroke="#fff"
        strokeOpacity=".2"
        strokeWidth="4"
      />
      <path
        d="M698 66H873"
        stroke="#8e735a"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <g transform="translate(38 124) rotate(-6)">
        <rect width="82" height="112" rx="2" fill="#c49b6e" />
        <rect x="6" y="6" width="70" height="100" fill="#f3dcab" />
        <circle cx="42" cy="44" r="21" fill="#d88353" />
        <path d="M9 81L28 57L41 75L60 57L73 81" fill="#7e9d8b" />
        <text
          x="41"
          y="98"
          textAnchor="middle"
          fontSize="8"
          fontFamily="sans-serif"
          fill="#7e6148"
          letterSpacing="2"
        >
          SOUVENIRS
        </text>
      </g>
      <path d="M148 221H706V235H148Z" fill="#bc8b58" />
      <path d="M148 221H706V226H148Z" fill="#e2bb85" />
      <path d="M167 235V255L183 235M668 235V255L684 235" fill="#9d724d" />
      <path d="M148 334H706V348H148Z" fill="#bc8b58" />
      <path d="M148 334H706V339H148Z" fill="#e2bb85" />
      <path d="M167 348V368L183 348M668 348V368L684 348" fill="#9d724d" />
      <ellipse cx="466" cy="514" rx="219" ry="36" fill="#819d8f" opacity=".8" />
      <ellipse
        cx="466"
        cy="514"
        rx="191"
        ry="27"
        fill="none"
        stroke="#d0c4a2"
        strokeWidth="3"
      />
      <path
        d="M260 512H675"
        stroke="#d0c4a2"
        strokeOpacity=".4"
        strokeWidth="2"
      />
      <g filter={`url(#${uid}shadow)`}>
        <path d="M103 444H483V460H103Z" fill="#bc8b58" />
        <path d="M103 444H483V449H103Z" fill="#e7c18c" />
        <path d="M118 460H133V523H118ZM453 460H467V523H453Z" fill="#9f7953" />
        <rect x="335" y="460" width="116" height="54" fill="#c8a06d" />
        <path d="M335 487H451" stroke="#ad8255" strokeWidth="2" />
        <path
          d="M383 471H402M383 498H402"
          stroke="#856647"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </g>
      <g transform="translate(39 354)">
        <path d="M16 71H65L58 111H23Z" fill="#c58060" />
        <path d="M41 70V1" stroke="#6f8867" strokeWidth="5" />
        <path
          d="M40 51C-10 40 6 13 34 33M41 30C78 2 89 31 45 49M39 22C14-8 50-21 42 16"
          fill="#879f77"
        />
      </g>
      <g transform="translate(826 374) scale(.65)">
        <rect x="0" y="37" width="80" height="80" rx="5" fill="#ba895b" />
        <path d="M-7 36L17 18H64L88 37Z" fill="#d0a777" />
        <path d="M30 37H49V117H30Z" fill="#dfc18b" />
        <rect
          x="8"
          y="64"
          width="62"
          height="28"
          rx="2"
          fill="#efe0be"
          transform="rotate(-4 39 78)"
        />
        <text
          x="39"
          y="81"
          textAnchor="middle"
          fontFamily="serif"
          fontStyle="italic"
          fontSize="13"
          fill="#806447"
        >
          à garder ♥
        </text>
      </g>
      {rewards.includes("recreation") && (
        <path
          d="M148 95Q410 133 690 95M173 99l13 27 13-23m30 6 13 27 13-23m30 5 13 27 13-23m30 3 13 27 13-23"
          fill="#c78668"
          stroke="#9c7956"
          strokeWidth="2"
        />
      )}
      {rewards.includes("ecole") && (
        <g>
          <rect x="55" y="264" width="49" height="65" fill="#f8e7ba" />
          <text x="80" y="287" textAnchor="middle" fontSize="12" fill="#997554">
            ABC
          </text>
          <text x="80" y="308" textAnchor="middle" fontSize="12" fill="#997554">
            123
          </text>
        </g>
      )}
      {rewards.includes("gaming") &&
        [260, 340, 550, 650].map((x, i) => (
          <text
            key={x}
            x={x}
            y={80 + (i % 2) * 25}
            fill="#ddba63"
            fontSize="24"
          >
            ✧
          </text>
        ))}
      {rewards.includes("musique") && (
        <g>
          <circle cx="80" cy="302" r="26" fill="#4c5754" />
          <circle cx="80" cy="302" r="10" fill="#d7a06a" />
        </g>
      )}
      {rewards.includes("informatique") && (
        <g>
          <rect x="480" y="369" width="65" height="53" fill="#c9d3bc" />
          <text
            x="512"
            y="400"
            textAnchor="middle"
            fill="#597f7c"
            fontFamily="monospace"
            fontSize="14"
          >
            HELLO_
          </text>
        </g>
      )}
      {rewards.includes("quotidien") && (
        <g>
          <path
            d="M145 56Q410 139 705 56"
            fill="none"
            stroke="#897652"
            strokeWidth="2"
          />
          {[180, 250, 320, 390, 460, 530, 600, 670].map((x, i) => (
            <circle
              key={x}
              cx={x}
              cy={65 + Math.sin(((i + 1) / 9) * Math.PI) * 30}
              r="5"
              fill="#ffe6a1"
              stroke="#ccaa62"
            />
          ))}
        </g>
      )}
      {editable &&
        slots.map((slot) => (
          <g
            key={slot.id}
            role="button"
            tabIndex={0}
            data-slot={slot.id}
            aria-label={`Placer sur ${slot.row}, emplacement ${slot.index + 1}`}
            onClick={() => onSlot?.(slot.id)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSlot?.(slot.id);
              }
            }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              onSlot?.(slot.id);
            }}
            className={`room-slot ${selected ? "available" : ""}`}
          >
            <rect
              x={slot.x}
              y={slot.y - 76}
              width="78"
              height="79"
              rx="9"
              fill="transparent"
              stroke={selected ? "#745b40" : "#9b8465"}
              strokeOpacity={selected ? ".7" : ".25"}
              strokeDasharray="5 5"
            />
            <text
              pointerEvents="none"
              x={slot.x + 39}
              y={slot.y - 27}
              textAnchor="middle"
              fill="#947a58"
              opacity=".6"
              fontSize="24"
            >
              +
            </text>
          </g>
        ))}
      {room.placements.map((p) => {
        const item = items.find((i) => i.id === p.instanceId);
        const d = definitions.find((d) => d.id === item?.definition_id);
        const slot = slots.find((s) => s.id === p.slotId);
        if (!d || !slot) return null;
        const width = d.width === 2 ? 150 : 81;
        return (
          <g
            key={p.instanceId}
            role={editable ? "button" : undefined}
            tabIndex={editable ? 0 : undefined}
            aria-label={editable ? `Sélectionner ${d.name}` : d.name}
            onClick={() => onItem?.(p.instanceId)}
            onKeyDown={(e) => {
              if (editable && (e.key === "Enter" || e.key === " ")) {
                e.preventDefault();
                onItem?.(p.instanceId);
              }
            }}
            className={editable ? "placed-object" : ""}
          >
            <title>{d.name}</title>
            {selected === p.instanceId && (
              <rect
                x={slot.x - 3}
                y={slot.y - 84}
                width={width + 6}
                height="90"
                rx="9"
                stroke="#ad603c"
                strokeWidth="3"
                fill="none"
              />
            )}
            <image
              pointerEvents="none"
              href={d.illustration}
              x={slot.x}
              y={slot.y - (d.width === 2 ? 100 : 83)}
              width={width}
              height={d.width === 2 ? 103 : 86}
            />
          </g>
        );
      })}
    </svg>
  );
}
export function Cardboard({ opening = false }: { opening?: boolean }) {
  return (
    <svg
      className={`cardboard ${opening ? "is-opening" : ""}`}
      viewBox="0 0 230 180"
      role="img"
      aria-label="Carton de souvenirs fermé"
    >
      <ellipse cx="116" cy="160" rx="86" ry="12" fill="#694a32" opacity=".12" />
      <path
        className="carton-lid"
        d="M31 64L114 27L202 62L117 105Z"
        fill="#e5ba7d"
        stroke="#977046"
        strokeWidth="2"
      />
      <path
        d="M31 64V133L117 169V105Z"
        fill="#c8955e"
        stroke="#977046"
        strokeWidth="2"
      />
      <path
        d="M117 105L202 62V132L117 169Z"
        fill="#b78350"
        stroke="#977046"
        strokeWidth="2"
      />
      <path
        className="carton-tape"
        d="M72 45L160 83L160 123L141 132V93L54 54Z"
        fill="#edd5a5"
        opacity=".85"
      />
      <path d="M62 81L94 94V128L62 115Z" fill="#f6e6c4" />
      <path d="M68 94L85 101M68 101L81 106" stroke="#b08e62" strokeWidth="2" />
      <path
        d="M178 112v18m-5-13 5-5 5 0"
        stroke="#785331"
        strokeWidth="2"
        fill="none"
      />
      <path d="M43 69L43 128M190 70V128" stroke="#d3a26a" strokeWidth="2" />
      <path d="M114 28L117 105" stroke="#aa7a46" strokeWidth="2" />
      <text
        x="77"
        y="144"
        transform="rotate(23 77 144)"
        fontFamily="serif"
        fontStyle="italic"
        fontSize="13"
        textAnchor="middle"
        fill="#735034"
      >
        mes trésors
      </text>
    </svg>
  );
}
