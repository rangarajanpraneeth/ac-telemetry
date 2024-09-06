const NodeIPC = require('@fynnix/node-easy-ipc');
const binutils = require('binutils');
const fs = require('fs');
const path = require('path');

const populateRenderer = require('../scripts/renderer');

const AC_STATUS = {
   "0": "AC_OFF",
   "1": "AC_REPLAY",
   "2": "AC_LIVE",
   "3": "AC_PAUSE"
}

const AC_SESSION = {
   "-1": "AC_UNKNOWN",
   "0": "AC_PRACTICE",
   "1": "AC_QUALIFY",
   "2": "AC_RACE",
   "3": "AC_HOTLAP",
   "4": "AC_TIME_ATTACK",
   "5": "AC_DRIFT",
   "6": "AC_DRAG"
}

const AC_FLAG = {
   "0": "AC_NO_FLAG",
   "1": "AC_BLUE_FLAG",
   "2": "AC_YELLOW_FLAG",
   "3": "AC_BlACK_FLAG",
   "4": "AC_WHITE_FLAG",
   "5": "AC_CHECKERED_FLAG",
   "6": "AC_PENALTY_FLAG"
}

const kmhToMph = kmh => {
   return kmh / 1.609;
}

const kmhToMps = kmh => {
   return kmh / 3.6;
}

const headersPath = path.join(__dirname, '../constants', 'headers.txt');
const headers = fs.readFileSync(headersPath, 'utf-8');
let recording = false;
let recordingStatus = 'Not recording';
let recordingLength = 0;
let raceData = '';

const startRecording = () => {
   // return if already recording
   if (recording) return;
   console.log('Started recording');
   recording = true;
   recordingStatus = 'Started recording';
}

const pauseRecording = () => {
   // return if not already recording
   if (!recording) return;
   console.log('Paused recording');
   recording = false;
   recordingStatus = 'Paused recording';
}

const stopRecording = () => {
   console.log('Stopped recording');
   recording = false;
   recordingStatus = 'Stopped recording';
   const fileName = String(Date.now());
   const filePath = path.join(__dirname, '../data', `${fileName}.csv`);
   fs.writeFileSync(filePath, headers + raceData, {
      encoding: 'utf-8',
      flag: 'w'
   });
   raceData = '';
   recordingLength = 0;
   setTimeout(() => {
      recordingStatus = 'Not recording';
   }, 1500);
}

const precision = 3;

const truncate = float => {
   return parseFloat(float.toFixed(precision));
}

const readChar = reader => {
   const byte = reader.ReadBytes(2);
   return byte.toString().split('\x00')[0];
}

graphicsLength = 0x62C;
physicsLength = 0x2C8;
staticLength = 0x334;

graphicsBuffer = Buffer.alloc(graphicsLength);
physicsBuffer = Buffer.alloc(physicsLength);
staticBuffer = Buffer.alloc(staticLength);

graphics = new NodeIPC.FileMapping();
physics = new NodeIPC.FileMapping();
static = new NodeIPC.FileMapping();

// shared memory functions
// anything of length 3 follows this format: x y z
// anything of length 4 follows this format: fl fr rl rr
const readGraphics = () => {
   const graphicsPath = 'Local\\acpmf_graphics';
   graphics.createMapping(null, graphicsPath, graphicsLength);
   graphics.readInto(0, graphicsLength, graphicsBuffer);

   const reader = new binutils.BinaryReader(graphicsBuffer, 'little');
   return {
      graphicsPacketID: reader.ReadUInt32(),
      status: AC_STATUS[reader.ReadUInt32().toString()],
      session: AC_SESSION[reader.ReadUInt32().toString()],
      currentTime: Array.from({ length: 15 }, () => readChar(reader)).join(''),
      lastTime: Array.from({ length: 15 }, () => readChar(reader)).join(''),
      bestTime: Array.from({ length: 15 }, () => readChar(reader)).join(''),
      split: Array.from({ length: 15 }, () => readChar(reader)).join(''),
      completedLaps: reader.ReadUInt32(),
      position: reader.ReadUInt32(),
      iCurrentTime: reader.ReadUInt32(),
      iLastTime: reader.ReadUInt32(),
      iBestTime: reader.ReadUInt32(),
      sessionTimeLeft: truncate(reader.ReadFloat()),
      distanceTraveled: truncate(reader.ReadFloat()),
      isInPit: reader.ReadUInt32(),
      currentSectorIndex: reader.ReadUInt32(),
      lastSectorTime: reader.ReadUInt32(),
      numLaps: reader.ReadUInt32(),
      tireCompound: Array.from({ length: 34 }, () => readChar(reader)).join(''),
      replayTimeMultiplier: truncate(reader.ReadFloat()),
      normalizedCarPosition: truncate(reader.ReadFloat()),
      coordinates: Array.from({ length: 3 }, () => truncate(reader.ReadFloat())),
      penaltyTime: truncate(reader.ReadFloat()),
      flag: AC_FLAG[reader.ReadUInt32().toString()],
      idealLineOn: reader.ReadUInt32() > 0,
      isInPitLane: reader.ReadUInt32() > 0,
      surfaceGrip: truncate(reader.ReadFloat()),
      mandatoryPitDone: reader.ReadUInt32() > 0,
      windSpeed: truncate(reader.ReadFloat()),
      windDirection: truncate(reader.ReadFloat())
   }
}

