const apiUrl = "http://localhost:7078";
// const apiUrl = "http://207.148.17.86:7078";

function fetchBadgeBalance(myAddress) {
  let commonBadges = 0;
  let rareBadges = 0;
  let epicBadges = 0;
  $.getJSON(apiUrl + "/api/getAccount?account=" + myAddress, function (res) {
    console.log(res);
    if (!res) {
      alert("Cannot connect to the api server");
      console.log("error 1");
    } else if (res.error && res.error !== "pending") {
      alert("Cannot connect to the api server");
      console.log("error 2");
    } else {
      const balances = res.balances;

      for (let i = 0; i < balances.length; i++) {
        if (balances[i].symbol == ghostFestivalSymbol) {
          nftIDs = balances[i].ids;
          for (let j = 0; j < nftIDs.length; j++) {
            $.getJSON(
              apiUrl +
                "/api/getNFTs?account=" +
                myAddress +
                "&symbol=" +
                ghostFestivalSymbol +
                "&IDText=" +
                nftIDs[j],
              function (nthNft) {
                nthNft = JSON.parse(nthNft);
                console.log("====1", nthNft);
                const series = nthNft[0].series;

                if (parseInt(series) == 5) commonBadges++;
                else if (parseInt(series) == 6) rareBadges++;
                else if (parseInt(series) == 7) epicBadges++;
              }
            );
          }
        }
      }
    }
  });
  console.log("**", commonBadges, rareBadges, epicBadges);
  return { commonBadges, rareBadges, epicBadges };
}
