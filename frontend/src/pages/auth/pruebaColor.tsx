import { useState } from "react";
import { HexColorPicker } from "react-colorful";

const PruebaColor = () => {
  const [color, setColor] = useState("#aabbcc");

  return (
    <div style={{ padding: "50px" }}>
      <h2>Prueba Mínima</h2>
      <p>Color seleccionado: {color}</p>
      
      {/* Componente puro sin estilos extra */}
      <HexColorPicker color={color} onChange={setColor} />
    </div>
  );
};

export default PruebaColor;