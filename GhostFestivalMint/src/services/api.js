export async function getCurrnetSupplies() {
  const symbol = "GFNFT";
  const domain = "http://localhost:7078";
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
  const series = tokenJson.series;
  let currentSupplies = {};
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
