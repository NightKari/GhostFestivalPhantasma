export async function getCurrnetSupplies() {
  //   const symbol = "GFNFT";
  //   const domain = "http://localhost:7078";
  const symbol = "GNFT";
  const domain = "http://testnet.phantasma.io:7078";
  const getTokenURL = domain + "/api/getToken?symbol=" + symbol;
  let tokenJson;
  await fetch(getTokenURL)
    .then(function (res) {
      return res.json();
    })
    .then(function (data) {
      tokenJson = data;
    })
    .catch(function (err) {
      console.log(err, " error");
    });
  let currentSupplies = { series1: 0, series2: 0, series3: 0 };
  if (!tokenJson) return currentSupplies;
  const series = tokenJson.series;
  if (!series) return currentSupplies;
  for (let i = 0; i < series.length; i++) {
    const currentSeriesObj = series[i];
    if (currentSeriesObj.seriesID === 1)
      currentSupplies.series1 = currentSeriesObj.currentSupply;
    else if (currentSeriesObj.seriesID === 2)
      currentSupplies.series2 = currentSeriesObj.currentSupply;
    else if (currentSeriesObj.seriesID === 3)
      currentSupplies.series3 = currentSeriesObj.currentSupply;
  }
  return currentSupplies;
}
