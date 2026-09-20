// Uses the game's unlocked AudioContext, including when input comes from a gamepad.
window.createNumberVoice=function(context,encoded){
  const gain=context.createGain();gain.connect(context.destination);
  const ready=context.decodeAudioData(Uint8Array.from(atob(encoded),c=>c.charCodeAt(0)).buffer);
  ready.catch(()=>{});
  let source=null,offset=0,started=0,version=0,paused=true,ended=false;
  return {
    get paused(){return paused;},get ended(){return ended;},
    get currentTime(){return offset+(source?context.currentTime-started:0);},
    set muted(value){gain.gain.value=value?0:.98;},
    set currentTime(value){offset=value;ended=false;},
    async play(){
      const token=++version;paused=false;ended=false;
      try{
        const [buffer]=await Promise.all([ready,context.resume()]);
        if(token!==version||paused)return;
        if(offset>=buffer.duration)offset=0;
        const node=context.createBufferSource();source=node;node.buffer=buffer;node.connect(gain);
        started=context.currentTime;
        node.onended=()=>{node.disconnect();if(source===node){source=null;paused=true;ended=true;offset=0;}};
        node.start(0,offset);
      }catch(error){if(token===version)paused=true;throw error;}
    },
    pause(){
      ++version;paused=true;
      if(source){offset+=context.currentTime-started;const node=source;source=null;node.stop();node.disconnect();}
    }
  };
};
