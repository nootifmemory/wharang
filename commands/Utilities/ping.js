module.exports = {
  name : 'ping',
  description : 'this is the ping command , for checking latency',
  cooldown : 3 ,
  run(client, message, args, Discord) {
    message.channel.send(`🏓Latency is ${Date.now() - message.createdTimestamp}ms. API Latency is ${Math.round(client.ws.ping)}ms`)
  }
}