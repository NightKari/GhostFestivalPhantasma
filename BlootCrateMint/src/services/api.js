export async function getCurrnetSupply() {
  const symbol = "GFNFT";
  const domain = "http://localhost:7078";
  // const symbol = "GNFT";
  // const domain = "http://testnet.phantasma.io:7078";
  // const domain = "http://207.148.17.86:7078";
  // const domain = "https://seed.ghostdevs.com:7078";
  const getTokenURL = domain + "/api/getToken?symbol=" + symbol;
  let tokenJson;
  await fetch(getTokenURL)
    .then(function (res) {
      return res.json();
    })
    .then(function (data) {
      console.log("====", data);
      tokenJson = data;
    })
    .catch(function (err) {
      console.log(err, " error");
    });
  let result = 0;
  if (!tokenJson) return result;
  const series = tokenJson.series;
  if (!series) return result;
  for (let i = 0; i < series.length; i++) {
    const currentSeriesObj = series[i];
    if (currentSeriesObj.seriesID === 4)
      result = currentSeriesObj.currentSupply;
  }
  return result;
}
