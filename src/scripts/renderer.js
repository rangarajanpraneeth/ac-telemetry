const prefs = { hour: '2-digit', minute: '2-digit' };
let dateContainer = document.querySelector('.date');
let timeContainer = document.querySelector('.time');
const update = () => {
   const raw = new Date();
   const date = `${raw.getMonth() + 1}/${raw.getDate()}/${raw.getFullYear()}`;
   const time = raw.toLocaleTimeString('en-US', prefs).replace(/^0+/, '');
   dateContainer.innerHTML = date;
   timeContainer.innerHTML = time;
}
update();
setInterval(update, 1000);

const msToHMS = ms => {
   const h = String(Math.floor(ms / 3600000)).padStart(2, '0');
   const m = String(Math.floor((ms % 3600000) / 60000)).padStart(2, '0');
   const s = String(Math.floor((ms % 60000) / 1000)).padStart(2, '0');
   return `${h}:${m}:${s}`;
}

const populateRenderer = (data, metadata) => {
   switch (data.status) {
      case 'AC_OFF': document.querySelector('.data__status').innerHTML = 'OFF'; break;
      case 'AC_REPLAY': document.querySelector('.data__status').innerHTML = 'REPLAY'; break;
      case 'AC_LIVE': document.querySelector('.data__status').innerHTML = 'LIVE'; break;
      case 'AC_PAUSE': document.querySelector('.data__status').innerHTML = 'PAUSE'; break;
   }
   switch (data.session) {
      case 'AC_UNKNOWN': document.querySelector('.data__session').innerHTML = 'UNKNOWN'; break;
      case 'AC_PRACTICE': document.querySelector('.data__session').innerHTML = 'PRACTICE'; break;
      case 'AC_QUALIFY': document.querySelector('.data__session').innerHTML = 'QUALIFY'; break;
      case 'AC_RACE': document.querySelector('.data__session').innerHTML = 'RACE'; break;
      case 'AC_HOTLAP': document.querySelector('.data__session').innerHTML = 'HOTLAP'; break;
      case 'AC_TIME_ATTACK': document.querySelector('.data__session').innerHTML = 'TIME ATTACK'; break;
      case 'AC_DRIFT': document.querySelector('.data__session').innerHTML = 'DRIFT'; break;
      case 'AC_DRAG': document.querySelector('.data__session').innerHTML = 'DRAG'; break;
   }
   document.querySelector('.data__driver').innerHTML = data.driverName;
   if (data.carName === '0') document.querySelector('.data__car').innerHTML = 'ks_lamborghini_huracan_performante';
   document.querySelector('.data__car').innerHTML = data.carName;
   document.querySelector('.data__track').innerHTML = data.trackName;
   document.querySelector('.recording__status').innerHTML = metadata.recordingStatus;
   document.querySelector('.recording__length').innerHTML = msToHMS(metadata.recordingLength);
}

module.exports = populateRenderer;