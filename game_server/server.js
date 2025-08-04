const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 8080 });

console.log('🎧 WebSocket server listening on ws://172.27.120.175:8080');

let hostSocket = null;
let clients = new Set();
let recording = false;
let recordingStartTime = 0;
let donecount = 0;
let startAt = 0;

let drumSnareHits = [];
let drumBassHits = [];
let pianoHits = [];
let guitarHits = [];

let drumSnareAns = [500, 1500, 2500, 3500, 3875, 4500, 4875, 5125, 5500, 6500, 7500, 7625, 8500, 9500, 10500, 11500, 11875, 12500, 12875, 13125, 13500, 14500, 15500, 15750, 15875];
let drumBassAns = [0, 375, 750, 1250, 1625, 2000, 2375, 2750, 3250, 3625, 4000, 4375, 4750, 5250, 5625, 6000, 6375, 6750, 7250, 7750, 8000, 8375, 8750, 9250, 9625, 10000, 10375, 10750, 11250, 11625, 12000, 12375, 12750, 13250, 13625, 14000, 14375, 14750, 15250, 15625];
let pianoAns = [{time: 0, note: 'G7'}, {time: 500, note: 'A7s'}, {time: 750, note: 'G8'}, {time: 1000, note: 'F8'}, {time: 1250, note: 'D8s'}, {time: 1500, note: 'D8'}, {time: 1750, note: 'D8s'}, {time: 2000, note: 'D8'}, {time: 2250, note: 'A7s'}, {time: 2750, note: 'A7s'}, {time: 3250, note: 'A7'}, {time: 3500, note: 'G7'}, {time: 3750, note: 'F7'}, {time: 4000, note: 'F7s'}, {time: 4500, note: 'A7'}, {time: 4750, note: 'G8'}, {time: 5000, note: 'F8'}, {time: 5250, note: 'D8s'}, {time: 5500, note: 'D8'}, {time: 5750, note: 'D8s'}, {time: 6000, note: 'D8'}, {time: 6500, note: 'A7s'}, {time: 7000, note: 'A7s'}, {time: 7250, note: 'G7'}, {time: 7500, note: 'A7'}, {time: 7750, note: 'A7s'}, {time: 8000, note: 'G7'}, {time: 8500, note: 'A7s'}, {time: 8750, note: 'G8'}, {time: 9000, note: 'F8'}, {time: 9250, note: 'D8s'}, {time: 9500, note: 'D8'}, {time: 9750, note: 'D8s'}, {time: 10000, note: 'D8'}, {time: 10250, note: 'A7s'}, {time: 10750, note: 'A7s'}, {time: 11250, note: 'A7'}, {time: 11500, note: 'G7'}, {time: 11750, note: 'F7'}, {time: 12000, note: 'F7s'}, {time: 12500, note: 'A7'}, {time: 12750, note: 'G8'}, {time: 13000, note: 'F8'}, {time: 13250, note: 'D8s'}, {time: 13500, note: 'D8'}, {time: 13750, note: 'D8s'}, {time: 14000, note: 'D8'}, {time: 14500, note: 'A7s'}, {time: 15000, note: 'A7s'}, {time: 15250, note: 'A7'}, {time: 15500, note: 'A7s'}, {time: 15750, note: 'F7'}];
let guitarAns = [{time: 0, chord: 1}, {time: 375, chord: 1}, {time: 875, chord: 1}, {time: 1250, chord: 1}, {time: 1500, chord: 1}, {time: 2000, chord: 2}, {time: 2375, chord: 2}, {time: 2875, chord: 2}, {time: 3250, chord: 2}, {time: 3500, chord: 2}, {time: 4000, chord: 3}, {time: 4375, chord: 3}, {time: 4875, chord: 3}, {time: 5250, chord: 3}, {time: 5500, chord: 3}, {time: 6000, chord: 4}, {time: 6375, chord: 4}, {time: 6875, chord: 4}, {time: 7250, chord: 4}, {time: 7500, chord: 4}, {time: 8000, chord: 1}, {time: 8375, chord: 1}, {time: 8875, chord: 1}, {time: 9250, chord: 1}, {time: 9500, chord: 1}, {time: 10000, chord: 2}, {time: 10375, chord: 2}, {time: 10875, chord: 2}, {time: 11250, chord: 2}, {time: 11500, chord: 2}, {time: 12000, chord: 3}, {time: 12375, chord: 3}, {time: 12875, chord: 3}, {time: 13250, chord: 3}, {time: 13500, chord: 3}, {time: 14000, chord: 4}, {time: 14375, chord: 4}, {time: 14875, chord: 4}, {time: 15250, chord: 4}, {time: 15500, chord: 4}];