const readPhysics = () => {
   const physicsPath = 'Local\\acpmf_physics';
   physics.createMapping(null, physicsPath, physicsLength);
   physics.readInto(0, physicsLength, physicsBuffer);

   const reader = new binutils.BinaryReader(physicsBuffer, 'little');
   return {
      physicsPacketID: reader.ReadUInt32(),
      throttle: truncate(reader.ReadFloat()),
      brake: truncate(reader.ReadFloat()),
      fuel: truncate(reader.ReadFloat()),
      gear: reader.ReadUInt32() - 1,
      RPM: reader.ReadUInt32(),
      steeringAngle: truncate(reader.ReadFloat()),
      speedKMH: truncate(reader.ReadFloat()),
      velocity: Array.from({ length: 3 }, () => truncate(reader.ReadFloat())),
      accG: Array.from({ length: 3 }, () => truncate(reader.ReadFloat())),
      wheelSlip: Array.from({ length: 4 }, () => truncate(reader.ReadFloat())),
      wheelLoad: Array.from({ length: 4 }, () => truncate(reader.ReadFloat())),
      wheelPressure: Array.from({ length: 4 }, () => truncate(reader.ReadFloat())),
      wheelAngularSpeed: Array.from({ length: 4 }, () => truncate(reader.ReadFloat())),
      tireWear: Array.from({ length: 4 }, () => truncate(reader.ReadFloat())),
      tireDirtyLevel: Array.from({ length: 4 }, () => truncate(reader.ReadFloat())),
      tireCoreTemp: Array.from({ length: 4 }, () => truncate(reader.ReadFloat())),
      camberRAD: Array.from({ length: 4 }, () => truncate(reader.ReadFloat())),
      suspTravel: Array.from({ length: 4 }, () => truncate(reader.ReadFloat())),
      drs: truncate(reader.ReadFloat()),
      tc: truncate(reader.ReadFloat()),
      heading: truncate(reader.ReadFloat()),
      pitch: truncate(reader.ReadFloat()),
      roll: truncate(reader.ReadFloat()),
      cgHeight: truncate(reader.ReadFloat()),
      carDmg: Array.from({ length: 5 }, () => truncate(reader.ReadFloat())),
      numTiresOut: reader.ReadUInt32(),
      pitLimiterOn: reader.ReadUInt32() > 0,
      abs: truncate(reader.ReadFloat()),
      kersCharge: truncate(reader.ReadFloat()),
      kersInput: truncate(reader.ReadFloat()),
      autoShifterOn: reader.ReadUInt32() > 0,
      rideHeight: Array.from({ length: 2 }, () => truncate(reader.ReadFloat())),
      turboBoost: truncate(reader.ReadFloat()),
      ballast: truncate(reader.ReadFloat()),
      airDensity: truncate(reader.ReadFloat()),
      airTemp: truncate(reader.ReadFloat()),
      roadTemp: truncate(reader.ReadFloat()),
      localAngularVelocity: Array.from({ length: 3 }, () => truncate(reader.ReadFloat())),
      finalForceFeedback: truncate(reader.ReadFloat()),
      performanceMeter: truncate(reader.ReadFloat()),
      engineBrake: reader.ReadUInt32(),
      ersRecoveryLevel: reader.ReadUInt32(),
      ersPowerLevel: reader.ReadUInt32(),
      ersHeatCharging: reader.ReadUInt32(),
      ersIsCharging: reader.ReadUInt32() > 0,
      kersCurrentKJ: truncate(reader.ReadFloat()),
      drsAvailable: reader.ReadUInt32() > 0,
      drsEnabled: reader.ReadUInt32() > 0,
      brakeTemp: Array.from({ length: 4 }, () => truncate(reader.ReadFloat())),
      clutch: truncate(reader.ReadFloat()),
      tireTempInner: Array.from({ length: 4 }, () => truncate(reader.ReadFloat())),
      tireTempMiddle: Array.from({ length: 4 }, () => truncate(reader.ReadFloat())),
      tireTempOuter: Array.from({ length: 4 }, () => truncate(reader.ReadFloat())),
      AIControlled: reader.ReadUInt32() > 0,
      tireContactPoint: Array.from({ length: 4 }, () => Array.from({ length: 3 }, () => truncate(reader.ReadFloat()))),
      tireContactNormal: Array.from({ length: 4 }, () => Array.from({ length: 3 }, () => truncate(reader.ReadFloat()))),
      tireContactHeading: Array.from({ length: 4 }, () => Array.from({ length: 3 }, () => truncate(reader.ReadFloat()))),
      brakeBias: truncate(reader.ReadFloat()),
      localVelocity: Array.from({ length: 3 }, () => truncate(reader.ReadFloat()))
   }
}

