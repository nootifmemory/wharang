module.exports = {
  name : 'ping',
  description : 'this is the ping command , for checking latency',
  cooldown : 3 ,
  run(client, message, args, Discord) {
    message.channel.send(`Message latency is ${Date.now() - message.createdTimestamp}ms. WS latency is ${Math.round(client.ws.ping)}ms`)
  }
}