const apiUrl = "http://localhost:7078";
// const apiUrl = "http://testnet.phantasma.io:7078";
// const apiUrl = "http://207.148.17.86:7078";
// const apiUrl = "https://seed.ghostdevs.com:7078";
// const ghostFestivalSymbol = "GNFT";
const ghostFestivalSymbol = "GFNFT";
const tcktSymbol = "TCKT";
const tcktTargetSupplyAmount = 10000; // target value amount for inflation tracker
const tcktTargetSupplyPower = 18; // target value power for inflation tracker
const tcktBurnAmount = 1000; // TCKT burn amount for upgrade / fuse
const tcktBurnPower = 18; // TCKT burn power for upgrade / fuse
let tcktDecimals = 18; // will be changed once queried, just initialized here
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
 Fetch the GFNFT balance, we have normal, rare and epic GFNFT
 type 1: fetch normal, rare and epic badges
 type 2: fetch normal, rare and epic GFNFT. All hammer/ghost/badges count
******************************************************************
*/
const fetchGFNFTBalance = async (myAddress, type) => {
  let normalNFT = 0;
  let rareNFT = 0;
  let epicNFT = 0;
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

          if (type == 1) {
            // consider only badges 5 for normal badge, 6 for rare badge and 7 for epic badge
            if (parseInt(series) == 5) normalNFT++;
            else if (parseInt(series) == 6) rareNFT++;
            else if (parseInt(series) == 7) epicNFT++;
          } else if (type == 2) {
            // consider all GFNFTs
            // common: badge: 5, hamer: 11-28, ghost: 51-52
            // rare: badge: 6, hamer: 29-37, ghost: 53-56
            // epic: badge: 7, hamer: 38-40, ghost: 57-58
            if (
              parseInt(series) == 5 ||
              (parseInt(series) >= 11 && parseInt(series) <= 28) ||
              (parseInt(series) >= 51 && parseInt(series) <= 52)
            )
              normalNFT++;
            else if (
              parseInt(series) == 6 ||
              (parseInt(series) >= 29 && parseInt(series) <= 37) ||
              (parseInt(series) >= 53 && parseInt(series) <= 56)
            )
              rareNFT++;
            else if (
              parseInt(series) == 7 ||
              (parseInt(series) >= 38 && parseInt(series) <= 40) ||
              (parseInt(series) >= 57 && parseInt(series) <= 58)
            )
              epicNFT++;
          }
        }
        break;
      }
    }
  }
  console.log({ normalNFT, rareNFT, epicNFT });
  return { normalNFT, rareNFT, epicNFT };
};

