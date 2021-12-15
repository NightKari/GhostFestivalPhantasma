// const apiUrl = "http://localhost:7080";
let link = new PhantasmaLink("GFNFT");

function login() {
  link.login(function (success) {
    if (success) {
      let myAddress = link.account.address;
      document.getElementById("connectBtn").innerText = myAddress.substring(0,5) + "..." + myAddress.substring(43);
    } else {
      alert("Failed to connect Phantasma wallet");
    }
  });
}

function TestPhantasma() {
    let myGhostFestival = JSON.parse(localStorage.getItem("GhostFestival"));
    console.log("myGhostFestival", myGhostFestival);
    if (!link.account) {
      alert("Please connect your wallet first");
      return;
    }
    let myAddress = link.account.address; //public addr of dummy wallet genesis, guid

    let gasPrice = 1000000;
    let gaslimit = 10000000;

    if (myGhostFestival[0] == 0 && myGhostFestival[1] == 0 && myGhostFestival[2] == 0) {
      alert("Please choose at least one box");
      return;
    } 

    let sb = new ScriptBuilder();
    let script = sb
    .callContract('gas', 'AllowGas', [myAddress, sb.nullAddress(), gasPrice, gaslimit])

    for(let i = 0; i < myGhostFestival[0]; i++) {
      script = script.callContract("GFNFT", "mint", [myAddress, 1]);
    }

    for(let i = 0; i < myGhostFestival[1]; i++) {
      script = script.callContract("GFNFT", "mint", [myAddress, 2]);
    }

    for(let i = 0; i < myGhostFestival[2]; i++) {
      script = script.callContract("GFNFT", "mint", [myAddress, 3]);
    }

    script = script.callContract('gas', 'SpendGas', [myAddress])
    .endScript();

    link.sendTransaction('main', script, 'festival1.0', function (result) {

        console.log("========", result);
        if (!result.success) {
          alert("Failed to mint " + (myGhostFestival[0] + myGhostFestival[1] + myGhostFestival[2]) + " box(es)");
        } else {
          alert("Successfully minted " + (myGhostFestival[0] + myGhostFestival[1] + myGhostFestival[2]) + " box(es)");
        }
    })
}
