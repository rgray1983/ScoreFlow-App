import { useState, type CSSProperties, type KeyboardEvent } from 'react';

export type StatAction = 'Kill'|'Attack error'|'Ace'|'Serve error'|'Dig'|'Block touch'|'Solo block'|'Assist'|'Pass 0'|'Pass 1'|'Pass 2'|'Pass 3';

type WheelPlayer = { number:string; name:string; position:string; libero:boolean };
type Props = {
  player: WheelPlayer;
  actions: StatAction[];
  position: { x:number; y:number };
  onSelect: (action:StatAction)=>void;
  onClose: ()=>void;
};

type Tone = 'positive'|'error'|'defense'|'setting'|'passing';
const actionMeta:Record<StatAction,{icon:string;shortLabel:string;tone:Tone}> = {
  'Kill': { icon:'K', shortLabel:'Kill', tone:'positive' },
  'Attack error': { icon:'AE', shortLabel:'Attack err', tone:'error' },
  'Ace': { icon:'A', shortLabel:'Ace', tone:'positive' },
  'Serve error': { icon:'SE', shortLabel:'Serve err', tone:'error' },
  'Dig': { icon:'D', shortLabel:'Dig', tone:'defense' },
  'Block touch': { icon:'BT', shortLabel:'Block touch', tone:'defense' },
  'Solo block': { icon:'SB', shortLabel:'Solo block', tone:'defense' },
  'Assist': { icon:'AS', shortLabel:'Assist', tone:'setting' },
  'Pass 0': { icon:'P0', shortLabel:'Pass 0', tone:'passing' },
  'Pass 1': { icon:'P1', shortLabel:'Pass 1', tone:'passing' },
  'Pass 2': { icon:'P2', shortLabel:'Pass 2', tone:'passing' },
  'Pass 3': { icon:'P3', shortLabel:'Pass 3', tone:'passing' }
};

const VIEWBOX_SIZE=400;
const CENTER=VIEWBOX_SIZE/2;
const OUTER_RADIUS=174;
const INNER_RADIUS=104;
const ANGULAR_GAP=1.6;
const CLOSE_DURATION=180;

export default function PlayerActionWheel({ player, actions, position, onSelect, onClose }:Props){
  const [closing,setClosing]=useState(false);
  const safeX=Math.max(21,Math.min(40,position.x));
  const safeY=Math.max(30,Math.min(70,position.y));
  const step=360/actions.length;

  function closeWheel(action?:StatAction){
    if(closing)return;
    setClosing(true);
    window.setTimeout(()=>{
      if(action)onSelect(action);
      else onClose();
    },CLOSE_DURATION);
  }

  return <div className={`stat-wheel-backdrop${closing?' is-closing':''}`} onPointerDown={()=>closeWheel()}>
    <div className={`radial-wheel-shell${closing?' is-closing':''}`} style={{left:`${safeX}%`,top:`${safeY}%`} as CSSProperties} onPointerDown={(event)=>event.stopPropagation()} role="dialog" aria-label={`Record a stat for ${player.name}`}>
      <svg className="radial-wheel-svg" viewBox={`0 0 ${VIEWBOX_SIZE} ${VIEWBOX_SIZE}`} aria-hidden="true">
        <defs>
          <filter id="wheel-glass-shadow" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="4" stdDeviation="5" floodColor="#020814" floodOpacity=".42" />
          </filter>
        </defs>
        <circle className="radial-wheel-track" cx={CENTER} cy={CENTER} r={(OUTER_RADIUS+INNER_RADIUS)/2} />
        {actions.map((action,index)=>{
          const start=-90+(index*step)+(ANGULAR_GAP/2);
          const end=-90+((index+1)*step)-(ANGULAR_GAP/2);
          const middle=(start+end)/2;
          const labelPoint=polarPoint(CENTER,CENTER,(OUTER_RADIUS+INNER_RADIUS)/2,middle);
          const meta=actionMeta[action];
          const activate=()=>closeWheel(action);
          const onKeyDown=(event:KeyboardEvent<SVGGElement>)=>{
            if(event.key==='Enter'||event.key===' '){event.preventDefault();activate();}
          };
          const segmentPath=annularSegmentPath(CENTER,CENTER,INNER_RADIUS,OUTER_RADIUS,start,end);
          return <g className={`radial-wheel-segment tone-${meta.tone}`} key={action} role="button" tabIndex={closing?-1:0} aria-label={action} onClick={activate} onKeyDown={onKeyDown}>
            <path className="radial-wheel-segment-base" d={segmentPath} filter="url(#wheel-glass-shadow)" />
            <path className="radial-wheel-segment-gloss" d={segmentPath} />
            <text className="radial-wheel-label" x={labelPoint.x} y={labelPoint.y} textAnchor="middle">
              <tspan className="radial-wheel-icon" x={labelPoint.x} dy="-.28em">{meta.icon}</tspan>
              <tspan className="radial-wheel-name" x={labelPoint.x} dy="1.55em">{meta.shortLabel}</tspan>
            </text>
          </g>;
        })}
      </svg>
      <div className={`radial-wheel-player${player.libero?' is-libero':''}`}>
        <b>#{player.number}</b>
        <strong>{player.name.split(' ')[0]}</strong>
        <small>{player.position}</small>
      </div>
      <button className="radial-wheel-close" onClick={()=>closeWheel()} type="button" aria-label="Close stat wheel">×</button>
    </div>
  </div>;
}

function polarPoint(cx:number,cy:number,radius:number,angleDegrees:number){
  const angle=(angleDegrees*Math.PI)/180;
  return {x:cx+(radius*Math.cos(angle)),y:cy+(radius*Math.sin(angle))};
}

function annularSegmentPath(cx:number,cy:number,innerRadius:number,outerRadius:number,startAngle:number,endAngle:number){
  const outerStart=polarPoint(cx,cy,outerRadius,startAngle);
  const outerEnd=polarPoint(cx,cy,outerRadius,endAngle);
  const innerEnd=polarPoint(cx,cy,innerRadius,endAngle);
  const innerStart=polarPoint(cx,cy,innerRadius,startAngle);
  const largeArc=endAngle-startAngle>180?1:0;
  return [
    `M ${outerStart.x} ${outerStart.y}`,
    `A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${outerEnd.x} ${outerEnd.y}`,
    `L ${innerEnd.x} ${innerEnd.y}`,
    `A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${innerStart.x} ${innerStart.y}`,
    'Z'
  ].join(' ');
}