/*
**********************************************************
 Set the text for bonus amount will be set into the HTML
**********************************************************
*/
const getTCKTBonusAmount = async () => {
  const myAddress = linkToTCKT.account.address;
  const badgeBalance = await fetchGFNFTBalance(myAddress, 1); // takes some time
  console.log(
    badgeBalance.normalNFT,
    badgeBalance.rareNFT,
    badgeBalance.epicNFT
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
          renderGFNFTCounts();
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

function callInitContractVar() {
  const myAddress = linkToGFNFT.account.address;
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
    .callContract(ghostFestivalSymbol, "initializeVariables", [myAddress])
    .callContract("gas", "SpendGas", [myAddress])
    .endScript();

  linkToGFNFT.sendTransaction("main", script, "festival1.0", function (result) {
    console.log("========", result);
    if (!result || !result.success) alert("Failed to initialize variables");
    else alert("successfully initialize variables");
  });
}

/*
*******************************
 Choose the best badges, gold over silver, silver over normal.
 Will be cumulative up to six
*******************************
*/
const sumBestOnes = (badgeBalance) => {
  let sum = 0;
  let normalNFT = badgeBalance.normalNFT;
  let rareNFT = badgeBalance.rareNFT;
  let epicNFT = badgeBalance.epicNFT;

  const normalBadgeBonus = 1;
  const rareBadgeBonus = 2;
  const epicBadgeBonus = 3;

  if (normalNFT + rareNFT + epicNFT <= 6) {
    sum =
      normalBadgeBonus * normalNFT +
      rareBadgeBonus * rareNFT +
      epicBadgeBonus * epicNFT;
  } else {
    for (let i = 0; i < 6; i++) {
      if (epicNFT > 0) {
        sum += epicBadgeBonus;
        epicNFT--;
      } else if (rareNFT > 0) {
        sum += rareBadgeBonus;
        rareNFT--;
      } else if (normalNFT > 0) {
        sum += normalBadgeBonus;
        normalNFT--;
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
      break;
    }
  }
  // set user's balance
  console.log("Your TCKT balance is " + tcktBalance);
  document.getElementById("myTcktBalance").innerText =
    "Your current TCKT balance is " + tcktBalance + " TCKT";

  // set TCKT total supply
  const currentTcktSupply = await getCurrentTCKTSupply();
  console.log("TCKT current supply is " + currentTcktSupply);
  document.getElementById("tcktSupply").innerText =
    "TCKT current supply is " + currentTcktSupply + " TCKT";

  // set inflation value
  const inflation =
    currentTcktSupply < tcktTargetSupplyAmount
      ? 1
      : currentTcktSupply / tcktTargetSupplyAmount;
  document.getElementById("inflation").value = inflation;

  // set current infuse / upgrade price
  let currentTcktBurnAmount = tcktBurnAmount;
  currentTcktBurnAmount = currentTcktBurnAmount * inflation;
  document.getElementById("currentTcktBurnAmount").innerText =
    "Current infuse / upgrade price is " + currentTcktBurnAmount + " TCKT";

  return;
}

/*
*****************************************************************************
 Update infuse / upgrade price in real time according to changing inflation
*****************************************************************************
*/
function onChangeInflation(inflation) {
  console.log(inflation);
  const currentTcktBurnAmount = tcktBurnAmount * inflation;
  document.getElementById("currentTcktBurnAmount").innerText =
    "Current infuse / upgrade price is " + currentTcktBurnAmount + " TCKT";
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
        break;
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
**************************************************************
 Render hammer/ghost detailed info given hammer/ghost object
**************************************************************
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
*********************************************
 fuse one hammer or ghost into another
 we have source and target nft
 source will be burned and fused into target
*********************************************
*/
async function fuseNFT(type) {
  if (!linkToGFNFT.account) {
    console.log("Connect your wallet to GFNFT App first");
    alert("Connect your wallet to GFNFT App first");
    return;
  }
  const myAddress = linkToGFNFT.account.address;

  const { currentTcktBurnAmount, currentTcktBurnPower } =
    await calcTCKTBurnAmount();

  const sourceIndexHTML =
    type === 1
      ? document.getElementById("sourceHammerID").value
      : document.getElementById("sourceGhostID").value;
  const sourceIndex = parseInt(sourceIndexHTML ? sourceIndexHTML : 0);
  const targetIndexHTML =
    type === 1
      ? document.getElementById("targetHammerID").value
      : document.getElementById("targetGhostID").value;
  const targetIndex = parseInt(targetIndexHTML ? targetIndexHTML : 0);
  if (sourceIndex <= 0 || targetIndex <= 0) {
    alert("source and target ID can not be empty or zero");
    return;
  }
  const sourceNFTID =
    type === 1 ? hammerNFTIDs[sourceIndex - 1] : ghostNFTIDs[sourceIndex - 1];
  const targetNFTID =
    type === 1 ? hammerNFTIDs[targetIndex - 1] : ghostNFTIDs[targetIndex - 1];

  const sourceNFTObj = await ramByID(sourceNFTID);
  const targetNFTObj = await ramByID(targetNFTID);
  console.log(sourceNFTID, sourceNFTObj.name);
  console.log(targetNFTID, targetNFTObj.name);

  let infusedType1 = targetNFTObj.infusedType1;
  let infusedType2 = targetNFTObj.infusedType2;
  // check if the target is already filled all in InfusedType1 and InfusedType2
  if (infusedType1 !== "None" && infusedType2 !== "None") {
    console.log(
      "The target nft is already filled for infusion, no more infusion allowed"
    );
    alert(
      "The target nft is already filled for infusion, no more infusion allowed"
    );
    return;
  }

  if (infusedType1 === "None") {
    infusedType1 =
      type === 1 ? sourceNFTObj.hammerType : sourceNFTObj.ghostType;
    infusedType2 = "None";
  } else if (infusedType2 === "None") {
    infusedType1 =
      type === 1 ? targetNFTObj.hammerType : targetNFTObj.ghostType;
    infusedType2 =
      type === 1 ? sourceNFTObj.hammerType : sourceNFTObj.ghostType;
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
    .callContract(ghostFestivalSymbol, "fuseNFT", [
      type,
      myAddress,
      targetNFTID,
      sourceNFTID,
      currentTcktBurnAmount,
      currentTcktBurnPower,
      targetNFTObj.name,
      targetNFTObj.description,
      targetNFTObj.imageURL,
      targetNFTObj.infoURL,
      targetNFTObj.rarity,
      targetNFTObj.model,
      type === 1 ? targetNFTObj.hammerType : targetNFTObj.ghostType,
      targetNFTObj.level,
      infusedType1,
      infusedType2,
      true,
    ])
    .callContract("gas", "SpendGas", [myAddress])
    .endScript();

  linkToGFNFT.sendTransaction("main", script, "festival1.0", function (result) {
    console.log("========", result);
    if (!result || !result.success)
      alert("Failed to fuse " + (type === 1 ? "Hammer" : "Ghost"));
    else {
      getMyGFNFT();
      alert("successfully fused " + (type === 1 ? "Hammer" : "Ghost"));
    }
  });
}

/*
**************************************
 upgrade hammer or ghost one level up
 type: 1 for hammer, 2 for ghost
**************************************
*/
async function upgradeNFT(type) {
  if (!linkToGFNFT.account) {
    console.log("Connect your wallet to GFNFT App first");
    alert("Connect your wallet to GFNFT App first");
    return;
  }
  const myAddress = linkToGFNFT.account.address;

  const { currentTcktBurnAmount, currentTcktBurnPower } =
    await calcTCKTBurnAmount();

  let tokenID = 0;
  if (type == 1) {
    const hammerIDHTML = document.getElementById("upgradeHammerID").value;
    tokenID = parseInt(hammerIDHTML ? hammerIDHTML : 0);
  } else {
    const ghostIDHTML = document.getElementById("upgradeGhostID").value;
    tokenID = parseInt(ghostIDHTML ? ghostIDHTML : 0);
  }

  if (tokenID <= 0) {
    alert((type == 1 ? "hammer" : "ghost") + " ID can not be empty or zero");
    return;
  }
  console.log(type === 1 ? hammerNFTIDs : ghostNFTIDs, tokenID);

  tokenID = type === 1 ? hammerNFTIDs[tokenID - 1] : ghostNFTIDs[tokenID - 1];
  const nftObj = await ramByID(tokenID);
  const level = parseInt(nftObj.level) + 1;

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
    .callContract(ghostFestivalSymbol, "upgradeNFT", [
      type,
      myAddress,
      tokenID,
      currentTcktBurnAmount,
      currentTcktBurnPower,
      nftObj.name,
      nftObj.description,
      nftObj.imageURL,
      nftObj.infoURL,
      nftObj.rarity,
      nftObj.model,
      type === 1 ? nftObj.hammerType : nftObj.ghostType,
      level,
      nftObj.infusedType1,
      nftObj.infusedType2,
      type === 2 ? true : true,
    ])
    .callContract("gas", "SpendGas", [myAddress])
    .endScript();

  linkToGFNFT.sendTransaction("main", script, "festival1.0", function (result) {
    console.log("========", result);
    if (!result || !result.success)
      alert("Failed to upgrade " + (type === 1 ? "Hammer" : "Ghost"));
    else {
      getMyGFNFT();
      alert("successfully upgraded " + (type === 1 ? "Hammer" : "Ghost"));
    }
  });
}

/*
****************************************************************
 calculate inflation and get the relevant burn amount and power
****************************************************************
*/
const calcTCKTBurnAmount = async () => {
  let currentTcktBurnAmount = tcktBurnAmount;

  let inflation = document.getElementById("inflation").value;
  inflation = inflation ? parseFloat(inflation) : 1.0;
  console.log(currentTcktBurnAmount, inflation);

  currentTcktBurnAmount = currentTcktBurnAmount * inflation;
  console.log(currentTcktBurnAmount, inflation);
  const decimalOfAmount = currentTcktBurnAmount.countDecimals();
  currentTcktBurnAmount = currentTcktBurnAmount * Math.pow(10, decimalOfAmount);
  const currentTcktBurnPower = tcktBurnPower - decimalOfAmount;

  console.log(decimalOfAmount, currentTcktBurnAmount, currentTcktBurnPower);
  return { currentTcktBurnAmount, currentTcktBurnPower };
};

/*
***********************************
 clear Hammer/Ghost detail content
***********************************
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
const getCurrentTCKTSupply = async () => {
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

/*
********************************************************
 Claim TCKT Token based on how many of each rarity holds
********************************************************
*/
async function claimTCKTToken() {
  console.log("claimTCKTToken is clicked");
  if (!linkToTCKT.account) {
    console.log("Connect your wallet to TCKT App first");
    alert("Connect your wallet to TCKT App first");
    return;
  }
  const myAddress = linkToTCKT.account.address;

  const { normalNFT, rareNFT, epicNFT } = await fetchGFNFTBalance(myAddress, 2); // takes some time
  console.log(normalNFT, rareNFT, epicNFT);

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
    .callContract(tcktSymbol, "claimToken", [
      myAddress,
      normalNFT,
      rareNFT,
      epicNFT,
    ])
    .callContract("gas", "SpendGas", [myAddress])
    .endScript();

  linkToTCKT.sendTransaction("main", script, "festival1.0", function (result) {
    console.log("========", result);
    if (!result || !result.success) alert("Failed to claim TCKT");
    else {
      getTCKTBalance();
      alert("successfully claimed TCKT");
    }
  });
}

/*
**************************************
 Set TCKT Amount Per Rarity (Owner call)
**************************************
*/
async function setTcktAmountPerRarity() {
  console.log("setTcktAmountPerRarity is clicked");
  if (!linkToTCKT.account) {
    console.log("Connect your wallet to TCKT App first");
    alert("Connect your wallet to TCKT App first");
    return;
  }
  const myAddress = linkToTCKT.account.address;

  const gasPrice = 100000;
  const gaslimit = 10000;

  let commonTcktAmount = document.getElementById("commonTcktAmount").value;
  let rareTcktAmount = document.getElementById("rareTcktAmount").value;
  let epicTcktAmount = document.getElementById("epicTcktAmount").value;

  commonTcktAmount = parseInt(commonTcktAmount ? commonTcktAmount : 0);
  rareTcktAmount = parseInt(rareTcktAmount ? rareTcktAmount : 0);
  epicTcktAmount = parseInt(epicTcktAmount ? epicTcktAmount : 0);

  console.log(commonTcktAmount, rareTcktAmount, epicTcktAmount);

  const sb = new ScriptBuilder();
  const script = sb
    .callContract("gas", "AllowGas", [
      myAddress,
      sb.nullAddress(),
      gasPrice,
      gaslimit,
    ])
    .callContract(tcktSymbol, "setTcktAmountPerRarity", [
      commonTcktAmount,
      rareTcktAmount,
      epicTcktAmount,
    ])
    .callContract("gas", "SpendGas", [myAddress])
    .endScript();

  linkToTCKT.sendTransaction("main", script, "festival1.0", function (result) {
    console.log("========", result);
    if (!result || !result.success)
      alert("Failed to set TCKT amount per rarity");
    else {
      alert("successfully set TCKT amount per rarity");
    }
  });
}

const renderGFNFTCounts = async () => {
  const myAddress = linkToTCKT.account.address;
  const { normalNFT, rareNFT, epicNFT } = await fetchGFNFTBalance(myAddress, 2); // takes some time
  console.log(normalNFT, rareNFT, epicNFT);

  document.getElementById("myGFNFTs").innerHTML =
    "You are holding " +
    normalNFT +
    " common, " +
    rareNFT +
    " rare and " +
    epicNFT +
    " epic ones";
};

window.onload = (event) => {
  console.log("page is fully loaded");
  if (!linkToTCKT.account) {
    console.log("wallet is not connected to TCKT App");
    return;
  }
  getTCKTBonusAmount();
};
