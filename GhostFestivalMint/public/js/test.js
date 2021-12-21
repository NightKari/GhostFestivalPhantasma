const NFTSymbol = "GFNFT";
const apiUrl = "http://localhost:7078";
const link = new PhantasmaLink(NFTSymbol);

function httpGet(theUrl) {
  var xmlHttp = new XMLHttpRequest();
  xmlHttp.open("GET", theUrl, false); // false for synchronous request
  xmlHttp.send(null);
  return xmlHttp.responseText;
}

function fetchBoxBalance(myAddress) {
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
      let boxNftIDs = [];
      for (let i = 0; i < balances.length; i++) {
        if (balances[i].symbol == NFTSymbol) {
          nftIDs = balances[i].ids;
          for (let j = 0; j < nftIDs.length; j++) {
            let nthNft = httpGet(
              apiUrl +
                "/api/getNFTs?account=" +
                myAddress +
                "&symbol=" +
                NFTSymbol +
                "&IDText=" +
                nftIDs[j]
            );
            nthNft = JSON.parse(nthNft);
            const series = nthNft[0].series;
            if (
              parseInt(series) == 1 ||
              parseInt(series) == 2 ||
              parseInt(series) == 3
            ) {
              boxNftIDs.push(nftIDs[j].toString());
            }
          }

          console.log("**", boxNftIDs);
          reloadBoxGrid(boxNftIDs);
        }
      }
    }
  });
}

function formatWalletAddress(myAddress) {
  document.getElementById("connectBtn").innerText =
    myAddress.substring(0, 5) + "..." + myAddress.substring(43);
}

function reloadBoxGrid(boxNftIDs) {
  let numOfCrates = boxNftIDs.length;
  let fakeNumOfCrates =
    numOfCrates % 3 == 0
      ? numOfCrates
      : (numOfCrates + 1) % 3 == 0
      ? numOfCrates + 1
      : numOfCrates + 2;
  let strAreas = "";
  for (let i = 1; i <= fakeNumOfCrates; i++) {
    if ((i - 1) % 3 == 0) {
      strAreas += '"Area-' + i + " ";
    } else if (i % 3 == 0) {
      strAreas += "Area-" + i + '" ';
    } else {
      strAreas += "Area-" + i + " ";
    }
  }
  if (fakeNumOfCrates % 3 != 0) strAreas += '"';

  document.getElementById("crate-grid").innerHTML = "";
  document.getElementById("crate-grid").style.gridTemplateAreas = strAreas;
  for (let i = 1; i <= numOfCrates; i++) {
    document.getElementById("crate-grid").innerHTML +=
      '<div class="div-block-open area' +
      (numOfCrates == 1 ? 2 : i) +
      '">' +
      '<div class="columns-9 w-row">' +
      '<div class="column-19 w-col w-col-10">' +
      '<img src="images/Render-1-test.png" loading="lazy" sizes="(max-width: 767px) 95vw, (max-width: 991px) 598.328125px, 775px" width="540" srcset="images/Render-1-test-p-500.png 500w, images/Render-1-test-p-800.png 800w, images/Render-1-test.png 1080w" alt="" class="image-12">' +
      "</div>" +
      '<div class="column-20 w-col w-col-2">' +
      '<a href="#" class="button-open-box w-button" onclick="burnOnWebsite(`' +
      "boxID" +
      boxNftIDs[i - 1] +
      '`)">OPEN</a>' +
      "</div>" +
      "</div>" +
      "</div>";
  }
}

function login() {
  link.login(function (success) {
    if (success) {
      const myAddress = link.account.address;
      formatWalletAddress(myAddress);
      fetchBoxBalance(myAddress);
    } else {
      alert("Failed to connect Phantasma wallet");
    }
  });
}

function PurchaseBox() {
  const myGhostFestival = JSON.parse(localStorage.getItem("GhostFestival"));
  console.log("myGhostFestival", myGhostFestival);
  if (!link.account) {
    alert("Please connect your wallet first");
    return;
  }
  const myAddress = link.account.address; //public addr of dummy wallet genesis, guid

  const gasPrice = 1000000;
  const gaslimit = 10000000;

  if (
    myGhostFestival[0] == 0 &&
    myGhostFestival[1] == 0 &&
    myGhostFestival[2] == 0
  ) {
    alert("Please choose at least one crate");
    return;
  }

  const sb = new ScriptBuilder();
  let script = sb.callContract("gas", "AllowGas", [
    myAddress,
    sb.nullAddress(),
    gasPrice,
    gaslimit,
  ]);

  for (let i = 0; i < myGhostFestival[0]; i++) {
    script = script.callContract(NFTSymbol, "mint", [myAddress, 1]);
  }

  for (let i = 0; i < myGhostFestival[1]; i++) {
    script = script.callContract(NFTSymbol, "mint", [myAddress, 2]);
  }

  for (let i = 0; i < myGhostFestival[2]; i++) {
    script = script.callContract(NFTSymbol, "mint", [myAddress, 3]);
  }

  script = script.callContract("gas", "SpendGas", [myAddress]).endScript();

  link.sendTransaction("main", script, "festival1.0", function (result) {
    console.log("========", result);
    if (!result.success) {
      alert(
        "Failed to mint " +
          (myGhostFestival[0] + myGhostFestival[1] + myGhostFestival[2]) +
          " crate(s)"
      );
    } else {
      alert(
        "Successfully minted " +
          (myGhostFestival[0] + myGhostFestival[1] + myGhostFestival[2]) +
          " crate(s)"
      );
      fetchBoxBalance(myAddress);
    }
  });
}

function burnOnWebsite(boxNFTID) {
  const myAddress = link.account.address;
  boxNFTID = boxNFTID.substring(5);
  console.log(boxNFTID);

  let gasPrice = 100000;
  let gaslimit = 100000;

  let sb = new ScriptBuilder();
  let script = sb
    .callContract("gas", "AllowGas", [
      myAddress,
      sb.nullAddress(),
      gasPrice,
      gaslimit,
    ])
    .callContract(NFTSymbol, "burnOnWebsite", [myAddress, NFTSymbol, boxNFTID])
    .callContract("gas", "SpendGas", [myAddress])
    .endScript();

  link.sendTransaction("main", script, "festival1.0", function (result) {
    console.log("========", result);
    if (!result.success) {
      alert("Failed to burn");
    } else {
      alert("Successfully burned");
      fetchBoxBalance(myAddress);
    }
  });
}
