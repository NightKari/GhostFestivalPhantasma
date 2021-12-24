const NFTSymbol = "GFNFT";
const apiUrl = "http://localhost:7078";
// const NFTSymbol = "GNFT";
// const apiUrl = "http://testnet.phantasma.io:7078";
// const apiUrl = "http://207.148.17.86:7078";
// const apiUrl = "https://seed.ghostdevs.com:7078";
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
      let commonBoxes = [];
      let rareBoxes = [];
      let epicBoxes = [];
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
            console.log("====1", nthNft);
            const series = nthNft[0].series;
            const tokenId = decodeVMObject(nthNft[0].ram)
              .infoURL.split("//")[1]
              .split("/")[1];
            const nftObj = { nftId: nftIDs[j].toString(), tokenId: tokenId };
            if (parseInt(series) == 1) commonBoxes.push(nftObj);
            else if (parseInt(series) == 2) rareBoxes.push(nftObj);
            else if (parseInt(series) == 3) epicBoxes.push(nftObj);
          }

          console.log("**", commonBoxes, rareBoxes, epicBoxes);
          reloadBoxGrid(commonBoxes, rareBoxes, epicBoxes);
        }
      }
    }
  });
}

function formatWalletAddress(myAddress) {
  document.getElementById("connectBtn").innerText =
    myAddress.substring(0, 5) + "..." + myAddress.substring(43);
}

function reloadBoxGrid(commonBoxes, rareBoxes, epicBoxes) {
  let numOfCrates = commonBoxes.length + rareBoxes.length + epicBoxes.length;
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

  // for common box
  for (let i = 1; i <= commonBoxes.length; i++) {
    document.getElementById("crate-grid").innerHTML +=
      '<div class="div-block-open area' +
      (numOfCrates == 1 ? 2 : i) +
      '">' +
      '<div class="columns-9 w-row">' +
      '<div class="column-19 w-col w-col-10">' +
      '<video width="540" autoplay loop><source src="/assets/crate1.mp4" type="video/mp4"></video>' +
      "</div>" +
      '<div class="column-20 w-col w-col-2">' +
      '<a href="#" class="button-open-box w-button" onclick="burnOnWebsite(`' +
      "boxID" +
      commonBoxes[i - 1].nftId +
      '`)">OPEN' +
      '<span class="tokenId"> #' +
      commonBoxes[i - 1].tokenId +
      "</span>" +
      "</a>" +
      "</div>" +
      "</div>" +
      "</div>";
  }

  // for rare box
  for (let i = 1; i <= rareBoxes.length; i++) {
    document.getElementById("crate-grid").innerHTML +=
      '<div class="div-block-open area' +
      (numOfCrates == 1 ? 2 : i + commonBoxes.length) +
      '">' +
      '<div class="columns-9 w-row">' +
      '<div class="column-19 w-col w-col-10">' +
      '<video width="540" autoplay loop><source src="/assets/crate2.mp4" type="video/mp4"></video>' +
      "</div>" +
      '<div class="column-20 w-col w-col-2">' +
      '<a href="#" class="button-open-box w-button" onclick="burnOnWebsite(`' +
      "boxID" +
      rareBoxes[i - 1] +
      '`)">OPEN' +
      '<span class="tokenId"> #' +
      rareBoxes[i - 1].tokenId +
      "</a>" +
      "</div>" +
      "</div>" +
      "</div>";
  }

  // for epic box
  for (let i = 1; i <= epicBoxes.length; i++) {
    document.getElementById("crate-grid").innerHTML +=
      '<div class="div-block-open area' +
      (numOfCrates == 1 ? 2 : i + commonBoxes.length + rareBoxes.length) +
      '">' +
      '<div class="columns-9 w-row">' +
      '<div class="column-19 w-col w-col-10">' +
      '<video width="540" autoplay loop><source src="/assets/crate3.mp4" type="video/mp4"></video>' +
      "</div>" +
      '<div class="column-20 w-col w-col-2">' +
      '<a href="#" class="button-open-box w-button" onclick="burnOnWebsite(`' +
      "boxID" +
      epicBoxes[i - 1] +
      '`)">OPEN' +
      '<span class="tokenId"> #' +
      epicBoxes[i - 1].tokenId +
      "</a>" +
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

function loginToPhantasma(providerHint) {
  link.login(
    function (success) {
      modal.style.display = "none";
      if (success) {
        console.log("Logged in");
        const myAddress = link.account.address;
        formatWalletAddress(myAddress);
        fetchBoxBalance(myAddress);
      } else {
        alert("Failed to connect Phantasma wallet");
      }
    },
    2,
    "phantasma",
    providerHint
  );
}

function PurchaseBox() {
  const myGhostFestival = JSON.parse(localStorage.getItem("GhostFestival"));
  console.log("myGhostFestival", myGhostFestival);
  if (!link.account) {
    alert("Please connect your wallet first");
    return;
  }
  const myAddress = link.account.address; //public addr of dummy wallet genesis, guid

  let gasPrice = 100000;
  let gaslimit = 9999;

  const numOfCrates =
    myGhostFestival[0] + myGhostFestival[1] + myGhostFestival[2];

  if (numOfCrates > 1) {
    gaslimit = 100000;
  }
  if (numOfCrates > 15) {
    gaslimit = 200000;
  }

  if (numOfCrates == 0) {
    alert("Please choose at least one crate");
    return;
  }

  if (
    myGhostFestival[0] > 10 ||
    myGhostFestival[1] > 10 ||
    myGhostFestival[2] > 10
  ) {
    alert("You can mint up to 10 crates at a time");
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
          " Crate(s)"
      );
    } else {
      alert(
        "Successfully minted " +
          (myGhostFestival[0] + myGhostFestival[1] + myGhostFestival[2]) +
          " Crate(s)"
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
  let gaslimit = 10000;

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
      alert("Successfully burned. See the NFTs on Ghost Market");
      fetchBoxBalance(myAddress);
    }
  });
}

// Get the modal
var modal = document.getElementById("walletModal");

// Get the button that opens the modal
var connectBtn = document.getElementById("connectBtn");

// Get the <span> element that closes the modal
var span = document.getElementsByClassName("close")[0];

// When the user clicks on the button, open the modal
connectBtn.onclick = function () {
  modal.style.display = "block";
};

// When the user clicks on <span> (x), close the modal
span.onclick = function () {
  modal.style.display = "none";
};

// When the user clicks anywhere outside of the modal, close it
window.onclick = function (event) {
  if (event.target == modal) {
    modal.style.display = "none";
  }
};
