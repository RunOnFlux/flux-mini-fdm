const axios = require('axios');
const readline = require('readline');
const fs = require('fs');
const nodecmd = require('node-cmd');
const util = require('util');
const timer = require('timers/promises');

const configFile = '/etc/haproxy/haproxy.cfg';
const appName = process.env.APP_NAME || 'wordpressonflux';
const appPort = process.env.APP_PORT || 33952;
const cmdAsync = util.promisify(nodecmd.run);

async function getApplicationIP(appName) {
  try {
    const fluxnodeList = await axios.get(`https://api.runonflux.io/apps/location/${appName}`, { timeout: 13456 });
    if (fluxnodeList.data.status === 'success') {
      return fluxnodeList.data.data || [];
    }
    return [];
  } catch (e) {
    return [];
  }
}

function convertIP(ip) {
  // eslint-disable-next-line no-param-reassign, prefer-destructuring
  if (ip.includes(':')) ip = ip.split(':')[0];
  return ip;
}

async function getHAConfig(){
  let HAconfig = '';
  const fileStream = fs.createReadStream(configFile);

  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });
  for await (const line of rl) {
    HAconfig += line + '\n';
    if(line.includes('[SERVERS]')) break;
  }
  return HAconfig;
}

async function updateList(){
  while(true){
    try{
      const ipList = await getApplicationIP(appName);
      console.log(ipList);
      while(!fs.existsSync(configFile)) {
        console.log(`${configFile} not found. trying again...`);
        await timer.setTimeout(500);
      }
      let config = await getHAConfig();
      
      for (let i = 0; i < ipList.length; i++) {
        config = config + `    server www${i+1} ${convertIP(ipList[i].ip)}:${appPort} check\n`;
      }
      console.log(config);
      fs.writeFileSync(configFile, config);
      await cmdAsync('supervisorctl signal USR1 haproxy');
    } catch(err){
      console.log(err);
    }
    await timer.setTimeout(1000 * 60 * 5);
  }
}

updateList();