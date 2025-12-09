import { setupIonicReact } from '@ionic/react'
setupIonicReact();
import { useState } from "react";
import { IonButton } from "@ionic/react";
import "./FontSelector.css";

const fonts = [
  { id: 1, name: "Atkinson Hyperlegible", css: "'Atkinson Hyperlegible', sans-serif" },
  { id: 2, name: "Verdana", css: "Verdana, Geneva, Tahoma, sans-serif" },
  { id: 3, name: "Lato", css: "Lato" },
];

type Props = {
  onSelect?: (font: string) => void;
};

export default function FontSelector({ onSelect }: Props) {
  const [selected, setSelected] = useState<number | null>(null);

  return (
    <div className="fontSelector-grid">
      {fonts.map((font) => (
        <IonButton
          key={font.id}
          fill="clear"
          role="radio"
          aria-checked={selected === font.id}
          aria-label={`Texto de ejemplo, fuente ${font.name}`}
          className={`fontSelector-card ${
            selected === font.id ? "fontSelected" : ""
          }`}
          onClick={() => {
            setSelected(font.id);
            onSelect?.(font.css);
          }}
        >
          <div className="fontPreview" style={{ fontFamily: font.css }}>
            ABCD<br />abcd
          </div>
          <div className="fontLabel" style={{ fontFamily: font.css }}>{font.name}</div>
        </IonButton>
      ))}
    </div>
  );
}