const readStatic = () => {
   const staticPath = 'Local\\acpmf_static';
   static.createMapping(null, staticPath, staticLength);
   static.readInto(0, staticLength, staticBuffer);

   const reader = new binutils.BinaryReader(staticBuffer, 'little');
   return {
      smVersion: Array.from({ length: 15 }, () => readChar(reader)).join(''),
      acVersion: Array.from({ length: 15 }, () => readChar(reader)).join(''),
      numSessions: reader.ReadUInt32(),
      numCars: reader.ReadUInt32(),
      carName: Array.from({ length: 33 }, () => readChar(reader)).join(''),
      trackName: Array.from({ length: 33 }, () => readChar(reader)).join(''),
      driverFName: Array.from({ length: 33 }, () => readChar(reader)).join(''),
      driverLName: Array.from({ length: 33 }, () => readChar(reader)).join(''),
      driverName: Array.from({ length: 34 }, () => readChar(reader)).join(''),
      numSectors: reader.ReadUInt32(),
      maxTorque: truncate(reader.ReadFloat()),
      maxPower: truncate(reader.ReadFloat()),
      maxRPM: reader.ReadUInt32(),
      maxFuel: truncate(reader.ReadFloat()),
      maxSuspensionTravel: Array.from({ length: 4 }, () => truncate(reader.ReadFloat())),
      tireRadius: Array.from({ length: 4 }, () => truncate(reader.ReadFloat())),
      maxTurboBoost: truncate(reader.ReadFloat()),
      deprecated1: truncate(reader.ReadFloat()),
      deprecated2: truncate(reader.ReadFloat()),
      penaltiesEnabled: reader.ReadUInt32() > 0,
      fuelConsumptionRate: truncate(reader.ReadFloat()),
      tireWearRate: truncate(reader.ReadFloat()),
      damageRate: truncate(reader.ReadFloat()),
      allowTireBlankets: reader.ReadUInt32() > 0,
      stabilityControl: truncate(reader.ReadFloat()),
      autoClutch: reader.ReadUInt32() > 0,
      autoBlip: reader.ReadUInt32() > 0,
      hasDRS: reader.ReadUInt32() > 0,
      hasERS: reader.ReadUInt32() > 0,
      hasKERS: reader.ReadUInt32() > 0,
      maxJoulesKERS: truncate(reader.ReadFloat()),
      engineBrakeSettingsCount: reader.ReadUInt32(),
      ERSPowerControllerCount: reader.ReadUInt32(),
      trackSplineLength: truncate(reader.ReadFloat()),
      trackConfig: Array.from({ length: 34 }, () => readChar(reader)).join(''),
      maxJoulesERS: truncate(reader.ReadFloat()),
      isTimedRace: reader.ReadUInt32() > 0,
      hasExtraLap: reader.ReadUInt32() > 0,
      carSkin: Array.from({ length: 34 }, () => readChar(reader)).join(''),
      reversedGridPositions: reader.ReadUInt32(),
      pitWindowStart: reader.ReadUInt32(),
      pitWindowEnd: reader.ReadUInt32()
   }
}

const interval = 10;

setInterval(() => {
   combined = { ...readGraphics(), ...readPhysics(), ...readStatic() };
   metadata = { recordingStatus: recordingStatus, recordingLength: recordingLength };
   if (recording) {
      combined.recordingLength = recordingLength;
      raceData += `\n${Object.values(combined).join(',')}`;
      recordingLength += interval;
   }
   // console.log(combined);
   // console.log(metadata);
   populateRenderer(combined, metadata);
}, interval);

process.on('SIGINT', () => {
   process.exit();
});