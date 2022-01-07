import { ChakraProvider, Box } from "@chakra-ui/react";
import theme from "./theme";
import GhostBox from "./components/GhostBox";
import "@fontsource/inter";

export default function App() {
  return (
    <ChakraProvider theme={theme}>
      <Box className="w-container">
        <Box className="columns-5 w-row" flexWrap="wrap">
          <div className="column-5 w-col w-col-4 w-col-tiny-tiny-stack"></div>
          <GhostBox />
          <div className="column-5 w-col w-col-4 w-col-tiny-tiny-stack"></div>
        </Box>
      </Box>
    </ChakraProvider>
  );
}