let readyMap = {};  // stores { playerId: readyTime }
const expectedPlayers = ["drummer", "pianist", "guitarist"];

let replayData = {
  drum: {
    snare: [],
    bass: []
  },
  piano: [],
  guitar: []
};

wss.on('connection', (ws) => {
  console.log('🔌 Client connected');
  clients.add(ws);

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      const serverTime = Date.now();

      // Identify host
      if (data.type === "start" || data.type === "stop" || data.type === "reset" || data.type === "replay-request") {
        hostSocket = ws;

        if (data.type === "start") {
          console.log("▶️ Host started the game");
          recording = true;
          donecount = 0;

          const delay = 3000;
          startAt = Date.now() + delay;

          broadcastExceptHost({
            type: "startAt",
            startAt
          });
        } else if (data.type === "stop") {
          console.log("⏹️ Host stopped the game");
          broadcastExceptHost({ type: "stop" });
          recording = false;

          // === Score calculation placeholder ===
          let score = 0, snareScore = 0, bassScore = 0, pianoScore = 0, guitarScore = 0;
          // snare
          let cur = 0, wrong_spaces = 0;
          while (cur < drumSnareHits.length && drumSnareHits[cur] <= -62){
            cur++;
          }
          for (var i = 0; i < drumSnareAns.length; i++){// traverse through all the 
            let lbound = drumSnareAns[i] - 62, rbound = drumSnareAns[i] + 62;
            while(cur < drumSnareHits.length && drumSnareHits[cur] < lbound){// passes all hits that are before lbound
              cur++;
              wrong_spaces++;
            }
            if(cur === drumSnareHits.length || drumSnareHits[cur] > rbound){// goes to next note if no note is played in this interval
              continue;
            }
            let l = cur, r = cur;
            while(r < drumSnareHits.length && drumSnareHits[r] < rbound){// moves r such that [l, r) covers all notes in the interval
              r++;
            }
            if(r - l === 1){// if only one note exists in the interval
              snareScore += 5;
            }
            cur = r;// moves cur to next possible position
          }
          snareScore -= wrong_spaces * 2;
          score += Math.max(0, snareScore);

          // bass
          cur = 0, wrong_spaces = 0;
          while (cur < drumBassHits.length && drumBassHits[cur] <= -62){
            cur++;
          }
          for (var i = 0; i < drumBassAns.length; i++){// traverse through all the 
            let lbound = drumBassAns[i] - 62, rbound = drumBassAns[i] + 62;
            while(cur < drumBassHits.length && drumBassHits[cur] < lbound){// passes all hits that are before lbound
              cur++;
              wrong_spaces++;
            }
            if(cur === drumBassHits.length || drumBassHits[cur] > rbound){// goes to next note if no note is played in this interval
              continue;
            }
            let l = cur, r = cur;
            while(r < drumBassHits.length && drumBassHits[r] < rbound){// moves r such that [l, r) covers all notes in the interval
              r++;
            }
            if(r - l === 1){// if only one note exists in the interval
              bassScore += 5;
            }
            cur = r;// moves cur to next possible position
          }
          bassScore -= wrong_spaces * 2;
          score += Math.max(0, bassScore);

          // piano
          cur = 0, wrong_spaces = 0;
          while (cur < pianoHits.length && pianoHits[cur].time <= -62){
            cur++;
          }
          for (var i = 0; i < pianoAns.length; i++){// traverse through all the 
            let lbound = pianoAns[i].time - 62, rbound = pianoAns[i].time + 62;
            while(cur < pianoHits.length && pianoHits[cur].time < lbound){// passes all hits that are before lbound
              cur++;
              wrong_spaces++;
            }
            if(cur === pianoHits.length || pianoHits[cur].time > rbound){// goes to next note if no note is played in this interval
              continue;
            }
            let l = cur, r = cur;
            while(r < pianoHits.length && pianoHits[r].time < rbound){// moves r such that [l, r) covers all notes in the interval
              r++;
            }
            if(r - l === 1 && pianoHits[l].note === pianoAns[i].note){// if only one note exists in the interval and note is right
              pianoScore += 5;
            }
            cur = r;// moves cur to next possible position
          }
          pianoScore -= wrong_spaces * 2;
          score += Math.max(0, pianoScore);

          // guitar
          cur = 0, wrong_spaces = 0;
          while (cur < guitarHits.length && guitarHits[cur].time <= -62){
            cur++;
          }
          for (var i = 0; i < guitarAns.length; i++){// traverse through all the 
            let lbound = guitarAns[i].time - 62, rbound = guitarAns[i].time + 62;
            while(cur < guitarHits.length && guitarHits[cur].time < lbound){// passes all hits that are before lbound
              cur++;
              wrong_spaces++;
            }
            if(cur === guitarHits.length || guitarHits[cur].time > rbound){// goes to next note if no note is played in this interval
              continue;
            }
            let l = cur, r = cur;
            while(r < guitarHits.length && guitarHits[r].time < rbound){// moves r such that [l, r) covers all notes in the interval
              r++;
            }
            if(r - l === 1 && guitarHits[l].chord === guitarAns[i].chord){// if only one note exists in the interval and note is right
              guitarScore += 5;
            }
            cur = r;// moves cur to next possible position
          }
          guitarScore -= wrong_spaces * 2;
          score += Math.max(0, guitarScore);

          // ======================================

          if (hostSocket) {
            hostSocket.send(JSON.stringify({
              type: "score",
              value: score
            }));
          }

        } else if (data.type === "reset") {
          console.log("🔄 Host reset the game");
          broadcastExceptHost({ type: "reset" });
          
          console.log("snare: ")
          console.log(drumSnareHits);
          console.log("bass: ");
          console.log(drumBassHits);
          console.log("piano: ");
          console.log(pianoHits);
          console.log("guitar");
          console.log(guitarHits);
            
          drumSnareHits = [];
          drumBassHits = [];
          pianoHits = [];
          guitarHits = [];
          replayData = {
            drum: {
              snare: [],
              bass: []
            },
            piano: [],
            guitar: []
          };

        } else if (data.type === "replay-request" && ws === hostSocket) {
          console.log("Replay requested.");
          ws.send(JSON.stringify({
            type: "replay-data",
            data: replayData
          }));
        }

        return;
      }
      
      recordingStartTime = startAt + 4500;
      // Handle client messages
      if (recording) {
        if (data.playerId === "drummer") {
          const delta = data.clientTime - recordingStartTime;

          if (data.action === "bass") {
            drumBassHits.push(delta);
            replayData.drum.bass.push(delta);
            //console.log(`[${serverTime}] 🥁 Drummer hit BASS drum at ${delta}ms`);
          } else if (data.action === "snare") {
            drumSnareHits.push(delta);
            replayData.drum.snare.push(delta);
            //console.log(`[${serverTime}] 🥁 Drummer hit SNARE drum at ${delta}ms`);
          } else {
            //console.warn(`[${serverTime}] ❓ Unknown drum action:`, data);
          }

        } else if (data.playerId === "pianist") {
          const delta = data.clientTime - recordingStartTime;
          if (data.note) {
            pianoHits.push({ time: delta, note: data.note });
            replayData.piano.push({ note: data.note, time: delta });
            //console.log(`[${serverTime}] 🎹 Pianist played ${data.note} at ${delta}ms`);
          }

        } else if (data.playerId === "guitarist") {
          const delta = data.clientTime - recordingStartTime;
          if (data.chord) {
            guitarHits.push({ time: delta, chord: data.chord });
            replayData.guitar.push({ chord: data.chord, time: delta });
            //console.log(`[${serverTime}] 🎸 Guitarist strummed chord ${data.chord} at ${delta}ms`);
          }

        } else {
          console.warn(`[${serverTime}] ❓ Unknown player:`, data);
        }
      }
    } catch (err) {
      console.error('❌ Error parsing message:', err);
    }
  });

  ws.on('close', () => {
    console.log('🔌 Client disconnected');
    clients.delete(ws);
    if (ws === hostSocket) {
      hostSocket = null;
      console.log('⚠️ Host disconnected');
    }
  });
});

// Broadcast to all clients except the host
function broadcastExceptHost(message) {
  const msgStr = JSON.stringify(message);
  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(msgStr);
    }
  }
}

