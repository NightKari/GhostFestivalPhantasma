const apiUrl = "http://localhost:7078";
// const symbol = "GNFT";
const ghostFestivalSymbol = "GFNFT";
const tcktSymbol = "TCKT";
let tcktDecimals = 18;
let bonus = 0;
let linkToTCKT = new PhantasmaLink(tcktSymbol);
let linkToGFNFT = new PhantasmaLink(ghostFestivalSymbol);
let hammerNFTIDs = [];
let ghostNFTIDs = [];

/*
******************************************************************
 Initialize global variables
******************************************************************
*/
const initializeGFNFTVar = () => {
  hammerNFTIDs = [];
  ghostNFTIDs = [];
};

const initializeTCKTVar = () => {
  bonus = 0;
};

Number.prototype.countDecimals = function () {
  if (Math.floor(this.valueOf()) === this.valueOf()) return 0;
  return this.toString().split(".")[1].length || 0;
};

/*
******************************************************************
 Fetch the badge balance, we have normal, rare and epic badges
******************************************************************
*/
const fetchBadgeBalance = async (myAddress) => {
  let normalBadges = 0;
  let rareBadges = 0;
  let epicBadges = 0;
  const res = await $.getJSON(apiUrl + "/api/getAccount?account=" + myAddress);
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
          const nthNft = await $.getJSON(
            apiUrl +
              "/api/getNFTs?account=" +
              myAddress +
              "&symbol=" +
              ghostFestivalSymbol +
              "&IDText=" +
              nftIDs[j]
          );
          console.log("====1", nthNft[0]);
          const series = nthNft[0].series;

          if (parseInt(series) == 5) normalBadges++;
          else if (parseInt(series) == 6) rareBadges++;
          else if (parseInt(series) == 7) epicBadges++;
        }
      }
    }
  }
  console.log({ normalBadges, rareBadges, epicBadges });
  return { normalBadges, rareBadges, epicBadges };
};

/*
**********************************************************
 Set the text for bonus amount will be set into the HTML
**********************************************************
*/
const getTCKTBonusAmount = async () => {
  const myAddress = linkToTCKT.account.address;
  const badgeBalance = await fetchBadgeBalance(myAddress); // takes some time
  console.log(
    badgeBalance.normalBadges,
    badgeBalance.rareBadges,
    badgeBalance.epicBadges
  );
  bonus = sumBestOnes(badgeBalance);
  document.getElementById("bonusAmount").innerText =
    "Bonus percent will be: " + bonus + "%";
};

/*
**********************************************************
 Login to phantasma application
 1 for TCKT
 2 for GFNFT
**********************************************************
*/
function loginToPhantasma(providerHint, application) {
  if (application == 1) {
    linkToTCKT.login(
      function (success) {
        if (success) {
          console.log("Logged in");
          initializeTCKTVar();
          getTCKTBonusAmount();
          getTCKTBalance();
        }
      },
      2,
      "phantasma",
      providerHint
    );
  } else if (application == 2) {
    linkToGFNFT.login(
      function (success) {
        if (success) {
          console.log("Logged in");
          initializeGFNFTVar();
          getMyGFNFT();
        }
      },
      2,
      "phantasma",
      providerHint
    );
  }
}

/*
*******************************
 Choose the best badges, gold over silver, silver over normal.
 Will be cumulative up to six
*******************************
*/
const sumBestOnes = (badgeBalance) => {
  let sum = 0;
  let normalBadges = badgeBalance.normalBadges;
  let rareBadges = badgeBalance.rareBadges;
  let epicBadges = badgeBalance.epicBadges;

  const normalBadgeBonus = 1;
  const rareBadgeBonus = 2;
  const epicBadgeBonus = 3;

  if (normalBadges + rareBadges + epicBadges <= 6) {
    sum =
      normalBadgeBonus * normalBadges +
      rareBadgeBonus * rareBadges +
      epicBadgeBonus * epicBadges;
  } else {
    for (let i = 0; i < 6; i++) {
      if (epicBadges > 0) {
        sum += epicBadgeBonus;
        epicBadges--;
      } else if (rareBadges > 0) {
        sum += rareBadgeBonus;
        rareBadges--;
      } else if (normalBadges > 0) {
        sum += normalBadgeBonus;
        normalBadges--;
      }
    }
  }
  return sum;
};

