const fetch = require("node-fetch");

module.exports = {
  name : 'info',
  aliases : ['lol'],
  description : 'League Of Legend Match Info',
  run(client , message , args , Discord ){
    const action = async () =>{
      if ( args.length < 1) {
        message.channel.send("Vui lòng nhập tên in-game")
        return
      }
      let reply =  await info(args)
      message.channel.send(reply)
    }
    action()
  }
}

async function info(args) {
  var champId = null;
  var queue = null;
  var endIndex = 5;
  var begIndex = 0;
  let accId = search(args);
  let reply = "";
  let link =
    "https://fetchlink.herokuapp.com/fetch/https://acs-garena.leagueoflegends.com/v1/stats/player_history/VN/" +
    (await accId) +
    "?";
  if (champId != null) link += "champion=" + champId + "&";
  if (queue != null) link += "queue=" + queue + "&";
  if (endIndex != null) link += "endIndex=" + endIndex + "&";
  if (begIndex != null) link += "begIndex=" + begIndex + "&";
  let response = await fetch(link, {
    headers: {
      accept: "application/json, text/javascript, */*; q=0.01",
      "accept-language":
        "vi-VN,vi;q=0.9,fr-FR;q=0.8,fr;q=0.7,en-US;q=0.6,en;q=0.5",
      "sec-ch-ua":
        '" Not A;Brand";v="99", "Chromium";v="90", "Google Chrome";v="90"',
      "sec-ch-ua-mobile": "?0",
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-site",
      Cookie: "__cfduid=d13284f5d84203e94a2895f5439db2da11618571234",
    },
    referrer: "https://matchhistory.vn.leagueoflegends.com/",
    referrerPolicy: "strict-origin-when-cross-origin",
    body: null,
    method: "GET",
    mode: "cors",
    credentials: "include",
  });
  let data = await response.json();
  reply = `League of Legends id : ${
    data.games.games[0].participantIdentities[0].player.summonerName
  } \n`
  for (var i = endIndex - 1; i >= 0; i--) {
    if (data.games.games[i].participants[0].stats.win != true) {
      var gameState = "LOSE";
    } else {
      var gameState = "WIN";
    }
    if (data.games.games[i].mapId != "11") {
      var mapId = "Howling Abyss";
    } else {
      var mapId = "Summoner's Rift";
    }
    reply += ` ${endIndex - i}.${await champion(
      data.games.games[i].participants[0].championId
    )} , K/D/A: ${data.games.games[i].participants[0].stats.kills}/${
      data.games.games[i].participants[0].stats.deaths
    }/${data.games.games[i].participants[0].stats.assists} , Gold: ${
      data.games.games[i].participants[0].stats.goldEarned
    } , ${gameState} , Map : ${mapId} , Land :${
      data.games.games[i].participants[0].timeline.lane
    }\n`;
  }
  return reply;
};

async function search(searchName) {
  var searching = "";
  if (Array.isArray(searchName) === true) {
    for (i = 0; i <= searchName.length - 1; i++) {
      searching += `${searchName[i]} `;
    }
  } else {
    searching = searchName;
  }
  let response = await fetch(
    "https://thingproxy.freeboard.io/fetch/https://acs-garena.leagueoflegends.com/v1/players?name=" +
      (await encodeURI(searching)) +
      "&region=VN"
  );
  let data = await response.json();
  console.log(`RIOT ID: ${data.accountId}`);
  return data.accountId;
}

async function champion (championId) {
    let response = await fetch("https://ddragon.leagueoflegends.com/cdn/11.8.1/data/vn_VN/champion.json")
    let {data} = (await response.json())
  
  for (var i = 0 in data)
    if ( data[i].key != championId ){
      continue;
    } else {
      return data[i].id;
    }
  };