const zone='Africa/Casablanca';
const formatter=new Intl.DateTimeFormat('en-GB',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'});
export function casablancaLocal(value:Date|string|null|undefined){
 if(!value)return '';const date=new Date(value);if(!Number.isFinite(date.getTime()))return '';
 const parts=Object.fromEntries(formatter.formatToParts(date).map(part=>[part.type,part.value]));return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
}
export function casablancaInstant(value:unknown):Date|null{
 if(!value)return null;if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value))throw new Error('Enter a valid Casablanca date and time.');
 const intended=Date.parse(`${value}:00Z`);if(!Number.isFinite(intended)||new Date(intended).toISOString().slice(0,16)!==value)throw new Error('Enter a valid calendar date.');
 let candidate=intended;for(let attempt=0;attempt<3;attempt++){const rendered=casablancaLocal(new Date(candidate));const renderedUtc=Date.parse(`${rendered}:00Z`);candidate+=intended-renderedUtc;}
 const date=new Date(candidate);if(casablancaLocal(date)!==value||casablancaLocal(new Date(candidate-3600000))===value||casablancaLocal(new Date(candidate+3600000))===value)throw new Error('Choose a time outside the clock-change hour.');
 return date;
}