/*
*******************************
 TCKT mint
*******************************
*/
async function mintTCKTToken() {
  console.log("mintTCKTToken is clicked");
  if (!linkToTCKT.account) {
    console.log("Connect your wallet to TCKT App first");
    alert("Connect your wallet to TCKT App first");
    return;
  }

  const myAddress = linkToTCKT.account.address;
  const amountTxt = document.getElementById("tcktAmount").value;
  let amount = parseFloat(amountTxt ? amountTxt : 0);
  amount = (1 + 0.01 * bonus) * amount;

  const decimalOfAmount = amount.countDecimals();
  const integerAmount = amount * Math.pow(10, decimalOfAmount);
  const power = tcktDecimals - decimalOfAmount;

  if (!amount) {
    console.log("Input the amount of TCKT to mint");
    alert("Input the amount of TCKT to mint");
    return;
  }

  const gasPrice = 100000;
  const gaslimit = 10000;

  const sb = new ScriptBuilder();
  const script = sb
    .callContract("gas", "AllowGas", [
      myAddress,
      sb.nullAddress(),
      gasPrice,
      gaslimit,
    ])
    .callContract(tcktSymbol, "mintToken", [myAddress, integerAmount, power])
    .callContract("gas", "SpendGas", [myAddress])
    .endScript();

  linkToTCKT.sendTransaction("main", script, "festival1.0", function (result) {
    console.log("========", result);
    getTCKTBalance();
    if (!result || !result.success) alert("Failed to mint TCKT");
    else alert("successfully minted TCKT");
  });
}

/*
*******************************
 burn TCKT token
*******************************
*/
function burnTCKTToken() {
  console.log("burnToken is clicked");
  if (!linkToTCKT.account) {
    console.log("Connect your wallet to TCKT App first");
    alert("Connect your wallet to TCKT App first");
    return;
  }

  const myAddress = linkToTCKT.account.address;

  const gasPrice = 100000;
  const gaslimit = 10000;

  const amountTxt = document.getElementById("burnAmount").value;
  const amount = parseFloat(amountTxt ? amountTxt : 0);
  if (!amount) {
    console.log("Input the amount of TCKT to burn");
    alert("Input the amount of TCKT to burn");
    return;
  }

  const decimalOfAmount = amount.countDecimals();
  const integerAmount = amount * Math.pow(10, decimalOfAmount);
  const power = tcktDecimals - decimalOfAmount;

  const sb = new ScriptBuilder();
  const script = sb
    .callContract("gas", "AllowGas", [
      myAddress,
      sb.nullAddress(),
      gasPrice,
      gaslimit,
    ])
    .callContract(tcktSymbol, "burnToken", [myAddress, integerAmount, power])
    .callContract("gas", "SpendGas", [myAddress])
    .endScript();

  linkToTCKT.sendTransaction("main", script, "festival1.0", function (result) {
    console.log("========", result);
    getTCKTBalance();
    if (!result || !result.success) alert("Failed to burn TCKT");
    else alert("successfully burned TCKT");
  });
}

/*
*******************************
 get TCKT fungible token balance
*******************************
*/
async function getTCKTBalance() {
  let tcktBalance = 0;
  if (!linkToTCKT.account) {
    console.log("Connect your wallet to TCKT App first");
    alert("Connect your wallet to TCKT App first");
    return 0;
  }
  const myAddress = linkToTCKT.account.address;
  const res = await $.getJSON(apiUrl + "/api/getAccount?account=" + myAddress);
  console.log(res);
  if (!res) {
    console.log("Failed to get account information");
    return;
  }
  const tokens = res.balances;
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (token.symbol == tcktSymbol) {
      tcktBalance = token.amount / Math.pow(10, token.decimals);
      tcktDecimals = token.decimals;
    }
  }
  console.log("TCKT balance is " + tcktBalance);
  document.getElementById("tcktBalance").innerText =
    "Your current TCKT balance is " + tcktBalance + " TCKT";
  return tcktBalance;
}

