import { useMemo, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react';
import { useWorkspace } from '../context/WorkspaceContext';
import type { Player, RosterMembership } from '../types/workspace';

type RotationPlayer = { id:string; name:string; number:string; position:string; captain:boolean; libero:boolean; photoUrl?:string };
type Point = { x:number; y:number };
type Phase = 'serve'|'receive';
type PlayerPath = { start:Point; move?:Point; server?:boolean };
type RotationPlans = Record<string,PlayerPath>;
type EditMode = 'start'|'move'|null;

const STORAGE_KEY='scoreflow-rotation-studio-v2';
const rotationPoints:Point[]=[{x:18,y:24},{x:36,y:24},{x:36,y:72},{x:18,y:72},{x:8,y:72},{x:8,y:24}];

export default function RotationPage(){
  const workspace=useWorkspace();
  const courtRef=useRef<HTMLDivElement>(null);
  const roster=useMemo(()=>workspace.rosterMemberships
    .filter((membership)=>membership.teamId===workspace.activeTeamId&&membership.seasonId===workspace.activeSeasonId)
    .map((membership)=>({membership,player:workspace.players.find((player)=>player.id===membership.playerId)}))
    .filter((row):row is {membership:RosterMembership;player:Player}=>row.player!==undefined)
    .filter((row)=>!row.player.archived&&row.membership.status==='active'),[workspace.activeSeasonId,workspace.activeTeamId,workspace.players,workspace.rosterMemberships]);
  const preferred=useMemo<RotationPlayer[]>(()=>roster.filter(({membership})=>membership.starter&&!membership.libero).slice(0,6).map(toRotationPlayer),[roster]);
  const fallback=useMemo<RotationPlayer[]>(()=>roster.filter(({membership})=>!membership.libero).slice(0,6).map(toRotationPlayer),[roster]);
  const lineup=preferred.length===6?preferred:fallback;
  const [rotation,setRotation]=useState(1);
  const [phase,setPhase]=useState<Phase>('receive');
  const [plans,setPlans]=useState<RotationPlans>(()=>readPlans(lineup));
  const [selectedId,setSelectedId]=useState('');
  const [editMode,setEditMode]=useState<EditMode>(null);
  const [dragging,setDragging]=useState(false);
  const [showPaths,setShowPaths]=useState(true);
  const [isRunning,setIsRunning]=useState(false);
  const [note,setNote]=useState('Base serve-receive alignment.');
  const [flash,setFlash]=useState('');
  const style={'--rotation-primary':workspace.activeTeam?.primaryColor??'#ef3340','--rotation-secondary':workspace.activeTeam?.secondaryColor??'#f4c95d'} as CSSProperties;
  const planKey=(playerId:string)=>`${rotation}:${phase}:${playerId}`;
  const pathFor=(playerId:string,index:number):PlayerPath=>plans[planKey(playerId)]??{start:rotationPoints[(index+rotation-1)%6]};

  function savePlans(next:RotationPlans){setPlans(next);localStorage.setItem(STORAGE_KEY,JSON.stringify(next))}
  function updatePath(playerId:string,index:number,patch:Partial<PlayerPath>){const key=planKey(playerId);savePlans({...plans,[key]:{...pathFor(playerId,index),...patch}})}
  function changeRotation(next:number){setRotation(next<1?6:next>6?1:next);setSelectedId('');setEditMode(null);setIsRunning(false)}
  function chooseTool(mode:EditMode){setEditMode(mode);setIsRunning(false);if(mode)setFlash(mode==='start'?'Drag the solid player to set Position 1':'Drag the ghost player to set Position 2');window.setTimeout(()=>setFlash(''),1200)}
  function toggleServer(playerId:string,index:number){if(phase!=='serve')setPhase('serve');const current=pathFor(playerId,index).server;const next={...plans};Object.keys(next).filter((key)=>key.startsWith(`${rotation}:serve:`)).forEach((key)=>{next[key]={...next[key],server:false}});const key=`${rotation}:serve:${playerId}`;next[key]={...(next[key]??pathFor(playerId,index)),server:!current};savePlans(next);setSelectedId('');setEditMode(null)}
  function clearPath(playerId:string,index:number){const key=planKey(playerId);savePlans({...plans,[key]:{start:rotationPoints[(index+rotation-1)%6]}});setSelectedId('');setEditMode(null)}
  function pointFromEvent(event:ReactPointerEvent):Point{const rect=courtRef.current?.getBoundingClientRect();if(!rect)return{x:18,y:24};return{x:Math.max(4,Math.min(58,((event.clientX-rect.left)/rect.width)*100)),y:Math.max(9,Math.min(91,((event.clientY-rect.top)/rect.height)*100))}}
  function beginDrag(event:ReactPointerEvent,playerId:string,mode:Exclude<EditMode,null>){event.preventDefault();event.currentTarget.setPointerCapture(event.pointerId);setSelectedId(playerId);setEditMode(mode);setDragging(true);setIsRunning(false)}
  function drag(event:ReactPointerEvent,playerId:string,index:number,mode:Exclude<EditMode,null>){if(!dragging||selectedId!==playerId||editMode!==mode)return;const point=pointFromEvent(event);updatePath(playerId,index,mode==='start'?{start:point}:{move:point})}
  function endDrag(){if(!dragging)return;setDragging(false);setEditMode(null);setFlash('Movement position saved');window.setTimeout(()=>setFlash(''),900)}
  function exportRotation(){window.print()}
  async function shareRotation(){const rows=lineup.map((player,index)=>{const path=pathFor(player.id,index);return `#${player.number} ${player.name}: (${Math.round(path.start.x)},${Math.round(path.start.y)})${path.move?` → (${Math.round(path.move.x)},${Math.round(path.move.y)})`:''}${path.server?' · SERVER':''}`});const text=`${workspace.activeTeam?.name??'Team'} · Rotation ${rotation} · ${phase.toUpperCase()}\n${rows.join('\n')}\n\n${note}`;try{if(navigator.share)await navigator.share({title:`Rotation Studio · R${rotation}`,text});else await navigator.clipboard.writeText(text);setFlash(navigator.share?'Rotation shared':'Rotation copied')}catch{return}window.setTimeout(()=>setFlash(''),1200)}

  return <div className="rotation-studio" style={style}>
    <section className="rotation-toolbar panel"><div><p className="eyebrow">Rotation Studio</p><h2>{workspace.activeTeam?.name??'Active team'}</h2><span>{workspace.activeSeason?.name??'Season not selected'}</span></div><div className="rotation-toolbar-actions"><button className="button button-quiet" type="button" onClick={exportRotation}>Export</button><button className="button button-primary" type="button" onClick={shareRotation}>Send to team</button></div></section>
    <div className="rotation-workspace">
      <section className="rotation-court-card panel"><div className="rotation-court-heading"><div><p className="eyebrow">{phase} plan</p><h3>Rotation {rotation}</h3></div><span className="rotation-status"><i/> Tap a player to edit</span></div>
        <div className={`rotation-court${showPaths?' show-paths':''}${isRunning?' is-running':''}`} ref={courtRef} onPointerUp={endDrag} onPointerCancel={endDrag}>
          <div className="rotation-home-label">{workspace.activeTeam?.name??'Home team'}</div><div className="rotation-opponent-label">Opponent</div><div className="rotation-net"><span>NET</span></div><div className="rotation-attack-line"/>
          {lineup.map((player,index)=>{const path=pathFor(player.id,index);const current=isRunning&&path.move?path.move:path.start;const dx=path.move?path.move.x-path.start.x:0;const dy=path.move?path.move.y-path.start.y:0;const angle=Math.atan2(dy,dx)*180/Math.PI;const length=Math.hypot(dx,dy);return <div key={player.id}>
            {showPaths&&path.move&&<span className={`studio-path${selectedId===player.id?' is-selected':''}`} style={{left:`${path.start.x}%`,top:`${path.start.y}%`,width:`${length}%`,transform:`rotate(${angle}deg)`}}><i/></span>}
            {path.move&&!isRunning&&<button className={`rotation-player ghost${selectedId===player.id&&editMode==='move'?' is-editing':''}`} style={{left:`${path.move.x}%`,top:`${path.move.y}%`}} onPointerDown={(event)=>beginDrag(event,player.id,'move')} onPointerMove={(event)=>drag(event,player.id,index,'move')} type="button" aria-label={`Move position for ${player.name}`}><PlayerCopy player={player}/><em>2</em></button>}
            <button className={`rotation-player solid${selectedId===player.id?' is-selected':''}${path.server?' is-server':''}`} style={{left:`${current.x}%`,top:`${current.y}%`}} onClick={()=>{if(!dragging){setSelectedId(selectedId===player.id?'':player.id);setEditMode(null)}} onPointerDown={(event)=>{if(editMode==='start')beginDrag(event,player.id,'start')}} onPointerMove={(event)=>drag(event,player.id,index,'start')} type="button"><PlayerCopy player={player}/><em>1</em>{path.server&&<b className="server-badge">SERVER</b>}</button>
            {selectedId===player.id&&!dragging&&<div className="rotation-radial" style={{left:`${path.start.x}%`,top:`${path.start.y}%`}}><button onClick={()=>chooseTool('start')} type="button">Set Start</button><button onClick={()=>chooseTool('move')} type="button">Set Move</button><button className={path.server?'is-active':''} onClick={()=>toggleServer(player.id,index)} type="button">Server</button><button onClick={()=>clearPath(player.id,index)} type="button">Clear</button></div>}
          </div>})}
        </div>
      </section>
      <aside className="rotation-controls panel"><div className="rotation-control-heading"><div><p className="eyebrow">Controls</p><h3>Rotation Studio</h3></div><strong>R{rotation}</strong></div>
        <div className="phase-toggle"><button className={phase==='serve'?'is-active':''} onClick={()=>{setPhase('serve');setSelectedId('');setIsRunning(false)}} type="button">Serve</button><button className={phase==='receive'?'is-active':''} onClick={()=>{setPhase('receive');setSelectedId('');setIsRunning(false)}} type="button">Receive</button></div>
        <div className="rotation-stepper"><button type="button" onClick={()=>changeRotation(rotation-1)}>‹</button><div>{[1,2,3,4,5,6].map((value)=><button className={rotation===value?'is-active':''} key={value} onClick={()=>changeRotation(value)} type="button">R{value}</button>)}</div><button type="button" onClick={()=>changeRotation(rotation+1)}>›</button></div>
        <div className="rotation-playback"><button className={isRunning?'is-active':''} onClick={()=>setIsRunning((current)=>!current)} type="button">{isRunning?'Reset to Start':'Run Movement'}</button><button className={showPaths?'is-active':''} onClick={()=>setShowPaths((current)=>!current)} type="button">{showPaths?'Hide Paths':'Show Paths'}</button></div>
        <section className="rotation-lineup-list"><header><span>{phase} assignments</span><small>Start → Move</small></header>{lineup.map((player,index)=>{const path=pathFor(player.id,index);return <article key={player.id}><span>P{((index+rotation-1)%6)+1}</span><div><strong>#{player.number} {player.name}</strong><small>{path.move?'Movement saved':'Start only'}{path.server?' · Server':''}</small></div>{player.captain&&<em>Captain</em>}</article>})}</section>
        <label className="rotation-note"><span>Coach note</span><textarea value={note} onChange={(event)=>setNote(event.target.value)} rows={3}/></label><div className="rotation-share-actions"><button type="button" onClick={exportRotation}>Export plan</button><button type="button" onClick={shareRotation}>Send to team</button></div>
      </aside>
    </div>{flash&&<div className="rotation-flash">{flash}</div>}
  </div>
}

function PlayerCopy({player}:{player:RotationPlayer}){return <><>{player.photoUrl&&<img src={player.photoUrl} alt=""/>}</><span className="rotation-player-copy"><b>#{player.number}</b><strong>{player.name}</strong><small>{player.position}</small></span><span className="rotation-player-badges">{player.captain&&<i className="captain">C</i>}{player.libero&&<i className="libero">L</i>}</span></>}
function toRotationPlayer({membership,player}:{membership:RosterMembership;player:Player}):RotationPlayer{return{id:player.id,name:player.preferredName||player.firstName,number:membership.jerseyNumber||'—',position:membership.position||player.primaryPosition||'—',captain:membership.captain,libero:membership.libero,photoUrl:player.photoUrl||undefined}}
function readPlans(lineup:RotationPlayer[]):RotationPlans{try{const saved=JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}') as RotationPlans;if(Object.keys(saved).length)return saved}catch{/* use defaults */}const defaults:RotationPlans={};for(let rotation=1;rotation<=6;rotation+=1){for(const phase of ['serve','receive'] as Phase[]){lineup.forEach((player,index)=>{defaults[`${rotation}:${phase}:${player.id}`]={start:rotationPoints[(index+rotation-1)%6]}})}}return defaults}
