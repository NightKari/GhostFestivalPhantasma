import { useEffect, useState } from "react";
import { Box, Text, Image } from "@chakra-ui/react";
import { getCurrnetSupply } from "../services/api";

export default function GhostBox() {
  const maxSupply = 2268;
  const [currentSupply, setCurrentSupply] = useState(0);
  const [mpSrc, getMpSrc] = useState("");

  const getSrc = () => {
    let mvSrc = "images/Crate-Belf--0177.png";
    getMpSrc(mvSrc);
  };

  const updateCurrentSupply = async () => {
    const currentSupply = await getCurrnetSupply();
    setCurrentSupply(currentSupply);
  };

  useEffect(() => {
    updateCurrentSupply();
    const intervalId = setInterval(() => {
      try {
        updateCurrentSupply();
      } catch (e) {}
    }, 10000);

    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    getSrc();
  });

  return (
    <Box className="column-5 w-col w-col-4 w-col-tiny-tiny-stack">
      <Box className="div-block-3">
        <Box>
          <Box className="div-block">
            <h1 className="heading">
              Rare
              <br />
              <span className="text-span">Bloot Crate</span>.
            </h1>
          </Box>
        </Box>
        <Box className="boxImageContainer">
          <Image className="hero-image" src={mpSrc} autoPlay loop muted />
          <Text className="paragraph">
            {currentSupply}/{maxSupply}
          </Text>
        </Box>
      </Box>
    </Box>
  );
}