/*
*******************************
 get GFNFT hammer/ghost NFTs
*******************************
*/
async function getMyGFNFT() {
  initializeGFNFTVar();
  clearHammerGhostHTML();
  const myAddress = linkToGFNFT.account.address;
  const res = await $.getJSON(apiUrl + "/api/getAccount?account=" + myAddress);
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
          const nthNft = await $.getJSON(
            apiUrl +
              "/api/getNFTs?account=" +
              myAddress +
              "&symbol=" +
              ghostFestivalSymbol +
              "&IDText=" +
              nftIDs[j]
          );
          const series = nthNft[0].series;
          if (parseInt(series) >= 11 && parseInt(series) <= 42) {
            // hammer
            console.log("hammer series id is " + series);
            const hammerRAM = decodeVMObject(nthNft[0].ram);
            console.log(
              "hammerRAM is " + hammerRAM.imageURL,
              hammerRAM.infoURL
            );
            renderHammerHTML(hammerRAM);
            hammerNFTIDs.push(nftIDs[j]);
          } else if (parseInt(series) >= 51 && parseInt(series) <= 60) {
            // ghost
            console.log("ghost series id is " + series);
            const ghostRAM = decodeVMObject(nthNft[0].ram);
            console.log("ghostRAM is " + ghostRAM.imageURL, ghostRAM.infoURL);
            renderGhostHTML(ghostRAM);
            ghostNFTIDs.push(nftIDs[j]);
          }
        }
      }
    }
  }
}

const ramByID = async (nftID) => {
  const myAddress = linkToGFNFT.account.address;
  const nftObj = await $.getJSON(
    apiUrl +
      "/api/getNFTs?account=" +
      myAddress +
      "&symbol=" +
      ghostFestivalSymbol +
      "&IDText=" +
      nftID
  );
  const ram = decodeVMObject(nftObj[0].ram);
  return ram;
};

/*
*******************************
 Render hammer/ghost detailed info given hammer/ghost object
*******************************
*/
const renderHammerHTML = (hammerObj) => {
  document.getElementById("hammerDetails").innerHTML +=
    '<div class="hammer-detail">' +
    '<div class="row">' +
    '<div class="col-sm font-bold">Name:</div><div class="col-sm">' +
    hammerObj.name +
    '</div><div class="col-sm font-bold">level:</div><div class="col-sm">' +
    hammerObj.level +
    '</div><div class="col-sm font-bold">power:</div><div class="col-sm">' +
    hammerObj.power +
    '</div></div><div class="row"><div class="col-sm font-bold">imageURL:</div><div class="col-sm">' +
    hammerObj.imageURL +
    "</div></div>" +
    '<div class="row">' +
    '<div class="col-sm font-bold">InfusedType1:</div><div class="col-sm">' +
    hammerObj.infusedType1 +
    '</div><div class="col-sm font-bold">InfusedType2:</div><div class="col-sm">' +
    hammerObj.infusedType2 +
    "</div></div></div><hr />";
};

const renderGhostHTML = (ghostObj) => {
  document.getElementById("ghostDetails").innerHTML +=
    '<div class="ghost-detail">' +
    '<div class="row">' +
    '<div class="col-sm font-bold">Name:</div><div class="col-sm">' +
    ghostObj.name +
    '</div><div class="col-sm font-bold">level:</div><div class="col-sm">' +
    ghostObj.level +
    '</div><div class="col-sm font-bold">health:</div><div class="col-sm">' +
    ghostObj.health +
    '</div></div><div class="row"><div class="col-sm font-bold">imageURL:</div><div class="col-sm">' +
    ghostObj.imageURL +
    "</div></div>" +
    '<div class="row">' +
    '<div class="col-sm font-bold">InfusedType1:</div><div class="col-sm">' +
    ghostObj.infusedType1 +
    '</div><div class="col-sm font-bold">InfusedType2:</div><div class="col-sm">' +
    ghostObj.infusedType2 +
    "</div></div></div><hr />";
};

