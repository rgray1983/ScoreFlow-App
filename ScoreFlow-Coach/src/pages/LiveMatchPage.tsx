import { useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import MatchSetupScreen, { type MatchSetupValue } from '../components/MatchSetupScreen';
import PlayerActionWheel, { type StatAction } from '../components/PlayerActionWheel';
import { useWorkspace } from '../context/WorkspaceContext';
import type { Player, RosterMembership } from '../types/workspace';

type Side = 'home' | 'away';
type LiveEvent = { id:string; kind:'score'|'stat'|'rotation'|'sub'|'timeout'|'system'; label:string; at:string };
type CourtPoint = { x:number; y:number };
type MatchState = { homeScore:number; awayScore:number; set:number; homeSets:number; awaySets:number; serving:Side; rotation:number; courtIds:string[]; benchIds:string[]; positions:Record<string,CourtPoint>; selectedPlayerId:string; events:LiveEvent[]; homeTimeouts:number; awayTimeouts:number; opponent:string; started:boolean };
type CourtPlayer = { id:string; name:string; number:string; position:string; libero:boolean; captain:boolean; starter:boolean; photoUrl?:string };

const STORAGE_KEY='scoreflow-live-match-v3';
const statActions:StatAction[]=['Kill','Attack error','Ace','Serve error','Dig','Block touch','Solo block','Assist','Pass 0','Pass 1','Pass 2','Pass 3'];
const defaultPoints:CourtPoint[]=[{x:12,y:27},{x:27,y:27},{x:42,y:27},{x:12,y:72},{x:27,y:72},{x:42,y:72}];

export default function LiveMatchPage(){
  const workspace=useWorkspace();
  const navigate=useNavigate();
  const roster=useMemo(()=>workspace.rosterMemberships
    .filter((membership)=>membership.teamId===workspace.activeTeamId&&membership.seasonId===workspace.activeSeasonId)
    .map((membership)=>({membership,player:workspace.players.find((player)=>player.id===membership.playerId)}))
    .filter((row):row is {membership:RosterMembership;player:Player}=>row.player!==undefined)
    .filter((row)=>!row.player.archived),[workspace.activeTeamId,workspace.activeSeasonId,workspace.rosterMemberships,workspace.players]);
  const players=useMemo<CourtPlayer[]>(()=>roster.map(({membership,player})=>({id:player.id,name:`${player.preferredName||player.firstName} ${player.lastName}`,number:membership.jerseyNumber||'—',position:membership.position||player.primaryPosition||'—',libero:membership.libero,captain:membership.captain,starter:membership.starter,photoUrl:player.photoUrl||undefined})),[roster]);
  const scheduledEvents=workspace.scheduleEvents.filter((event)=>event.teamId===workspace.activeTeamId&&event.seasonId===workspace.activeSeasonId);
  const scheduled=scheduledEvents.filter((event)=>event.type==='match').sort((a,b)=>`${a.date}${a.startTime}`.localeCompare(`${b.date}${b.startTime}`))[0];
  const activeRecord=workspace.matches.find((record)=>record.teamId===workspace.activeTeamId&&record.seasonId===workspace.activeSeasonId&&record.status==='live');
  const [setupVisible,setSetupVisible]=useState(()=>!activeRecord);
  const [match,setMatch]=useState<MatchState>(()=>readState(players,scheduled?.opponent||'Opponent'));
  const [showTimeline,setShowTimeline]=useState(false);
  const [showExit,setShowExit]=useState(false);
  const [wheelPlayerId,setWheelPlayerId]=useState('');
  const [draggingId,setDraggingId]=useState('');
  const [subOut,setSubOut]=useState('');
  const [flash,setFlash]=useState('');
  const dragMoved=useRef(false);
  const dragOrigin=useRef<{x:number;y:number}|null>(null);

  useEffect(()=>localStorage.setItem(STORAGE_KEY,JSON.stringify(match)),[match]);
  useEffect(()=>{document.body.classList.add('live-match-active');return()=>document.body.classList.remove('live-match-active')},[]);
  const court=match.courtIds.map((id)=>players.find((player)=>player.id===id)).filter((player):player is CourtPlayer=>player!==undefined);
  const bench=match.benchIds.map((id)=>players.find((player)=>player.id===id)).filter((player):player is CourtPlayer=>player!==undefined);
  const wheelPlayer=players.find((player)=>player.id===wheelPlayerId);
  const style={'--live-primary':workspace.activeTeam?.primaryColor??'#ef3340','--live-secondary':workspace.activeTeam?.secondaryColor??'#f4c95d'} as CSSProperties;

  function startConfiguredMatch(config:MatchSetupValue){
    const recordId=workspace.addMatch({scheduleEventId:config.scheduleEventId,teamId:workspace.activeTeamId,seasonId:workspace.activeSeasonId,opponent:config.opponent,locationType:config.locationType,format:config.format,regularSetTarget:config.regularSetTarget,decidingSetTarget:config.decidingSetTarget,winByTwo:config.winByTwo,initialServe:config.initialServe,startingPlayerIds:config.startingPlayerIds,liberoPlayerId:config.liberoPlayerId});
    workspace.updateMatch(recordId,{status:'live',startedAt:new Date().toISOString()});
    localStorage.removeItem(STORAGE_KEY);
    setMatch(buildConfigured(players,config));
    setWheelPlayerId('');
    setSetupVisible(false);
  }
  function addEvent(kind:LiveEvent['kind'],label:string){setMatch((current)=>({...current,events:[{id:`event-${Date.now()}-${Math.random()}`,kind,label,at:new Date().toLocaleTimeString([],{hour:'numeric',minute:'2-digit'})},...current.events].slice(0,120)}))}
  function score(side:Side,delta:number){setMatch((current)=>({...current,[side==='home'?'homeScore':'awayScore']:Math.max(0,current[side==='home'?'homeScore':'awayScore']+delta),serving:delta>0?side:current.serving}));addEvent('score',`${side==='home'?workspace.activeTeam?.name||'Home':match.opponent} ${delta>0?'+1':'-1'}`)}
  function recordStat(action:StatAction){if(!wheelPlayer)return;addEvent('stat',`#${wheelPlayer.number} ${wheelPlayer.name} · ${action}`);setFlash(`${wheelPlayer.name}: ${action}`);setWheelPlayerId('');setTimeout(()=>setFlash(''),900)}
  function rotate(){setMatch((current)=>{const ids=current.courtIds.length?[current.courtIds[current.courtIds.length-1],...current.courtIds.slice(0,-1)]:current.courtIds;const positions={...current.positions};ids.forEach((id,index)=>{positions[id]=defaultPoints[index]});return{...current,rotation:current.rotation===6?1:current.rotation+1,courtIds:ids,positions}});addEvent('rotation',`Rotated to R${match.rotation===6?1:match.rotation+1}`)}
  function substitute(inId:string){if(!subOut||!inId)return;setMatch((current)=>{const slot=current.courtIds.indexOf(subOut);const positions={...current.positions,[inId]:current.positions[subOut]??defaultPoints[Math.max(0,slot)]};delete positions[subOut];return{...current,courtIds:current.courtIds.map((id)=>id===subOut?inId:id),benchIds:[...current.benchIds.filter((id)=>id!==inId),subOut],positions,selectedPlayerId:inId}});const outgoing=players.find((player)=>player.id===subOut);const incoming=players.find((player)=>player.id===inId);addEvent('sub',`#${incoming?.number} ${incoming?.name} in · #${outgoing?.number} ${outgoing?.name} out`);setSubOut('')}
  function movePlayer(event:ReactPointerEvent<HTMLDivElement>){if(!draggingId)return;const rect=event.currentTarget.getBoundingClientRect();const x=Math.max(7,Math.min(46,((event.clientX-rect.left)/rect.width)*100));const y=Math.max(13,Math.min(87,((event.clientY-rect.top)/rect.height)*100));if(dragOrigin.current&&Math.hypot(event.clientX-dragOrigin.current.x,event.clientY-dragOrigin.current.y)>6)dragMoved.current=true;setMatch((current)=>({...current,positions:{...current.positions,[draggingId]:{x,y}}}))}
  function finishDrag(){if(!draggingId)return;const playerId=draggingId;setDraggingId('');dragOrigin.current=null;if(!dragMoved.current)setWheelPlayerId(playerId)}
  function undo(){setMatch((current)=>({...current,events:current.events.slice(1)}));setFlash('Last timeline event removed');setTimeout(()=>setFlash(''),900)}
  function saveExit(){navigate('/')}
  function newMatch(){localStorage.removeItem(STORAGE_KEY);setWheelPlayerId('');setShowExit(false);setSetupVisible(true)}

  if(setupVisible)return <div style={style}><MatchSetupScreen teamName={workspace.activeTeam?.name??'Home team'} events={scheduledEvents} players={players.map((player)=>({...player,photoUrl:player.photoUrl??''}))} onCancel={()=>navigate('/')} onStart={startConfiguredMatch} /></div>;

  return <div className="live-match-mode" style={style}>
    <header className="live-scorebar is-simplified"><button className="live-home" onClick={()=>setShowExit(true)} type="button" aria-label="Leave match">⌂</button><div className="live-match-cluster"><div className="live-team-score home"><div className="score-controls"><button onClick={()=>score('home',-1)} type="button">−</button><strong>{match.homeScore}</strong><button onClick={()=>score('home',1)} type="button">+1</button></div></div><div className="live-match-center"><small>SET {match.set} · R{match.rotation}</small><b>{match.homeSets} — {match.awaySets}</b><button className={`serve-pill ${match.serving}`} onClick={()=>setMatch((current)=>({...current,serving:current.serving==='home'?'away':'home'}))} type="button">{match.serving==='home'?'HOME':'AWAY'} SERVE</button></div><div className="live-team-score away"><div className="score-controls"><button onClick={()=>score('away',-1)} type="button">−</button><strong>{match.awayScore}</strong><button onClick={()=>score('away',1)} type="button">+1</button></div></div></div></header>

    <main className="live-stage"><section className="live-court-wrap"><div className="live-court" onPointerMove={movePlayer} onPointerUp={finishDrag} onPointerCancel={finishDrag}><div className="home-court-label"><span>{workspace.activeTeam?.name??'Home team'}</span></div><div className="opponent-zone"><span>{match.opponent}</span></div><div className="court-net"><span>NET</span></div>
      {court.slice(0,6).map((player,index)=>{const point=match.positions[player.id]??defaultPoints[index];return <button className={`court-player${match.selectedPlayerId===player.id?' is-selected':''}${player.libero?' is-libero':''}${player.photoUrl?' has-photo':''}`} style={{left:`${point.x}%`,top:`${point.y}%`}} key={player.id} onPointerDown={(event)=>{event.currentTarget.setPointerCapture(event.pointerId);dragMoved.current=false;dragOrigin.current={x:event.clientX,y:event.clientY};setDraggingId(player.id);setMatch((current)=>({...current,selectedPlayerId:player.id}))}} type="button">{player.photoUrl&&<img src={player.photoUrl} alt="" />}<span className="court-player-copy"><b>#{player.number}</b><strong>{player.name.split(' ')[0]}</strong><small>{player.position}</small></span></button>})}
      {wheelPlayer&&match.positions[wheelPlayer.id]&&<PlayerActionWheel player={wheelPlayer} actions={statActions} position={match.positions[wheelPlayer.id]} onSelect={recordStat} onClose={()=>setWheelPlayerId('')} />}</div>
      <div className="live-bench"><span>Bench</span>{bench.map((player)=><button className={player.photoUrl?'has-photo':''} key={player.id} onClick={()=>setMatch((current)=>({...current,selectedPlayerId:player.id}))} type="button">{player.photoUrl&&<img src={player.photoUrl} alt="" />}<span><b>#{player.number}</b><small>{player.name.split(' ')[0]}</small></span></button>)}</div></section>
      <footer className="live-command-bar"><button onClick={rotate} type="button">↻ Rotate</button><button onClick={()=>{setMatch((current)=>({...current,homeTimeouts:current.homeTimeouts+1}));addEvent('timeout','Home timeout')}} type="button">Timeout {match.homeTimeouts}</button><button onClick={undo} type="button">↶ Undo event</button><button onClick={()=>setShowTimeline(true)} type="button">☷ Timeline</button><div className="sub-console"><select value={subOut} onChange={(event)=>setSubOut(event.target.value)}><option value="">Player out</option>{court.map((player)=><option key={player.id} value={player.id}>#{player.number} {player.name}</option>)}</select><select onChange={(event)=>substitute(event.target.value)} value=""><option value="">Player in</option>{bench.map((player)=><option key={player.id} value={player.id}>#{player.number} {player.name}</option>)}</select></div></footer></main>

    {flash&&<div className="live-flash">{flash}</div>}
    {showTimeline&&<div className="live-drawer-backdrop" onClick={()=>setShowTimeline(false)}><section className="live-timeline" onClick={(event)=>event.stopPropagation()}><header><div><span>Match timeline</span><strong>{match.events.length} events</strong></div><button onClick={()=>setShowTimeline(false)} type="button">×</button></header><div>{match.events.map((event)=><article key={event.id}><time>{event.at}</time><span className={`event-${event.kind}`}>{event.kind}</span><p>{event.label}</p></article>)}{match.events.length===0&&<p className="timeline-empty">Score changes, stats, rotations, substitutions, and timeouts will appear here.</p>}</div></section></div>}
    {showExit&&<div className="live-exit-backdrop"><section className="live-exit-card"><span>Live match</span><h2>Leave Match Mode?</h2><p>Your current score, court, and timeline are already saved on this device.</p><button className="button button-primary" onClick={()=>setShowExit(false)} type="button">Resume match</button><button className="button button-quiet" onClick={saveExit} type="button">Save & exit</button><button className="button button-quiet" onClick={newMatch} type="button">Start another match</button></section></div>}
  </div>
}

function buildConfigured(players:CourtPlayer[],config:MatchSetupValue):MatchState{const courtIds=config.startingPlayerIds.slice(0,6);const positions=Object.fromEntries(courtIds.map((id,index)=>[id,defaultPoints[index]]));return{homeScore:0,awayScore:0,set:1,homeSets:0,awaySets:0,serving:config.initialServe,rotation:config.rotation,courtIds,benchIds:players.map((player)=>player.id).filter((id)=>!courtIds.includes(id)),positions,selectedPlayerId:courtIds[0]||'',events:[],homeTimeouts:0,awayTimeouts:0,opponent:config.opponent,started:true}}
function buildInitial(players:CourtPlayer[],opponent:string):MatchState{const starters=players.filter((player)=>player.starter&&!player.libero).slice(0,6);const fallback=players.filter((player)=>!player.libero).slice(0,6);const courtIds=(starters.length===6?starters:fallback).map((player)=>player.id);const positions=Object.fromEntries(courtIds.map((id,index)=>[id,defaultPoints[index]]));return{homeScore:0,awayScore:0,set:1,homeSets:0,awaySets:0,serving:'home',rotation:1,courtIds,benchIds:players.map((player)=>player.id).filter((id)=>!courtIds.includes(id)),positions,selectedPlayerId:courtIds[0]||players[0]?.id||'',events:[],homeTimeouts:0,awayTimeouts:0,opponent,started:true}}
function readState(players:CourtPlayer[],opponent:string){try{const saved=JSON.parse(localStorage.getItem(STORAGE_KEY)||'null') as MatchState|null;if(!saved)return buildInitial(players,opponent);const ids=new Set(players.map((player)=>player.id));const courtIds=saved.courtIds.filter((id)=>ids.has(id)).slice(0,6);const known=new Set(courtIds);const benchIds=[...saved.benchIds.filter((id)=>ids.has(id)&&!known.has(id)),...players.map((player)=>player.id).filter((id)=>!known.has(id)&&!saved.benchIds.includes(id))];const positions={...Object.fromEntries(courtIds.map((id,index)=>[id,defaultPoints[index]])),...(saved.positions??{})};return{...saved,opponent:saved.opponent||opponent,courtIds,benchIds,positions,selectedPlayerId:ids.has(saved.selectedPlayerId)?saved.selectedPlayerId:(courtIds[0]||benchIds[0]||'')}}catch{return buildInitial(players,opponent)}}