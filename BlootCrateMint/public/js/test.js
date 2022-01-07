const NFTSymbol = "GFNFT";
let myEthereumAccount = "";
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
      let blootBoxes = [];
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
            if (parseInt(series) == 4) blootBoxes.push(nftObj);
          }

          console.log("**", blootBoxes);
          reloadBoxGrid(blootBoxes);
        }
      }
    }
  });
}

function formatWalletAddress(myAddress) {
  document.getElementById("phantasmaWalletBtn").innerText =
    myAddress.substring(0, 5) + "..." + myAddress.substring(43);
}

function reloadBoxGrid(blootBoxes) {
  let numOfCrates = blootBoxes.length;
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

  for (let i = 1; i <= blootBoxes.length; i++) {
    document.getElementById("crate-grid").innerHTML +=
      '<div class="div-block-open area' +
      (numOfCrates == 1 ? 2 : i) +
      '">' +
      '<div class="columns-9 w-row">' +
      '<div class="column-19 w-col w-col-10">' +
      '<image width="540" src="/images/Crate-Belf--0177.png">' +
      "</div>" +
      "<div>" +
      "<p class='boxTokenId'>#" +
      blootBoxes[i - 1].tokenId +
      "</p>" +
      "</div>" +
      '<div class="column-20 w-col w-col-2">' +
      '<a href="#" class="button-open-box w-button" onclick="burnBlootCrateOnWebsite(`' +
      "boxID" +
      blootBoxes[i - 1].nftId +
      '`)">OPEN' +
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

function burnBlootCrateOnWebsite(boxNFTID) {
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
    .callContract(NFTSymbol, "burnBlootCrateOnWebsite", [
      myAddress,
      NFTSymbol,
      boxNFTID,
    ])
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

function PurchaseBox() {
  if (!myEthereumAccount) {
    alert("Please connect your Metamask wallet");
    return;
  }

  if (!link.account) {
    alert("Please connect your Phantasma wallet");
    return;
  }
  const myAddress = link.account.address; //public addr of dummy wallet genesis, guid

  let gasPrice = 100000;
  let gaslimit = 100000;

  const sb = new ScriptBuilder();
  let script = sb
    .callContract("gas", "AllowGas", [
      myAddress,
      sb.nullAddress(),
      gasPrice,
      gaslimit,
    ])
    .callContract(NFTSymbol, "mintBlootCrate", [myAddress, myEthereumAccount])
    .callContract("gas", "SpendGas", [myAddress])
    .endScript();

  link.sendTransaction("main", script, "festival1.0", function (result) {
    console.log("========", result);
    if (!result.success) {
      alert("Failed to mint crates");
    } else {
      alert("Successfully minted bloot crates");
      fetchBoxBalance(myAddress);
    }
  });
}

// Get the modal
var modal = document.getElementById("walletModal");

// Get the button that opens the modal
var phantasmaWalletBtn = document.getElementById("phantasmaWalletBtn");

// Get the <span> element that closes the modal
var span = document.getElementsByClassName("close")[0];

// When the user clicks on the button, open the modal
phantasmaWalletBtn.onclick = function () {
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

const ethereumButton = document.getElementById("ethWalletBtn");
ethereumButton.addEventListener("click", async () => {
  const accounts = await ethereum.request({ method: "eth_requestAccounts" });
  console.log("===", accounts);

  myEthereumAccount = accounts[0];

  document.getElementById("ethWalletBtn").innerText =
    myEthereumAccount.substring(0, 5) + "..." + myEthereumAccount.substring(38);

  const claimable = claimablePairs[myEthereumAccount];
  document.getElementById("purchase").innerText =
    "CLAIM " + (claimable ? claimable : 0) + " Crates";
});

ethereum.on("accountsChanged", function (accounts) {
  // Time to reload your interface with accounts[0]!
  myEthereumAccount = accounts[0];

  document.getElementById("ethWalletBtn").innerText =
    myEthereumAccount.substring(0, 5) + "..." + myEthereumAccount.substring(38);

  const claimable = claimablePairs[myEthereumAccount];
  document.getElementById("purchase").innerText =
    "CLAIM " + (claimable ? claimable : 0) + " Crates";
});