/*
*******************************
 fuse one hammer into another
*******************************
*/
async function fuseHammer() {
  const myAddress = linkToGFNFT.account.address;
  const tcktBurn = 1000;
  const sourceHammerIDHTML = document.getElementById("sourceHammerID").value;
  const sourceHammerID = parseInt(sourceHammerIDHTML ? sourceHammerIDHTML : 0);

  const targetHammerIDHTML = document.getElementById("targetHammerID").value;
  const targetHammerID = parseInt(targetHammerIDHTML ? targetHammerIDHTML : 0);

  if (sourceHammerID <= 0 || targetHammerID <= 0) {
    alert("source hammer ID and target hammer ID can not be empty or zero");
    return;
  }
  const sourceHammerNFTID = hammerNFTIDs[sourceHammerID - 1];
  const targetHammerNFTID = hammerNFTIDs[targetHammerID - 1];

  const sourceHammerNFT = await ramByID(sourceHammerNFTID);
  const targetHammerNFT = await ramByID(targetHammerNFTID);
  console.log(sourceHammerNFT, sourceHammerNFT.name);
  console.log(targetHammerNFT, targetHammerNFT.name);

  const gasPrice = 100000;
  const gaslimit = 10000;

  const sb = new ScriptBuilder();
  const script = sb
    .callContract("gas", "AllowGas", [
      myAddress,
      sb.nullAddress(),
      gasPrice,
      gaslimit,
    ])
    .callContract(ghostFestivalSymbol, "fuseHammer", [
      myAddress,
      targetHammerNFTID,
      sourceHammerNFTID,
      tcktBurn,
      targetHammerNFT.name,
      targetHammerNFT.description,
      targetHammerNFT.imageURL,
      targetHammerNFT.infoURL,
      targetHammerNFT.rarity,
      targetHammerNFT.model,
      targetHammerNFT.hammerType,
      targetHammerNFT.level,
      targetHammerNFT.power,
      // sourceHammerNFT.name,
      "Albert infused",
      targetHammerNFT.infusedType2,
    ])
    .callContract("gas", "SpendGas", [myAddress])
    .endScript();

  linkToGFNFT.sendTransaction("main", script, "festival1.0", function (result) {
    console.log("========", result);
    if (!result || !result.success) alert("Failed to fuse Hammer");
    else {
      getMyGFNFT();
      alert("successfully fused Hammer");
    }
  });
}

/*
*******************************
 clear Hammer/Ghost detail content
*******************************
*/
const clearHammerGhostHTML = () => {
  document.getElementById("hammerDetails").innerHTML = "";
  document.getElementById("ghostDetails").innerHTML = "";
};

/*
*******************************
 get TCKT current supply
*******************************
*/
const getCurrentTCKT = async () => {
  let currentSupply = 0;
  const res = await $.getJSON(apiUrl + "/api/getToken?symbol=" + tcktSymbol);
  console.log(res);
  if (!res) {
    alert("Cannot connect to the api server");
    console.log("error 1");
  } else if (res.error && res.error !== "pending") {
    alert("Cannot connect to the api server");
    console.log("error 2");
  } else {
    currentSupply = res.currentSupply;
    const decimals = res.decimals;
    currentSupply = currentSupply / Math.pow(10, decimals);
  }
  return currentSupply;
};

window.onload = (event) => {
  console.log("page is fully loaded");
  if (!linkToTCKT.account) {
    console.log("wallet is not connected to TCKT App");
    return;
  }
  getTCKTBonusAmount();
};
