import React, { useRef, useEffect } from "react";

const Canvas = (props) => {
  const canvasRef = useRef(null);
  

  return (
    <>
      <canvas ref={canvasRef} />
    </>
  );
}

export default Canvas;