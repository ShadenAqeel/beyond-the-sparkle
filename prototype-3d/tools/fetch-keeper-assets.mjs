import fs from 'node:fs';
import {inflateRawSync} from 'node:zlib';

// Fetch selected graphical assets from the official CC0 pack. No application
// code is downloaded/executed, and no 267 MB pack is shipped with the game.
const url='https://files2.makehumancommunity.org/asset_packs/makehuman_system_assets/makehuman_system_assets_cc0.zip';
const directory=new URL('../art-source/makehuman/',import.meta.url);
async function range(start,end){
  const r=await fetch(url,{headers:{Range:start<0?`bytes=${start}`:`bytes=${start}-${end}`}});
  if(r.status!==206)throw Error(`Range requests unavailable: ${r.status}`);
  return Buffer.from(await r.arrayBuffer());
}
const tail=await range(-65536,'');
const end=tail.lastIndexOf(Buffer.from([0x50,0x4b,0x05,0x06]));
if(end<0)throw Error('ZIP directory not found');
const size=tail.readUInt32LE(end+12),offset=tail.readUInt32LE(end+16);
const central=await range(offset,offset+size-1),entries=[];
for(let p=0;p<central.length;){
  if(central.readUInt32LE(p)!==0x02014b50)break;
  const length=central.readUInt16LE(p+28),extra=central.readUInt16LE(p+30),comment=central.readUInt16LE(p+32);
  const name=central.subarray(p+46,p+46+length).toString();
  entries.push({name,method:central.readUInt16LE(p+10),bytes:central.readUInt32LE(p+20),offset:central.readUInt32LE(p+42)});p+=46+length+extra+comment;
}
fs.writeFileSync(new URL('pack-catalog.json',directory),JSON.stringify(entries,null,2));
const names=process.argv.slice(2);
if(!names.length){console.log(entries.filter(e=>/diffuse2.png$|hair.*(?:obj|mhclo|png)$|eyes.*(?:png|mhmat)$/.test(e.name)).map(e=>e.name).slice(0,100).join('\n'));process.exit(0);}
for(const name of names){
  const entry=entries.find(e=>e.name===name||e.name.endsWith('/'+name));
  if(!entry)throw Error('Missing pack entry: '+name);
  const header=await range(entry.offset,entry.offset+29),start=entry.offset+30+header.readUInt16LE(26)+header.readUInt16LE(28);
  const compressed=await range(start,start+entry.bytes-1);
  const data=entry.method===8?inflateRawSync(compressed):compressed;
  const destination=entry.name.replaceAll('/','__');fs.writeFileSync(new URL(destination,directory),data);
  console.log(destination,data.length);
}
