const { MessageEmbed } = require('discord.js');
const fetch = require("node-fetch");
module.exports = {
  name: 'lol',
  aliases: ['rank', 'last', 'total'],
  description: 'League Of Legend Match Info',
  async run(client, message, args, Discord, cmd) {
    if (!args) return message.channel.send('Please provide a summoner name');
    message.channel.send('Fetching Data From Blitz.gg...')
    let currentVersion = await getLeagueVersion();
    let options = {
      playerName: args.join(" "),
      region: 'VN',
      seasonId: 17,
      matchCount: 10,
      dateCount: 300
    };
    let leagueProfile = await getleagueProfile(options.playerName, options.region);
    if (!leagueProfile) return message.channel.send('No record');
    console.log(leagueProfile);
    switch (cmd) {
      case 'rank':
        let rank = leagueProfile.ranks[0];
        let embed = new MessageEmbed()
          .setTitle(`${leagueProfile.summonerName}'s Rank`)
          .setColor('#0099FF')
          .setAuthor(leagueProfile.summonerName, `https://ddragon.leagueoflegends.com/cdn/${currentVersion}/img/profileicon/${leagueProfile.profileIconId}.png`)
          .setThumbnail(`https://wharang.fun/rank/${rank.tier}.png`)
          .addField('Rank', `***${rank.tier} ${rank.rank}***`)
          .addField('League Points', `${rank.leaguePoints}`)
          .addField('\u200B', '\u200B')
          .addField('Wins', `${rank.wins}`, true)
          .addField('Losses', `${rank.losses}`, true)
          .addField('Win Rate', `${(rank.wins / (rank.wins + rank.losses) * 100).toFixed(2)}%`, true)
          .setTimestamp()
          .setFooter('From Blitz.gg', 'https://wharang.fun/splash.png');
        message.channel.send({ embeds: [embed] });
        break;
      default:
        message.channel.send('Done');
    }
  }
};
const getLeagueVersion = async () => {
  let version = await fetch('https://ddragon.leagueoflegends.com/api/versions.json');
  let res = await version.json();
  return res[0];
};

const getleagueProfile = async (playerName, region) => {
  let base = 'https://riot.iesdev.com/graphql?'
  let query = 'query LeagueProfile($summoner_name:String,$summoner_id:String,$account_id:String,$region:Region!){leagueProfile(summoner_name:$summoner_name,summoner_id:$summoner_id,account_id:$account_id,region:$region){id accountId summonerId summonerName summonerLevel profileIconId updatedAt ranks(first:1){queue tier rank wins losses leaguePoints insertedAt}}}';
  let variables = `{"summoner_name":"${playerName}","region":"${region}"}`
  let uri = base + "query=" + query + "&variables=" + variables
  let response = await fetch(encodeURI(uri));
  let json = await response.json();
  if (json.errors) {
    console.log(json.errors);
    return;
  } else return await json.data.leagueProfile; // object
}
const getplayerMatches = async (accountId, region, seasonId, dateCount, matchCount) => {
  let base = 'https://league-player.iesdev.com/graphql?'
  let query = 'query matches($region:Region!,$accountId:String!,$first:Int,$role:Role,$queue:Queue,$championId:Int,$riotSeasonId:Int,$maxMatchAge:Int){matches(region:$region,accountId:$accountId,first:$first,role:$role,queue:$queue,championId:$championId,riotSeasonId:$riotSeasonId,maxMatchAge:$maxMatchAge){id riotMatchId gameCreation duration queue region leaguePatch{majorVersion minorVersion}playerMatches(accountId:$accountId){accountId teamId role champion{id name normalizedName}matchStatsFromClient{lp deltaLp division tier}playerMatchStats{opponentChampionId goldDiffAtLaneEnd creepScoreDiffAtLaneEnd goldAtLaneEnd goldEarned goldSpent win kills assists deaths time_cc_others total_time_cc_dealt wards_purchased wardsPlaced wardsKilled damageDealt damage_to_champions damage_to_towers damage_to_objectives damageSelfMitigated damage_taken damage_healed damage_physical_dealt damage_magic_dealt damage_true_dealt minions_killed_neutral minions_killed_total killingSprees doubleKills tripleKills quadraKills pentaKills first_blood firstInhibitorKill firstTowerKill champLevel largest_critical largestKillingSpree largestMultiKill turrets_killed perkPrimaryStyle perkSubStyle perks spells items visionScore}}}}'
  let variables = `{"maxMatchAge":${dateCount},"first":${matchCount},"region":"${region}","riotSeasonId":${seasonId},"accountId":"${accountId}"}`
  let uri = base + "query=" + query + "&variables=" + variables
  let response = await fetch(encodeURI(uri));
  let json = await response.json();
  return await json.data.matches; // array
}
const getplayerStats = async (accountId, region) => {
  let base = 'https://league-player.iesdev.com/graphql?'
  let query = 'query PlayerChampionStats($accountId:String!,$region:Region!,$queue:Queue,$championId:Int,$role:Role,){playerChampionsStats(accountId:$accountId,region:$region,queue:$queue,championId:$championId,role:$role){championId gameDuration gameCount role lastPlayed queue basicStats{assists deaths kills wins lp lpEstimate visionScore}goldDiffAtLaneEnd goldStats{goldEarned goldSpent}damageStats{damageDealt damageHealed damageMagicDealt damagePhysicalDealt damageSelfMitigated damageTaken damageToChampions damageToObjectives damageToTowers damageTrueDealt}ccStats{timeCcOthers totalTimeCcDealt}wardStats{wardsKilled wardsPlaced wardsPurchased}firstStats{firstBlood firstInhibitorKill firstTowerKill}minionStats{minionsKilledEnemyJungle minionsKilledNeutral minionsKilledTeamJungle minionsKilledTotal}multikillStats{doubleKills killingSprees pentaKills quadraKills tripleKills}}}'
  let variables = `{"region":"${region}","accountId":"${accountId}"}`
  let uri = base + "query=" + query + "&variables=" + variables
  let response = await fetch(encodeURI(uri));
  let json = await response.json();
  return await json.data.playerChampionsStats; // array
}