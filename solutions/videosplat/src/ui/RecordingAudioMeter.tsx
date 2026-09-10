import { useEffect, useState } from "react";
export function RecordingAudioMeter({stream, paused}: {stream: MediaStream; paused: boolean}) {
 const [level,setLevel]=useState(0);
 const [message,setMessage]=useState("Checking recording audio…");
 useEffect(()=>{
  if (!stream.getAudioTracks().length) {setMessage("No audio source connected. This recording will be silent.");return;}
  let context: AudioContext | undefined;
  let timer: ReturnType<typeof setInterval> | undefined;
  let stopped=false;
  try {
   context=new AudioContext();
   const source=context.createMediaStreamSource(stream), analyser=context.createAnalyser(), mute=context.createGain();
   mute.gain.value=0;
   source.connect(analyser);analyser.connect(mute);mute.connect(context.destination);
   const data=new Float32Array(analyser.fftSize);
   let lastSignal=Date.now();
   const update=()=>{
    if(stopped)return;
    if(context?.state!=="running") {setMessage("Audio meter unavailable. Check sound in the recording review.");return;}
    analyser.getFloatTimeDomainData(data);
    const rms=Math.sqrt(data.reduce((sum,x)=>sum+x*x,0)/data.length);
    setLevel(Math.min(1,rms*4));
    if(rms>.001)lastSignal=Date.now();
    setMessage(Date.now()-lastSignal>3000 ? "No audio detected. Check your microphone and shared-tab sound." : rms>.001 ? "Audio detected" : "Listening for audio…");
   };
   void context.resume().then(()=>{if(!stopped)update();}).catch(()=>setMessage("Audio meter unavailable. Check sound in the recording review."));
   timer=setInterval(update,150);
  }catch{setMessage("Audio meter unavailable. Check sound in the recording review.");}
  return()=>{stopped=true;clearInterval(timer);void context?.close().catch(()=>{});};
 },[stream]);
 return <div className="recording-audio-meter"><label>Recording audio <meter min="0" max="1" value={paused?0:level} aria-label="Recording audio level"/></label><p role="status">{paused?"Recording paused":message}</p></div>;
}
